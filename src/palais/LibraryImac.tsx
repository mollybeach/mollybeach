import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Blossoms } from "./WorldMap";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { propSrc } from "./props";
import { usePlace } from "./place";

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
const ON_THE_DESK = { x: 0.455, base: 0.566, w: 0.095 };

/** the lit part of the screen, as a fraction of the sticker */
const SCREEN = { x: 0.22, y: 0.115, w: 0.52, h: 0.475 };

const MAC = "computer_imac_g3_lime_green_front_facing_sticker" as const;

type App = "readme" | "rooms" | null;

export function LibraryImac() {
  const { place, go } = usePlace();
  const here = place === "library";
  const mac = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [app, setApp] = useState<App>(null);
  const paper = useFloral("map");
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
      const h = w * 0.797; // the sticker's own shape
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
        <img src={propSrc(MAC)} alt="" />
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
            style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
          >
            <Blossoms className="wm-bloom wm-bloom--tl" posy="tl" />
            <Blossoms className="wm-bloom wm-bloom--bl" posy="bl" />
            <Blossoms className="wm-bloom wm-bloom--tr" posy="tr" />
            <Blossoms className="wm-bloom wm-bloom--br" posy="br" />

            <div className="wm-title">
              <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
              <h2 id="imac-title">
                <span aria-hidden>✿</span> iMac <span aria-hidden>✿</span>
              </h2>
              <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
            </div>
            <button type="button" className="wm-close" onClick={close} aria-label="Close the iMac">
              ×
            </button>

            <div className="imac-close-up">
              <img className="imac-body" src={propSrc(MAC)} alt="A lime green iMac" />
              <div
                className="imac-screen"
                style={{
                  left: `${SCREEN.x * 100}%`,
                  top: `${SCREEN.y * 100}%`,
                  width: `${SCREEN.w * 100}%`,
                  height: `${SCREEN.h * 100}%`,
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
                </div>

                {app && (
                  <div className="imac-window">
                    <div className="imac-window-bar">
                      <button type="button" className="imac-window-shut" onClick={() => setApp(null)} aria-label="Close the window" />
                      <span>{app === "readme" ? "Read me" : "The rooms"}</span>
                    </div>
                    <div className="imac-window-body">
                      {app === "readme" ? (
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
          </div>
        </div>
      )}
    </>
  );
}
