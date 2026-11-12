import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "../contracts";
import { supabase } from "./shared";

export type AuthSession = Session;
export function toProfile(session: Pick<Session, "user"> | null): UserProfile | null {
  if (!session) return null;
  const m = session.user.user_metadata ?? {};
  const name = m["display_name"] ?? m["full_name"] ?? m["name"];
  return { id: session.user.id, email: session.user.email ?? null, displayName: typeof name === "string" && name.trim() ? name : null };
}
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
export function onAuthChange(cb: (event: string, session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(cb);
  return () => data.subscription.unsubscribe();
}
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
/** Returns true when a session started immediately, false when email confirmation is required. */
export async function signUp(email: string, password: string, redirectTo: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
  return !!data.session;
}
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
  if (error) throw error;
}
