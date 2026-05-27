import { CACHE_TIME } from "@/constants/theme";
import { safeAsyncStorage } from "@/storage/safeAsyncStorage";

type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};

const prefix = "nossa-pelada:";

export async function saveLocalCache<T>(key: string, data: T) {
  const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data };
  await safeAsyncStorage.setItem(prefix + key, JSON.stringify(envelope));
}

export async function readLocalCache<T>(key: string): Promise<T | null> {
  const raw = await safeAsyncStorage.getItem(prefix + key);
  if (!raw) return null;

  try {
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - envelope.savedAt > CACHE_TIME.freshData) return envelope.data;
    return envelope.data;
  } catch {
    return null;
  }
}

export async function clearLocalCache() {
  const keys = await safeAsyncStorage.getAllKeys();
  const ours = keys.filter((key) => key.startsWith(prefix) || key.startsWith("REACT_QUERY_OFFLINE_CACHE"));
  await Promise.all(ours.map((key) => safeAsyncStorage.removeItem(key)));
}
