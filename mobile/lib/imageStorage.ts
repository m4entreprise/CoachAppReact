import * as FileSystem from 'expo-file-system/legacy';

const DIR = `${FileSystem.documentDirectory ?? ''}profile-images/`;

async function ensureDir(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(DIR);
  if (info.exists) return;
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

function guessExt(uri: string): string {
  const clean = uri.split('?')[0];
  const idx = clean.lastIndexOf('.');
  if (idx === -1) return 'jpg';
  const ext = clean.slice(idx + 1).toLowerCase();
  if (!ext) return 'jpg';
  if (ext.length > 6) return 'jpg';
  return ext;
}

export async function persistImageAsync(sourceUri: string, prefix: string): Promise<string> {
  if (!FileSystem.documentDirectory) return sourceUri;

  if (sourceUri.startsWith(DIR)) return sourceUri;

  await ensureDir();

  const ext = guessExt(sourceUri);
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
  const dest = `${DIR}${fileName}`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function deletePersistedImageAsync(uri: string | undefined | null): Promise<void> {
  if (!uri) return;
  if (!FileSystem.documentDirectory) return;
  if (!uri.startsWith(DIR)) return;

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return;

  await FileSystem.deleteAsync(uri, { idempotent: true });
}
