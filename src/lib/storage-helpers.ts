import { supabase } from "@/lib/supabase";

/**
 * Open a stored file in a new tab AND trigger a download with the original
 * filename. Useful for documents the coach needs to keep a copy of (birth
 * certs, affidavits) where browsers may not render the file inline (HEIC,
 * some PDFs on mobile Safari).
 */
export async function viewAndDownloadDoc(
  filePath: string,
  fileName: string,
  bucket = "player-documents",
  expiresIn = 300
): Promise<void> {
  if (!supabase || !filePath) return;

  const [inlineRes, downloadRes] = await Promise.all([
    supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn),
    supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn, { download: fileName || true }),
  ]);

  if (inlineRes.data?.signedUrl) {
    window.open(inlineRes.data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (downloadRes.data?.signedUrl) {
    const a = document.createElement("a");
    a.href = downloadRes.data.signedUrl;
    a.rel = "noopener";
    if (fileName) a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
