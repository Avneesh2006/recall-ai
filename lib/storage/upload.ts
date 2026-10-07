import { createClient } from "@/lib/supabase/client";

const BUCKET = "recall-uploads";

export interface UploadResult {
  storage_path: string;
  public_url: string;
}

/**
 * Uploads a file (or a generated Blob, e.g. a captured video-frame
 * thumbnail) directly from the browser to Supabase Storage, scoped
 * under the current user's own folder (the RLS boundary set up in
 * migration 0005). Returns the storage path + a public URL.
 */
export async function uploadToStorage(
  userId: string,
  file: File | Blob,
  filename?: string,
): Promise<UploadResult | { error: string }> {
  const supabase = createClient();
  const name = filename ?? (file instanceof File ? file.name : `upload.${file.type.split("/")[1] ?? "bin"}`);
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { storage_path: path, public_url: data.publicUrl };
}
