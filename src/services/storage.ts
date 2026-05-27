import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { requireSupabase } from "@/services/supabase";
import { compressPlayerImage } from "@/utils/images";

export async function uploadPlayerPhoto(uri: string, playerId: string) {
  const compressed = await compressPlayerImage(uri);
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const path = `${playerId}/profile-${Date.now()}.jpg`;
  const client = requireSupabase();
  const { error } = await client.storage
    .from("players")
    .upload(path, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "31536000"
    });

  if (error) throw error;
  return client.storage.from("players").getPublicUrl(path).data.publicUrl;
}

export async function uploadCompetitionLogo(uri: string) {
  const compressed = await compressPlayerImage(uri);
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const path = `logos/logo-${Date.now()}.jpg`;
  const client = requireSupabase();
  const { error } = await client.storage
    .from("competition-logos")
    .upload(path, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "31536000"
    });

  if (error) throw error;
  return client.storage.from("competition-logos").getPublicUrl(path).data.publicUrl;
}

export async function uploadTeamLogo(uri: string) {
  const compressed = await compressPlayerImage(uri);
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const path = `logos/team-${Date.now()}.jpg`;
  const client = requireSupabase();
  const { error } = await client.storage
    .from("team-logos")
    .upload(path, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "31536000"
    });

  if (error) throw error;
  return client.storage.from("team-logos").getPublicUrl(path).data.publicUrl;
}
