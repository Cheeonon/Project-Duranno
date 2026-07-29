import { supabase } from '@/lib/supabase';

const BUCKET = 'member-photos';

// Signed URLs are re-fetched on every useMembers() load (mount + refresh()),
// so a long expiry just avoids re-signing chatter for this low-traffic app.
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 6;

export function buildMemberPhotoPath(memberId: string, ext: string) {
  return `${memberId}/${Date.now()}.${ext}`;
}

export async function uploadMemberPhoto(memberId: string, localUri: string, mimeType: string) {
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = buildMemberPhotoPath(memberId, ext);
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
}

export async function deleteMemberPhoto(path: string | null | undefined) {
  if (!path) {
    return;
  }

  // Best-effort cleanup — a failed delete (e.g. already gone, or the caller
  // lost permission) shouldn't block whatever save/cancel flow triggered it.
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}

export async function signMemberPhotoUrls(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths));
  const urlByPath = new Map<string, string>();

  if (uniquePaths.length === 0) {
    return urlByPath;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (error || !data) {
    return urlByPath;
  }

  for (const entry of data) {
    if (entry.path && entry.signedUrl) {
      urlByPath.set(entry.path, entry.signedUrl);
    }
  }

  return urlByPath;
}
