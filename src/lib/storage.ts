import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_UPLOADS_BUCKET || "uploads";

let cachedClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

export function isObjectStorageConfigured() {
  return !!getSupabase();
}

/**
 * Upload a file (Buffer) to either Supabase Storage (production)
 * or the local public/uploads directory (development fallback).
 * Returns a publicly-accessible URL.
 */
export async function uploadFile({
  buffer,
  filename,
  subdir,
  contentType,
}: {
  buffer: Buffer;
  filename: string;
  subdir: string;
  contentType: string;
}): Promise<string> {
  const supabase = getSupabase();
  if (supabase) {
    const key = `${subdir}/${filename}`;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(key, buffer, { contentType, upsert: false });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  // Local filesystem fallback (works in dev + self-hosted Docker w/ volume mount)
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}
