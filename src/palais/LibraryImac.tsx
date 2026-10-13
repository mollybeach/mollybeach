import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Blossoms } from "./WorldMap";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { propSrc } from "./props";
import { hashExtra, usePlace } from "./place";
import { usePortrait } from "./PortraitTerrace";
import { GifMaker } from "./GifMaker";

/**
 * The iMac on the library desk.
 *
 * It isn't a sticker you can move: it stands on the desk in every season,
 * lined up with the photograph however the room has cropped it. Click it and
 * it comes up close, with a screen you can actually use — a menu bar, icons,
 * and little windows that open on it. There's not much on it yet; the point is
 * that there's somewhere for things to go.
 */

/** where the iMac stands on the desk, as a fraction of the library photograph */
const ON_THE_DESK = { x: 0.44, base: 0.58, w: 0.092 };

/** the lit part of the screen, as a fraction of the sticker */
const SCREEN = { x: 0.22, y: 0.115, w: 0.52, h: 0.475 };

/** on a phone the keyboard comes away from the machine and sits underneath,
    so the monitor alone can fill the width; this is its screen, as a fraction
    of the monitor on its own */
const SCREEN_ALONE = { x: 0.152, y: 0.132, w: 0.694, h: 0.602 };

/** the one on the desk is the three-quarter view, with its keyboard and mouse;
    the close-up is the one facing you, as if you had sat down at it */
const ON_DESK = "computer_imac_g3_lime_green_keyboard_mouse_sticker" as const;
const UP_CLOSE = "computer_imac_g3_lime_green_front_facing_sticker" as const;
const MONITOR = `${process.env.PUBLIC_URL}/palais/props/computer_imac_g3_lime_green_monitor.webp`;
const KEYBOARD = `${process.env.PUBLIC_URL}/palais/props/computer_imac_g3_lime_green_keyboard_mouse.webp`;

/* mollybeach.app/mac (and #library/mac) sits you straight down at it */
const AT_THE_MAC = () => /^mac/.test(hashExtra());

type App = "readme" | "rooms" | "gifs" | null;

const TITLES = { readme: "Read me", rooms: "The rooms", gifs: "GIF maker" } as const;

export function LibraryImac() {
  const { place, go } = usePlace();
  const here = place === "library";
  const mac = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(() => here && AT_THE_MAC());
  const tall = usePortrait();
  const screen = tall ? SCREEN_ALONE : SCREEN;
  const [app, setApp] = useState<App>(null);
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");

  /* keep it standing on the desk, wherever the photograph has landed */
  useLayoutEffect(() => {
    const el = mac.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--library img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const box = coverBox(img, stage);
      const w = box.w * ON_THE_DESK.w;
      const h = w * 0.839; // the sticker's own shape
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${box.left + box.w * ON_THE_DESK.x - w / 2}px`;
      el.style.top = `${box.top + box.h * ON_THE_DESK.base - h}px`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200); // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  /* the address says whether you're at the iMac, so it can be sent to someone */
  useEffect(() => {
    if (!here) return setOpen(false);
    const want = open ? "#library/mac" : "#library";
    if (window.location.hash !== want) window.history.replaceState(window.history.state, "", want);
  }, [open, here]);
  useEffect(() => {
    const onHash = () => AT_THE_MAC() && setOpen(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setApp(null);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!here) return null;

  return (
    <>
      <button
        ref={mac}
        type="button"
        className="palais-imac-spot"
        aria-label="The iMac on the desk"
        title="The iMac"
        onClick={() => setOpen(true)}
      >
        <img src={propSrc(ON_DESK)} alt="" />
      </button>

      {open && (
        <div
          className="wm-backdrop"
          style={{
            ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
            ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
            ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
          }}
          onPointerDown={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="wm-panel wm-panel--imac"
            role="dialog"
            aria-modal="true"
            aria-labelledby="imac-title"
            style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.28), rgba(250, 243, 229, 0.34)), url("${floralSrc("green")}")` }}
          >
            <Blossoms className="wm-bloom wm-bloom--tl" posy="tl" />
            <Blossoms className="wm-bloom wm-bloom--bl" posy="bl" />
            <Blossoms className="wm-bloom wm-bloom--tr" posy="tr" />
            <Blossoms className="wm-bloom wm-bloom--br" posy="br" />

            <div className="wm-title">
              <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
              <h2 id="imac-title">
                <span aria-hidden>✿</span> Desktop <span aria-hidden>✿</span>
              </h2>
              <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
            </div>
            <button type="button" className="wm-close" onClick={close} aria-label="Close the iMac">
              ×
            </button>

            <div className={tall ? "imac-close-up imac-close-up--tall" : "imac-close-up"}>
              <div className="imac-monitor">
                <img className="imac-body" src={tall ? MONITOR : propSrc(UP_CLOSE)} alt="A lime green iMac" />
                <div
                  className="imac-screen"
                  style={{
                    left: `${screen.x * 100}%`,
                    top: `${screen.y * 100}%`,
                    width: `${screen.w * 100}%`,
                    height: `${screen.h * 100}%`,
                  }}
                >
                  <div className="imac-menu">
                    <span aria-hidden>✿</span>
                    <b>Palais</b>
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span className="imac-menu-clock">{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                  </div>

                  <div className="imac-desk">
                    <button type="button" className="imac-icon" onClick={() => setApp("readme")}>
                      <span aria-hidden>📄</span>
                      Read me
                    </button>
                    <button type="button" className="imac-icon" onClick={() => setApp("rooms")}>
                      <span aria-hidden>🗂</span>
                      The rooms
                    </button>
                    <button type="button" className="imac-icon" onClick={() => setApp("gifs")}>
                      <span aria-hidden>🎞</span>
                      GIF maker
                    </button>
                  </div>

                  {app && (
                    <div className={app === "gifs" ? "imac-window imac-window--wide" : "imac-window"}>
                      <div className="imac-window-bar">
                        <button type="button" className="imac-window-shut" onClick={() => setApp(null)} aria-label="Close the window" />
                        <span>{TITLES[app]}</span>
                      </div>
                      <div className="imac-window-body">
                        {app === "gifs" ? (
                          <GifMaker />
                        ) : app === "readme" ? (
                          <p>
                            Molly's iMac, on the desk in the library. Nothing much is installed yet — the point is that
                            there's a screen here now, so there's somewhere for things to go.
                          </p>
                        ) : (
                          <ul>
                            {(["palace", "kitchen", "lakehouse", "lagoon", "sunliner"] as const).map((room) => (
                              <li key={room}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    go(room);
                                    close();
                                  }}
                                >
                                  {room === "palace" ? "The Palais" : room === "sunliner" ? "Sunliner Halt" : room[0].toUpperCase() + room.slice(1)}
                                </button>
                              </li>
                            ))}
                            <li>
                              <Link to="/projects" onClick={close}>
                                Molly's projects
                              </Link>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {tall && <img className="imac-keys" src={KEYBOARD} alt="" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
