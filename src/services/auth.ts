import { supabase } from "@/services/supabase";
import type { AdminSession } from "@/types/database";

function toAdminSession(user: NonNullable<Awaited<ReturnType<NonNullable<typeof supabase>["auth"]["getUser"]>>["data"]["user"]>): AdminSession {
  return {
    userId: user.id,
    email: user.email ?? null,
    isAdmin: user.app_metadata?.role === "admin"
  };
}

export async function getCurrentAdminSession(): Promise<AdminSession | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const session = toAdminSession(data.user);
  return session.isAdmin ? session : null;
}

export async function signInAdmin(email: string, password: string) {
  if (!supabase) throw new Error("Configure a URL real do Supabase para usar login admin.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Usuario nao encontrado.");
  const session = toAdminSession(data.user);
  if (!session.isAdmin) {
    await supabase.auth.signOut();
    throw new Error("Apenas administradores podem acessar esta area.");
  }
  return session;
}

export async function signOutAdmin() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
