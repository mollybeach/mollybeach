import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Season } from "./seasons";
import type { SeasonLayout } from "./arrangement";
import type { Place } from "./place";

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
  /** which room on the map it's for */
  place: Place;
  season: Season;
  device: Device;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

let client: Promise<SupabaseClient> | undefined;
export function db(): Promise<SupabaseClient> {
  if (!dbConfigured) return Promise.reject(new Error("Supabase isn't set up"));
  client ??= import("@supabase/supabase-js").then(({ createClient }) => {
    const sb = createClient(URL!, KEY!, { auth: { persistSession: true, storageKey: "palais-auth" } });
    // back from signing in: once the session has been read off the address,
    // put the room back in it (signInWith)
    sb.auth.getSession().finally(backInTheRoom);
    return sb;
  });
  return client;
}

/* ---- staying in the room through a sign-in ------------------------------ */

/* The provider sends the browser back with the session in the address's
   #fragment, which is where the room is kept too (#school, #boudoir…), so the
   room is lost and the sign-in lands on the terrace. So the room is put aside
   before leaving, the provider is asked to come back to the page itself, and
   the room goes back in the address once the session has been read. */
const BACK_TO = "palais-back-to";

function backInTheRoom() {
  let room: string | null = null;
  try {
    room = sessionStorage.getItem(BACK_TO);
    sessionStorage.removeItem(BACK_TO);
  } catch {
    return;
  }
  if (!room) return;
  const now = window.location.hash;
  if (now && !/access_token|error=|code=/.test(now)) return;   // they've moved on since
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${room}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

const TABLE = "palais_layouts";
const COLUMNS = "id, name, place, season, device, stage, props, is_default, created_at, updated_at";

function must<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

/** every saved look, for every room and device, newest first */
export async function listLayouts(): Promise<SavedLayout[]> {
  const sb = await db();
  const { data, error } = await sb.from(TABLE).select(COLUMNS).order("created_at", { ascending: false });
  if (error && /place/.test(error.message)) {
    // the rooms migration (…_palais_layouts_places.sql) hasn't been run: everything is the palace's
    const old = must(await sb.from(TABLE).select(COLUMNS.replace("place, ", "")).order("created_at", { ascending: false }));
    return (old as unknown as SavedLayout[]).map((l) => ({ ...l, place: "palace" }));
  }
  return must({ data, error }) as SavedLayout[];
}

export async function saveLayout(layout: {
  name: string;
  place: Place;
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

/**
 * Save the room as it is now as its default for a season and device: over the
 * current default if there is one, otherwise as a new look that becomes it.
 */
export async function saveSeasonDefault(
  saved: SavedLayout[],
  look: { place: Place; season: Season; device: Device; name: string; stage: SeasonLayout["stage"]; props: SeasonLayout["props"] },
): Promise<void> {
  const current = saved.find(
    (l) => l.place === look.place && l.season === look.season && l.device === look.device && l.is_default,
  );
  if (current) {
    await updateLayout(current.id, { stage: look.stage, props: look.props });
    return;
  }
  const made = await saveLayout(look);
  await makeDefault(made.id);
}

/* ---- signing in ---- */

export interface Editor {
  email: string;
  /** what Google (or Apple) calls them, and their picture, if it says */
  name?: string;
  avatar?: string;
  /** listed in palais_editors, so the database will accept saves */
  canSave: boolean;
  /** signed in with Google (not Apple) */
  google: boolean;
}

async function editorOf(sb: SupabaseClient, session: Session | null): Promise<Editor | null> {
  if (!session) return null;
  const { data } = await sb.rpc("palais_is_editor");
  const meta = session.user.user_metadata ?? {};
  return {
    email: session.user.email ?? "",
    name: meta.full_name ?? meta.name ?? undefined,
    avatar: meta.avatar_url ?? meta.picture ?? undefined,
    canSave: data === true,
    google: (session.user.app_metadata?.providers ?? [session.user.app_metadata?.provider]).includes("google"),
  };
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

/**
 * Sign in through a provider (Google, Apple). The password never touches this
 * site: the browser is handed off to the provider's own page and comes back
 * with a session, which onAuthStateChange picks up. `back` is where to return
 * to — the dresser's own address, so the sign-in lands where it started (its
 * room put aside and put back, as backInTheRoom does).
 *
 * This needs the provider turned on in the Supabase dashboard (Auth →
 * Providers) with its client id and secret, and this site's address in the
 * allowed redirect list. Until then the provider's button says it isn't set up
 * rather than failing silently.
 */
export type Provider = "google" | "apple";

export async function signInWith(provider: Provider, back?: string): Promise<void> {
  const sb = await db();
  // the room you're in goes aside for the trip, and comes back with you
  const to = new window.URL(back ?? window.location.href);
  try {
    if (to.hash) sessionStorage.setItem(BACK_TO, to.hash);
    else sessionStorage.removeItem(BACK_TO);
  } catch {
    /* no storage: you'll come back to the terrace */
  }
  to.hash = "";
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: to.toString() },
  });
  if (error) throw new Error(error.message);
}
