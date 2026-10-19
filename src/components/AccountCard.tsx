// path: src/components/AccountCard.tsx
import React, { useEffect, useState } from 'react';
import { currentEditor, dbConfigured, onEditorChange, signInWith, signOut, type Editor } from '../palais/layoutsDb';

/**
 * Signing in and out with Google, from the sidebar, on every page.
 *
 * It's the same Supabase sign-in Molly uses for the catalogue (layoutsDb.ts):
 * the browser goes off to Google and comes back to the page it left, signed
 * in. Signing in on its own unlocks nothing: the editor's tools and the
 * Boudoir ask the database whether you're allowed (palais_editors, and the
 * Boudoir's own admissions), not whether you're signed in.
 *
 * Folded down to the column of icons, it's just the Google G, or your picture
 * once you're in.
 */

const GoogleG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

interface Props {
  collapsed: boolean;
  ink: string;
}

const AccountCard: React.FC<Props> = ({ collapsed, ink }) => {
  const [me, setMe] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState('');

  useEffect(() => {
    currentEditor()
      .then(setMe)
      .catch(() => {});
    return onEditorChange((e) => {
      setMe(e);
      setBusy(false);
    });
  }, []);

  if (!dbConfigured) return null;

  const signIn = async () => {
    setBusy(true);
    setTrouble('');
    try {
      // back to exactly where they were, room and all
      await signInWith('google', window.location.href);
    } catch (e) {
      setBusy(false);
      setTrouble(e instanceof Error ? e.message : "Google sign-in didn't start.");
    }
  };
  const leave = async () => {
    setBusy(true);
    await signOut().catch(() => {});
    setMe(null);
    setBusy(false);
  };

  const first = me?.name?.split(' ')[0] || me?.email.split('@')[0] || '';
  const face = me?.avatar ? (
    <img src={me.avatar} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow" />
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff7fbf] text-sm font-bold text-white ring-2 ring-white shadow">
      {(first[0] ?? '♡').toUpperCase()}
    </span>
  );

  return (
    <div
      className={`rounded-2xl bg-[#fffdf6] p-2 shadow-md ring-1 ring-[#c9a44c]/60 ${collapsed ? 'lg:p-1.5' : ''}`}
      style={{ color: ink }}
    >
      {me ? (
        <div className={`flex items-center gap-2.5 px-2 py-1 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          {/* folded away, the picture is the way out */}
          <button
            type="button"
            onClick={() => collapsed && window.innerWidth >= 1024 && window.confirm(`Sign out of ${me.email}?`) && void leave()}
            title={collapsed ? `Signed in as ${me.email} · click to sign out` : me.email}
            className={`shrink-0 rounded-full ${collapsed ? 'lg:cursor-pointer' : 'cursor-default'}`}
            aria-label={`Signed in as ${me.email}`}
          >
            {face}
          </button>
          <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="truncate text-sm font-semibold">Hi, {first} ♡</p>
            <button
              type="button"
              onClick={() => void leave()}
              disabled={busy}
              className="text-xs font-medium underline decoration-dotted underline-offset-2 hover:opacity-75 disabled:opacity-50"
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void signIn()}
          disabled={busy}
          title={collapsed ? 'Sign in with Google' : undefined}
          aria-label="Sign in with Google"
          className={`flex w-full items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#f6ecd6] disabled:opacity-60 ${
            collapsed ? 'lg:px-0' : ''
          }`}
        >
          <GoogleG className="h-5 w-5 shrink-0" />
          <span className={collapsed ? 'lg:hidden' : ''}>{busy ? 'Off to Google…' : 'Sign in with Google'}</span>
        </button>
      )}
      {trouble && <p className={`px-2 pt-1 text-xs text-red-700 ${collapsed ? 'lg:hidden' : ''}`}>{trouble}</p>}
    </div>
  );
};

export default AccountCard;
