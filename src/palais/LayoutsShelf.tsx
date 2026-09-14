import { useState, type FormEvent } from "react";
import { BUNDLED_LAYOUTS, capture, type SeasonLayout } from "./arrangement";
import { deleteLayout, makeDefault, saveLayout, signIn, signOut, updateLayout, type SavedLayout } from "./layoutsDb";
import { SEASON_NAMES, type Season } from "./seasons";
import { messageOf, type Collection } from "./useCollection";

/**
 * The catalogue's collection of saved looks: whole arrangements of the room,
 * filed by season, like saved outfits in a dress-up game.
 *
 * Anyone can try one on. Signed in, Molly can save the room as it is now, save
 * over a look, rename it, delete it, and choose which look is each season's
 * default — the one the room puts on when that season comes. Making a new
 * default keeps the old one in the collection.
 */

const EMOJI: Record<Season, string> = { spring: "🌷", summer: "☀️", autumn: "🍂", winter: "❄️" };
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const shownCount = (l: SeasonLayout) => Object.values(l.props).filter((m) => m.shown).length;

export function LayoutsShelf({
  collection,
  season,
  wearing,
  onWear,
  hidden,
  stageOf,
}: {
  collection: Collection;
  /** the season the room is in */
  season: Season;
  /** the layout the room has on */
  wearing: SeasonLayout | undefined;
  onWear: (layout: SeasonLayout) => void;
  hidden: Set<string>;
  stageOf: () => HTMLElement | null;
}) {
  const { configured, saved, editor, error, setError, refresh } = collection;
  const [viewing, setViewing] = useState<Season>(season);
  const [busy, setBusy] = useState(false);
  const canSave = Boolean(editor?.canSave);

  const run = async (job: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await job();
      await refresh();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const room = () => {
    const stage = stageOf();
    if (!stage) throw new Error("Couldn't find the room");
    const { stage: size, props } = capture(stage, hidden);
    return { stage: size, props };
  };

  const looks = saved
    .filter((l) => l.season === viewing)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
  const bundled = BUNDLED_LAYOUTS[viewing];
  const hasDefault = looks.some((l) => l.is_default);

  if (!configured) {
    return (
      <div className="cat-looks">
        <p className="cat-note">
          Saved looks need the Supabase database connected. Add <code>REACT_APP_SUPABASE_URL</code> and{" "}
          <code>REACT_APP_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="cat-looks">
      <nav className="cat-seasons" aria-label="Season">
        {SEASON_NAMES.map((s) => (
          <button
            key={s}
            type="button"
            className={`cat-season${viewing === s ? " is-on" : ""}`}
            aria-pressed={viewing === s}
            onClick={() => setViewing(s)}
          >
            <span aria-hidden>{EMOJI[s]}</span> {title(s)}
            {s === season && <span className="cat-now">now</span>}
          </button>
        ))}
      </nav>

      {error && (
        <p className="cat-error" role="alert">
          {error}
        </p>
      )}

      <ul className="cat-look-list">
        {looks.map((l) => (
          <Look
            key={l.id}
            look={l}
            wearing={(wearing as Partial<SavedLayout> | undefined)?.id === l.id}
            canSave={canSave}
            busy={busy}
            onWear={() => onWear(l)}
            onDefault={() => run(() => makeDefault(l.id))}
            onSaveOver={() =>
              window.confirm(`Replace “${l.name}” with the room as it is now?`) && run(() => updateLayout(l.id, room()))
            }
            onRename={(name) => run(() => updateLayout(l.id, { name }))}
            onDelete={() => window.confirm(`Delete “${l.name}” from the collection?`) && run(() => deleteLayout(l.id))}
          />
        ))}
        {bundled && (
          <li className={`cat-look${wearing === bundled ? " is-wearing" : ""}`}>
            <div className="cat-look-head">
              <strong className="cat-look-name">From the code</strong>
              {!hasDefault && <span className="cat-badge">★ Default</span>}
              {wearing === bundled && <span className="cat-badge cat-badge--wearing">Wearing</span>}
            </div>
            <p className="cat-look-meta">
              layouts/{viewing}.json · {shownCount(bundled)} stickers
            </p>
            <div className="cat-look-actions">
              <button type="button" className="cat-mini" onClick={() => onWear(bundled)}>
                Try on
              </button>
              {canSave && (
                <button
                  type="button"
                  className="cat-mini"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const copy = await saveLayout({
                        name: `${title(viewing)} (from the code)`,
                        season: viewing,
                        device: "desktop",
                        stage: bundled.stage,
                        props: bundled.props,
                      });
                      if (!hasDefault) await makeDefault(copy.id);
                    })
                  }
                >
                  Add to collection
                </button>
              )}
            </div>
          </li>
        )}
        {!looks.length && !bundled && (
          <li className="cat-note">
            No saved looks for {viewing} yet{canSave ? ": arrange the room and save it below." : "."}
          </li>
        )}
      </ul>

      {canSave ? (
        <SaveForm
          key={viewing}
          season={viewing}
          count={looks.length}
          busy={busy}
          onSave={(name, s, asDefault) =>
            run(async () => {
              const look = await saveLayout({ name, season: s, device: "desktop", ...room() });
              if (asDefault) await makeDefault(look.id);
            })
          }
        />
      ) : null}

      <SignIn editor={editor} onError={setError} />
    </div>
  );
}

