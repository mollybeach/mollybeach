import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Season } from "./seasons";
import type { SeasonLayout } from "./arrangement";

/**
 * The collection of saved layouts, kept in Supabase (table palais_layouts,
 * see supabase/migrations).
 *
 * Anyone can read the collection, so every visitor gets each season's default.
 * Saving, changing and deleting need Molly signed in: the database checks it
 * (row level security), the buttons only follow along.
 *
 * The client is loaded the first time it's needed, so the room doesn't wait
 * on it. Without REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY set,
 * none of this runs and the room uses the layouts bundled in the code.
 */

const URL = process.env.REACT_APP_SUPABASE_URL;
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const dbConfigured = Boolean(URL && KEY);

export type Device = "desktop" | "phone";

export interface SavedLayout extends SeasonLayout {
  id: string;
  name: string;
  season: Season;
  device: Device;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

let client: Promise<SupabaseClient> | undefined;
export function db(): Promise<SupabaseClient> {
  if (!dbConfigured) return Promise.reject(new Error("Supabase isn't set up"));
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL!, KEY!, { auth: { persistSession: true, storageKey: "palais-auth" } }),
  );
  return client;
}

const TABLE = "palais_layouts";
const COLUMNS = "id, name, season, device, stage, props, is_default, created_at, updated_at";

function must<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

export async function listLayouts(device: Device = "desktop"): Promise<SavedLayout[]> {
  const sb = await db();
  return must(await sb.from(TABLE).select(COLUMNS).eq("device", device).order("created_at", { ascending: false })) as SavedLayout[];
}

export async function saveLayout(layout: {
  name: string;
  season: Season;
  device: Device;
  stage: SeasonLayout["stage"];
  props: SeasonLayout["props"];
}): Promise<SavedLayout> {
  const sb = await db();
  return must(await sb.from(TABLE).insert(layout).select(COLUMNS).single()) as SavedLayout;
}

export async function updateLayout(
  id: string,
  change: Partial<Pick<SavedLayout, "name" | "season" | "stage" | "props">>,
): Promise<SavedLayout> {
  const sb = await db();
  return must(await sb.from(TABLE).update(change).eq("id", id).select(COLUMNS).single()) as SavedLayout;
}

export async function deleteLayout(id: string): Promise<void> {
  const sb = await db();
  must(await sb.from(TABLE).delete().eq("id", id));
}

export async function makeDefault(id: string): Promise<void> {
  const sb = await db();
  must(await sb.rpc("palais_make_default", { layout_id: id }));
}

/* ---- signing in ---- */

export interface Editor {
  email: string;
  /** listed in palais_editors, so the database will accept saves */
  canSave: boolean;
}

async function editorOf(sb: SupabaseClient, session: Session | null): Promise<Editor | null> {
  if (!session) return null;
  const { data } = await sb.rpc("palais_is_editor");
  return { email: session.user.email ?? "", canSave: data === true };
}

export async function currentEditor(): Promise<Editor | null> {
  if (!dbConfigured) return null;
  const sb = await db();
  const { data } = await sb.auth.getSession();
  return editorOf(sb, data.session);
}

export function onEditorChange(cb: (editor: Editor | null) => void): () => void {
  if (!dbConfigured) return () => {};
  let off = () => {};
  let gone = false;
  db().then((sb) => {
    if (gone) return;
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      // Supabase asks that nothing awaits inside this callback
      setTimeout(() => editorOf(sb, session).then((e) => !gone && cb(e)), 0);
    });
    off = () => data.subscription.unsubscribe();
  });
  return () => {
    gone = true;
    off();
  };
}

export async function signIn(email: string, password: string): Promise<void> {
  const sb = await db();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const sb = await db();
  await sb.auth.signOut();
}
