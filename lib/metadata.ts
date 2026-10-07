import dns from "node:dns/promises";
import net from "node:net";
import { extractYoutubeId } from "@/lib/video";

export interface UrlMetadata {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  source_domain: string;
  content_type: string | null;
  media_url: string | null;
  page_text: string | null;
}

const FETCH_TIMEOUT_MS = 6000;
const MAX_RESPONSE_BYTES = 2_000_000; // 2MB cap — enough for a <head> full of meta tags

/**
 * True if an IP address is loopback, link-local, or in a private range —
 * the SSRF guard for Section 19's /api/metadata requirement. Covers the
 * common IPv4 private/reserved blocks plus IPv6 loopback/ULA/link-local.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254!)
    if (a === 0) return true;
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (ULA)
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — re-check the embedded v4 address
      return isPrivateOrReservedIp(lower.replace("::ffff:", ""));
    }
    return false;
  }
  return true; // couldn't parse — fail closed
}

async function assertSafeTarget(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (addresses.length === 0) throw new Error("Could not resolve host");
  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new Error("Refusing to fetch a private/internal address");
    }
  }
}

function resolveUrl(maybeRelative: string, base: string): string | null {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/**
 * Fetches and parses <head> metadata for a URL the user is saving.
 * Never throws for "normal" failures (404, timeout, unparseable HTML) —
 * returns null so the caller can save the raw URL anyway (Section 5:
 * saving must never block on this).
 */
function extractVisibleText(html: string): string | null {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  const text = withoutNoise
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text ? text.slice(0, 16000) : null;
}

function extractMediaUrl(html: string, baseUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:player:stream["'][^>]+content=["']([^"']+)["']/i,
    /["']contentUrl["']\s*:\s*["']([^"']+\.(?:mp4|m3u8)(?:[^"']*)?)["']/i,
    /["']video_url["']\s*:\s*["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const resolved = resolveUrl(match[1].replace(/\\u0026/g, "&"), baseUrl);
    if (resolved && /^https?:\/\//i.test(resolved)) return resolved;
  }
  return null;
}

export async function fetchUrlMetadata(rawUrl: string): Promise<UrlMetadata | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  try {
    await assertSafeTarget(url);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "RecallBot/1.0 (+https://recall.app)" },
    });

    if (!res.ok || !res.body) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return {
        title: null,
        description: null,
        thumbnail_url: null,
        favicon_url: null,
        source_domain: url.hostname,
        content_type: contentType.includes("image") ? "image" : contentType.includes("video") ? "video" : contentType.includes("pdf") ? "pdf" : null,
        media_url: contentType.includes("image") || contentType.includes("video") || contentType.includes("pdf") ? url.toString() : null,
        page_text: null,
      };
    }

    // Read with a hard cap so a malicious page can't exhaust memory.
    const reader = res.body.getReader();
    let received = 0;
    let html = "";
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        break;
      }
      html += decoder.decode(value, { stream: true });
    }

    const title = extractMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
      /<title[^>]*>([^<]*)<\/title>/i,
    ]);
    const description = extractMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    ]);
    const ogImage = extractMeta(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i,
    ]);
    const iconHref = extractMeta(html, [
      /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i,
    ]);

    const contentTypeGuess = guessContentType(url.hostname, html);
    const mediaUrl = extractMediaUrl(html, url.toString());
    return {
      title,
      description,
      thumbnail_url: ogImage ? resolveUrl(ogImage, url.toString()) : getYoutubeThumbnail(url.toString()),
      favicon_url: iconHref
        ? resolveUrl(iconHref, url.toString())
        : `${url.protocol}//${url.hostname}/favicon.ico`,
      source_domain: url.hostname.replace(/^www\./, ""),
      content_type: contentTypeGuess,
      media_url: mediaUrl,
      page_text: extractVisibleText(html),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Hostname-only content-type guess — deliberately independent of
 * whether the page fetch itself succeeded. Instagram in particular
 * frequently blocks or serves a login-wall page to non-browser
 * requests, so relying on scraped HTML alone left every Instagram save
 * with no content_type and therefore no video treatment at all. This
 * runs first, both here and as a fallback in createSavedItem for when
 * the whole fetch fails outright.
 */
export function guessContentTypeFromHostname(hostname: string): string | null {
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(hostname)) return "video";
  if (/github\.com|gitlab\.com/.test(hostname)) return "repo";
  if (/pinterest\./.test(hostname)) return "image";
  if (/instagram\.com/.test(hostname)) return "video";
  if (/tiktok\.com/.test(hostname)) return "video";
  return null;
}

/**
 * YouTube serves a predictable, unauthenticated thumbnail for any video
 * ID via a static image CDN — no scraping required. Used as a fallback
 * (and preferred first choice) so a YouTube save always gets a working
 * thumbnail even if the HTML fetch above fails or gets rate-limited.
 */
export function getYoutubeThumbnail(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function guessContentType(hostname: string, html: string): string | null {
  const fromHostname = guessContentTypeFromHostname(hostname);
  if (fromHostname) return fromHostname;
  if (/<meta[^>]+property=["']og:type["'][^>]+content=["']article["']/i.test(html))
    return "article";
  return null;
}
