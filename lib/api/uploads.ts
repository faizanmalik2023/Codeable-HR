import { api } from "@/lib/api/client";

export interface UploadResult {
  key: string;
  url: string;
}

/** Multipart upload → `POST /uploads`. `folder` groups assets server-side. */
export async function uploadFile(file: File, folder?: string): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (folder) form.append("folder", folder);
  return api.upload<UploadResult>("/uploads", form);
}
