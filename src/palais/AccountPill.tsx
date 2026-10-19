import { useEffect, useState } from "react";
import { GoogleG, useAccount } from "../components/AccountCard";

/**
 * Who you are, in the Palais's top bar: your Google picture once you're
 * signed in, or a little person when you're not. Pressing it opens a small
 * card under it, to sign in with Google, or to see who you're signed in as
 * and sign out. (The same sign-in as the sidebar's card: useAccount.)
 */
export function AccountPill() {
  const { me, busy, trouble, signIn, leave, first, available } = useAccount();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!available) return null;

  const face = me?.avatar ? (
    <img src={me.avatar} alt="" referrerPolicy="no-referrer" className="palais-me-face" />
  ) : me ? (
    <span className="palais-me-face palais-me-face--letter">{(first[0] ?? "♡").toUpperCase()}</span>
  ) : (
    <svg className="palais-me-face palais-me-face--blank" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" />
    </svg>
  );

  return (
    <>
      <button
        type="button"
        className="palais-pill palais-pill--me"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={me ? `Signed in as ${me.email}` : "Sign in"}
        title={me ? `Signed in as ${me.email}` : "Sign in"}
      >
        {face}
        <span className="palais-pill-long">{me ? first : "Sign in"}</span>
      </button>

      {open && (
        <>
          <div className="palais-me-veil" onPointerDown={() => setOpen(false)} aria-hidden />
          <div className="palais-me-card" role="dialog" aria-label="Your account">
            <button type="button" className="palais-settings-shut palais-me-shut" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
            {me ? (
              <>
                <div className="palais-me-who">
                  {me.avatar ? (
                    <img src={me.avatar} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="palais-me-face--letter">{(first[0] ?? "♡").toUpperCase()}</span>
                  )}
                  <div>
                    <b>{me.name ?? first}</b>
                    <small>{me.email}</small>
                  </div>
                </div>
                <p className="palais-me-note">Signed in with Google ♡</p>
                <button type="button" className="palais-me-action" onClick={() => void leave()} disabled={busy}>
                  {busy ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <h2>Welcome to the Palais ♡</h2>
                <p className="palais-me-note">Sign in to say who you are. It takes you to Google and straight back here.</p>
                <button type="button" className="palais-me-action palais-me-google" onClick={() => void signIn()} disabled={busy}>
                  <GoogleG className="palais-me-g" />
                  {busy ? "Off to Google…" : "Sign in with Google"}
                </button>
                {trouble && <p className="palais-me-trouble">{trouble}</p>}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