function Look({
  look,
  wearing,
  canSave,
  busy,
  onWear,
  onDefault,
  onSaveOver,
  onRename,
  onDelete,
}: {
  look: SavedLayout;
  wearing: boolean;
  canSave: boolean;
  busy: boolean;
  onWear: () => void;
  onDefault: () => void;
  onSaveOver: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(look.name);

  return (
    <li className={`cat-look${wearing ? " is-wearing" : ""}${look.is_default ? " is-default" : ""}`}>
      <div className="cat-look-head">
        {naming ? (
          <form
            className="cat-rename"
            onSubmit={(e) => {
              e.preventDefault();
              setNaming(false);
              if (name.trim() && name.trim() !== look.name) onRename(name.trim());
            }}
          >
            <input className="cat-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" autoFocus />
            <button type="submit" className="cat-mini">
              Save
            </button>
          </form>
        ) : (
          <strong className="cat-look-name">{look.name}</strong>
        )}
        {look.is_default && <span className="cat-badge">★ Default</span>}
        {wearing && <span className="cat-badge cat-badge--wearing">Wearing</span>}
      </div>
      <p className="cat-look-meta">
        Saved {when(look.updated_at)} · {shownCount(look)} stickers
      </p>
      <div className="cat-look-actions">
        <button type="button" className="cat-mini" onClick={onWear}>
          Try on
        </button>
        {canSave && (
          <>
            {!look.is_default && (
              <button type="button" className="cat-mini cat-mini--hot" disabled={busy} onClick={onDefault}>
                Make default
              </button>
            )}
            <button type="button" className="cat-mini" disabled={busy} onClick={onSaveOver}>
              Save room over it
            </button>
            <button type="button" className="cat-mini" disabled={busy} onClick={() => setNaming((v) => !v)}>
              Rename
            </button>
            <button type="button" className="cat-mini cat-mini--ghost" disabled={busy} onClick={onDelete}>
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function SaveForm({
  season,
  count,
  busy,
  onSave,
}: {
  season: Season;
  count: number;
  busy: boolean;
  onSave: (name: string, season: Season, asDefault: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [s, setS] = useState<Season>(season);
  const [asDefault, setAsDefault] = useState(true);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(name.trim() || `${title(s)} look ${count + 1}`, s, asDefault);
    setName("");
  };
  return (
    <form className="cat-save" onSubmit={submit}>
      <h3>♡ Save the room as a new look</h3>
      <div className="cat-save-row">
        <input
          className="cat-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${title(s)} look ${count + 1}`}
          aria-label="Name for this look"
        />
        <select className="cat-input" value={s} onChange={(e) => setS(e.target.value as Season)} aria-label="Season">
          {SEASON_NAMES.map((x) => (
            <option key={x} value={x}>
              {title(x)}
            </option>
          ))}
        </select>
      </div>
      <label className="cat-check">
        <input type="checkbox" checked={asDefault} onChange={(e) => setAsDefault(e.target.checked)} /> Make it the{" "}
        {s} default (the old one stays in the collection)
      </label>
      <button type="submit" className="cat-btn cat-btn--done" disabled={busy}>
        {busy ? "Saving…" : "Save look ♡"}
      </button>
    </form>
  );
}

export function SignIn({ editor, onError, label = "Sign in to save looks" }: { editor: Collection["editor"]; onError: (m: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (editor) {
    return (
      <p className="cat-signin-line">
        Signed in as {editor.email}
        {!editor.canSave && " — not an editor yet, so saving is off (see supabase/README.md)"} ·{" "}
        <button type="button" className="cat-link" onClick={() => signOut()}>
          Sign out
        </button>
      </p>
    );
  }
  if (!open) {
    return (
      <p className="cat-signin-line">
        <button type="button" className="cat-link" onClick={() => setOpen(true)}>
          {label}
        </button>
      </p>
    );
  }
  return (
    <form
      className="cat-signin"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        onError("");
        try {
          await signIn(email, password);
          setPassword("");
        } catch (err) {
          onError(messageOf(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        className="cat-input"
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="cat-input"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="cat-btn" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
