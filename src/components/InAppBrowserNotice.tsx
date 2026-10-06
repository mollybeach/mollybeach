// path: src/components/InAppBrowserNotice.tsx
import React, { useEffect, useMemo, useState } from 'react';

/**
 * A nudge shown only inside Instagram's (and Facebook's) in-app browser.
 *
 * A link tapped from an Instagram bio or story opens in Instagram's own webview,
 * not Chrome or Safari. That webview blocks things the site needs — above all
 * Google and Apple sign-in (Google rejects OAuth from embedded webviews with
 * `disallowed_useragent`), so the Boudoir can't be unlocked from an IG tap.
 *
 * There is no reliable way for a web page inside a webview to force itself into
 * the real browser, so:
 *  - on Android we bounce to Chrome with an `intent://` URL (once), and offer a
 *    button to do it by hand,
 *  - on iOS, where no such escape exists, we show how: the ⋯ menu → Open in
 *    external browser, plus a one-tap copy of the link.
 *
 * In every ordinary browser this renders nothing.
 */

const DISMISS_KEY = 'mb-inapp-dismissed';

function chromeIntentUrl(): string {
  const { host, pathname, search, href } = window.location;
  // open Chrome at the https URL; fall back to the full link (hash and all) if
  // Chrome isn't installed
  return (
    `intent://${host}${pathname}${search}` +
    `#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(href)};end`
  );
}

export default function InAppBrowserNotice() {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  const inApp = useMemo(() => /Instagram|FBAN|FBAV|FB_IAB/i.test(ua), [ua]);
  const isAndroid = useMemo(() => /Android/i.test(ua), [ua]);
  const isIOS = useMemo(() => /iPhone|iPad|iPod/i.test(ua), [ua]);

  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inApp) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      /* private mode: just show it */
    }
    if (dismissed) return;
    setShow(true);

    // Android: try to escape to Chrome automatically, once per webview session
    if (isAndroid) {
      let tried = false;
      try {
        tried = sessionStorage.getItem('mb-inapp-bounced') === '1';
      } catch {
        /* ignore */
      }
      if (!tried) {
        try {
          sessionStorage.setItem('mb-inapp-bounced', '1');
        } catch {
          /* ignore */
        }
        // a small delay so the page has painted before we hand off
        const t = setTimeout(() => {
          window.location.href = chromeIntentUrl();
        }, 400);
        return () => clearTimeout(t);
      }
    }
  }, [inApp, isAndroid]);

  if (!inApp || !show) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={styles.wrap} role="dialog" aria-label="Open in your browser">
      <div style={styles.card}>
        <button type="button" onClick={dismiss} aria-label="Dismiss" style={styles.close}>
          ×
        </button>
        <p style={styles.title}>You&rsquo;re in Instagram&rsquo;s browser</p>
        <p style={styles.body}>
          Sign-in and some features don&rsquo;t work here. Open this page in{' '}
          {isIOS ? 'Safari' : 'your browser'} instead.
        </p>

        {isAndroid ? (
          <a href={chromeIntentUrl()} style={styles.btn}>
            Open in Chrome
          </a>
        ) : (
          <>
            <p style={styles.steps}>
              Tap <b>⋯</b> (top-right) → <b>Open in external browser</b>
            </p>
            <button type="button" onClick={copyLink} style={styles.btnGhost}>
              {copied ? 'Link copied ✓' : 'Copy link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2147483647,
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 10px 0',
    pointerEvents: 'none',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    pointerEvents: 'auto',
    position: 'relative',
    width: '100%',
    maxWidth: 440,
    background: 'linear-gradient(135deg, #2a1240, #3a1b5c)',
    color: '#fdf6ff',
    border: '2px solid #c77dff',
    borderRadius: 16,
    padding: '14px 16px 16px',
    boxShadow: '0 10px 30px rgba(20, 8, 40, 0.5)',
  },
  close: {
    position: 'absolute',
    top: 6,
    right: 8,
    background: 'transparent',
    border: 'none',
    color: '#e8d4ff',
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 4,
  },
  title: { margin: '0 24px 4px 0', fontWeight: 700, fontSize: 15 },
  body: { margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.45, color: '#ecd9ff' },
  steps: { margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.5, color: '#f3e6ff' },
  btn: {
    display: 'inline-block',
    background: '#c77dff',
    color: '#1b0640',
    fontWeight: 700,
    fontSize: 14,
    textDecoration: 'none',
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
  },
  btnGhost: {
    background: 'transparent',
    color: '#fdf6ff',
    fontWeight: 600,
    fontSize: 13.5,
    padding: '8px 16px',
    borderRadius: 999,
    border: '1.5px solid #c77dff',
    cursor: 'pointer',
  },
};
