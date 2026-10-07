/**
 * Grabs a frame from an uploaded video file and returns it as a JPEG
 * Blob, entirely in the browser (no server round-trip). Used because an
 * uploaded video has no OG image to scrape the way a saved URL does —
 * without this, uploaded videos had a working hover-preview but no
 * thumbnail to show at rest.
 *
 * Never throws — resolves null on any failure (corrupt file, unsupported
 * codec, timeout) so a failed capture never blocks the save itself.
 */
export function captureVideoThumbnail(file: File, seekSeconds = 1): Promise<Blob | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timeout = setTimeout(() => finish(null), 8000);

    let objectUrl: string;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      clearTimeout(timeout);
      resolve(null);
      return;
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;

    video.addEventListener("loadedmetadata", () => {
      const target = Math.min(seekSeconds, video.duration ? video.duration / 2 : 0);
      video.currentTime = Number.isFinite(target) ? target : 0;
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (!canvas.width || !canvas.height) return finish(null);

        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    });

    video.addEventListener("error", () => finish(null));
  });
}
