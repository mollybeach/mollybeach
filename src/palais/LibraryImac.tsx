import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Blossoms, ROOM_LIST } from "./WorldMap";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { propSrc } from "./props";
import { hashExtra, usePlace, type Place } from "./place";
import { usePortrait } from "./PortraitTerrace";
import { GifMaker } from "./GifMaker";
import { useAccount } from "../components/AccountCard";
import { projects } from "../components/projectsData";
import { experiences } from "../components/Experience";
import { OneLine, StringSplitter } from "./StringSplitter";
import { placeOver, schoolSpot } from "./schoolSpots";
import { MATERIALS } from "./bratCourse";
import { SPRITES } from "./bratSprites";

/**
 * The iMac on the library desk.
 *
 * It isn't a sticker you can move: it stands on the desk in every season,
 * lined up with the photograph however the room has cropped it. Click it and
 * it comes up close, with a screen you can actually use — a menu bar, icons,
 * and little windows that open on it. There's not much on it yet; the point is
 * that there's somewhere for things to go.
 *
 * The lime iBook on the teacher's desk at Brat Academy opens the very same
 * desktop. That one is already in the photograph, so it gets a glow to point
 * at rather than a sticker.
 */

/** where the iMac stands on the desk, as a fraction of the library photograph */
const ON_THE_DESK = { x: 0.44, base: 0.58, w: 0.092 };

/** the lit part of the screen, as a fraction of the sticker */
const SCREEN = { x: 0.215, y: 0.118, w: 0.497, h: 0.475 };

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

/* mollybeach.app/mac (and #library/mac, or #school/mac) sits you straight down at it */
const AT_THE_MAC = () => /^mac/.test(hashExtra());

type App = "readme" | "finder" | "favs" | "school" | "gifs" | "split" | "oneline" | null;

const TITLES = { readme: "README.md", finder: "Finder", favs: "My favs", school: "Academy", gifs: "GIF maker", split: "🎱 Splitter", oneline: "🧵 One line" } as const;

/** Molly's projects, as apps on the desktop: each opens its site, with its
    preview picture for an icon and a short name under it */
const SHORT: Record<string, string> = {
  "🍐 Pear Pay": "Pear Pay",
  "token-gating-discord-bot-api": "Token gate",
  "Python-Django-Appointment-Calendar-Salon": "Salon",
  "Rug Watch Dog": "Rug Watch",
  // the long ones break in two where the words do
  LiveStakes: "Live\nStakes",
  genaigraphics: "genai\ngraphic",
  Memorizwift: "Memori\nzwift",
  CryptoGene: "Crypto\nGene",
  petitmot: "petit\nmot",
  InstaDemo: "Insta\nDemo",
  ihaehada: "ihae\nhada",
  omnipedia: "omni\npedia",
  RNAlytics: "RNA\nlytics",
  HedgePod: "Hedge\nPod",
};
/** projects with a real app icon of their own, in place of the preview picture */
const ICON: Record<string, string> = {
  HedgePod: `${process.env.PUBLIC_URL}/palais/imac/hedgepod.webp`,
  Praxos: `${process.env.PUBLIC_URL}/palais/imac/praxos.svg`,
  "🍐 Pear Pay": `${process.env.PUBLIC_URL}/palais/imac/pearpay.webp`,
  "wyd?": `${process.env.PUBLIC_URL}/palais/imac/wyd.webp`,
  LiveStakes: `${process.env.PUBLIC_URL}/palais/imac/livestakes.webp`,
  Spectra: `${process.env.PUBLIC_URL}/palais/imac/spectra.webp`,
  BRKT: `${process.env.PUBLIC_URL}/palais/imac/brkt.webp`,
  ihaehada: `${process.env.PUBLIC_URL}/palais/imac/ihaehada.webp`,
  InstaDemo: `${process.env.PUBLIC_URL}/palais/imac/instademo.webp`,
  petitmot: `${process.env.PUBLIC_URL}/palais/imac/petitmot.svg`,
  genaigraphics: `${process.env.PUBLIC_URL}/palais/imac/genaigraphics.webp`,
  CryptoGene: `${process.env.PUBLIC_URL}/palais/imac/cryptogene.webp`,
  "token-gating-discord-bot-api": `${process.env.PUBLIC_URL}/palais/imac/tokengate.webp`,
  omnipedia: `${process.env.PUBLIC_URL}/palais/imac/omnipedia.svg`,
  Memorizwift: `${process.env.PUBLIC_URL}/palais/imac/memorizwift.svg`,
  Hookt: `${process.env.PUBLIC_URL}/palais/imac/hookt.webp`,
  TwinAI: `${process.env.PUBLIC_URL}/palais/imac/twinai.webp`,
  "Python-Django-Appointment-Calendar-Salon": `${process.env.PUBLIC_URL}/palais/imac/salon.webp`,
};
const APPS = projects.map((p) => ({ name: SHORT[p.title] ?? p.title, title: p.title, href: p.demoUrl ?? p.link, icon: ICON[p.title] ?? p.microlink, own: !!ICON[p.title] }));

/** the folders in the Finder, and the icons kept in them to download */
type Folder = "home" | "favs" | "school" | "avatar" | "backgrounds" | "rooms" | "icons" | "project-icons" | "job-icons";
const FOLDER_NAME: Record<Folder, string> = {
  home: "Macintosh HD",
  favs: "My favs",
  avatar: "Avatar",
  backgrounds: "Backgrounds",
  school: "Academy",
  rooms: "Palais",
  icons: "Icons",
  "project-icons": "Project icons",
  "job-icons": "Job icons",
};
const UP: Partial<Record<Folder, Folder>> = { favs: "home", avatar: "home", backgrounds: "home", school: "home", rooms: "home", icons: "home", "project-icons": "icons", "job-icons": "icons" };
/** the Palais's own icon, for its folder of rooms */
const PALAIS_ICON = `${process.env.PUBLIC_URL}/palais-icon.svg`;
/** rooms with an icon of their own in the Palais folder, in place of their
    island: the Boudoir's black rabbit, and Brat Academy's own logo */
const ROOM_ICON: Partial<Record<Place, string>> = {
  boudoir: `${process.env.PUBLIC_URL}/palais/boudoir-bunny.webp`,
  school: `${process.env.PUBLIC_URL}/bratcode.webp`,
};
/** a file's name to save it under: the name, in lower case, with its own ending */
const fileName = (name: string, src: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.${(src.split("?")[0].split(".").pop() || "png").toLowerCase()}`;
/** each project's own icon; the jobs' are the logos on the résumé, one each */
const PROJECT_ICONS = projects.filter((p) => ICON[p.title]).map((p) => ({ name: SHORT[p.title]?.replace("\n", "") ?? p.title, src: ICON[p.title] }));
const JOB_ICONS = experiences
  .filter((e, i, all) => all.findIndex((o) => o.logo === e.logo) === i)
  .map((e) => ({
    // "CARD SWAPPER" reads Card Swapper, but acronyms stay as they are
    name: e.company.replace(/\w+/g, (w) => (["DTCC", "BRKT"].includes(w) ? w : w[0] + w.slice(1).toLowerCase())),
    src: e.logo,
  }));

/** the README on the desktop: its own file (public/palais/imac/readme.html),
    the GitHub README laid out to fit this screen, fetched once a visit */
const REPO = "mollybeach/mollybeach";
let readmeHtml: Promise<string> | null = null;
function loadReadme() {
  readmeHtml ??= fetch(`${process.env.PUBLIC_URL}/palais/imac/readme.html`)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then((html) => {
      // every link opens in a new tab, off the Mac
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
      return doc.body.innerHTML;
    })
    .catch((e) => {
      readmeHtml = null;
      throw e;
    });
  return readmeHtml;
}

function Readme() {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadReadme()
      .then((h) => live && setHtml(h))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  if (failed)
    return (
      <p>
        The README didn't load.{" "}
        <a href={`https://github.com/${REPO}#readme`} target="_blank" rel="noopener noreferrer">
          Read it on GitHub
        </a>
      </p>
    );
  if (!html) return <p>Loading the README…</p>;
  return <div className="imac-readme" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Molly's favourite websites, kept like bookmarks in My favs */
const FAVS: { name: string; href: string; icon?: string; emoji?: string }[] = [
  { name: "LunaPic", href: "https://www2.lunapic.com/editor/?action=quick-upload", emoji: "🌙" },
  { name: "Mentimeter", href: "https://www.mentimeter.com/", icon: `${process.env.PUBLIC_URL}/palais/imac/fav-menti.png` },
  { name: "Glitch blog", href: "https://blog.glitch.com/", icon: `${process.env.PUBLIC_URL}/palais/imac/fav-glitch.png` },
  { name: "Mural", href: "https://app.mural.co/", icon: `${process.env.PUBLIC_URL}/palais/imac/fav-mural.png` },
  { name: "Quizlet", href: "https://quizlet.com/", icon: `${process.env.PUBLIC_URL}/palais/imac/fav-quizlet.png` },
  { name: "Linear", href: "https://linear.app/", icon: `${process.env.PUBLIC_URL}/palais/imac/fav-linear.png` },
];
/** Molly's avatars, and her desktop backgrounds, each one a click to download */
const AVATARS = [
  { name: "Lavender", src: `${process.env.PUBLIC_URL}/palais/imac/avatar/avi_lavendar.png` },
  { name: "Passport", src: `${process.env.PUBLIC_URL}/palais/imac/avatar/avi_passport.jpg` },
];
const BACKGROUNDS = [{ name: "Sailor Moon", src: `${process.env.PUBLIC_URL}/palais/imac/backgrounds/sailormoon-background.png` }];
/** folders whose icon is an emoji */
const FOLDER_EMOJI: Partial<Record<Folder, string>> = { avatar: "👤", backgrounds: "🌄" };

/** the pixel pink heart, My favs' icon */
const HEART = `data:image/svg+xml;utf8,${encodeURIComponent(SPRITES.pinkHeart)}`;

/** courses kept in the Academy folder on the Mac (only there, not in the
    binder's Cheat Sheets) */
const COURSES_ON_MAC: { name: string; href: string; icon: string }[] = [
  {
    name: "Udemy: Blockchain Developer",
    href: "https://www.udemy.com/course/blockchain-developer/learn/lecture/33861892?components=add_to_cart%2Cavailable_coupons%2Cbase_purchase_section%2Cbuy_button%2Cbuy_for_team%2Ccacheable_buy_button%2Ccacheable_deal_badge%2Ccacheable_discount_expiration%2Ccacheable_price_text%2Ccacheable_purchase_text%2Ccurated_for_ufb_notice_context%2Ccurriculum_context%2Cdeal_badge%2Cdiscount_expiration%2Cgift_this_course%2Cincentives%2Cinstructor_links%2Clifetime_access_context%2Cmoney_back_guarantee%2Cprice_text%2Cpurchase_tabs_context%2Cpurchase%2Crecommendation%2Credeem_coupon%2Csidebar_container%2Cpurchase_body_container%2Cone_click_checkout#overview",
    icon: `${process.env.PUBLIC_URL}/palais/imac/udemy.png`,
  },
];

/** the apple off the teacher's desk, the School folder's icon */
const APPLE = `data:image/svg+xml;utf8,${encodeURIComponent(SPRITES.apple)}`;

function Finder({ start = "home", onRoom }: { start?: Folder; onRoom: (r: Place) => void }) {
  const [at, setAt] = useState<Folder>(start);
  const folder = (to: Folder) => (
    <button key={to} type="button" className="finder-item" onDoubleClick={() => setAt(to)} onClick={() => setAt(to)}>
      {to === "rooms" || to === "icons" ? (
        <img src={to === "rooms" ? PALAIS_ICON : `${process.env.PUBLIC_URL}/palais/imac/icons-folder.svg`} alt="" />
      ) : to === "school" || to === "favs" ? (
        <img className="finder-apple" src={to === "favs" ? HEART : APPLE} alt="" />
      ) : (
        <span className="finder-folder" aria-hidden>
          {FOLDER_EMOJI[to] ?? "📁"}
        </span>
      )}
      <span>{FOLDER_NAME[to]}</span>
    </button>
  );
  const icons = (list: { name: string; src: string }[]) =>
    list.map((f) => (
      <a key={f.src} className="finder-item" href={f.src} download={fileName(f.name, f.src)} title={`Download ${fileName(f.name, f.src)}`}>
        <img src={f.src} alt="" />
        <span>{f.name}</span>
      </a>
    ));
  return (
    <div className="finder">
      <div className="finder-path">
        {UP[at] && (
          <button type="button" className="finder-back" onClick={() => setAt(UP[at]!)} aria-label="Back">
            ‹
          </button>
        )}
        <b>{FOLDER_NAME[at]}</b>
        {(at === "project-icons" || at === "job-icons" || at === "avatar" || at === "backgrounds") && <span>click one to download it</span>}
      </div>
      <div className="finder-grid">
        {at === "home" && [folder("rooms"), folder("favs"), folder("school"), folder("avatar"), folder("backgrounds"), folder("icons")]}
        {at === "avatar" && icons(AVATARS)}
        {at === "backgrounds" && icons(BACKGROUNDS)}
        {at === "favs" &&
          FAVS.map((f) => (
            <a key={f.href} className="finder-item" href={f.href} target="_blank" rel="noopener noreferrer" title={f.href}>
              {f.icon ? (
                <img src={f.icon} alt="" />
              ) : (
                <span className="finder-folder" aria-hidden>
                  {f.emoji}
                </span>
              )}
              <span>{f.name}</span>
            </a>
          ))}
        {at === "school" &&
          [...MATERIALS, ...COURSES_ON_MAC].map((m) => (
            <a key={m.href} className="finder-item" href={m.href} target="_blank" rel="noopener noreferrer" title={m.href}>
              <img src={m.icon} alt="" />
              <span>{m.name}</span>
            </a>
          ))}
        {at === "icons" && [folder("project-icons"), folder("job-icons")]}
        {at === "project-icons" && icons(PROJECT_ICONS)}
        {at === "job-icons" && icons(JOB_ICONS)}
        {at === "rooms" && (
          <>
            {ROOM_LIST.map((r) => (
              <button key={r.room} type="button" className="finder-item" onClick={() => onRoom(r.room)} title={`Go to ${r.name}`}>
                <img src={ROOM_ICON[r.room] ?? r.icon} alt="" loading="lazy" />
                <span>{r.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/** the apps in the dock along the bottom of the screen, with their own icons:
    Molly's own, there only for someone signed in with Google (nothing asks
    them to; they have to have done it themselves) */
const DOCK = [
  { name: "ilovework", href: "https://ilovework.app", icon: `${process.env.PUBLIC_URL}/palais/imac/ilovework.webp` },
  { name: "ghostMind", href: "https://ghostmind.io", icon: `${process.env.PUBLIC_URL}/palais/imac/ghostmind.webp` },
];

/** the Mac's screen, up close: the desktop, its dock and the windows that
    open on it. The library's iMac shows it, and so does the Projects page,
    which keeps just the Finder in the dock (never ilovework or ghostMind) */
export function ImacScreen({
  tall,
  onRoom,
  folders = true,
}: {
  tall: boolean;
  onRoom: (r: Place) => void;
  folders?: boolean;
}) {
  const screen = tall ? SCREEN_ALONE : SCREEN;
  const [app, setApp] = useState<App>(null);
  const { me } = useAccount();
  return (
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

            {/* the projects, in a grid across the left of the desktop */}
            <div className="imac-apps">
              {/* the Read me, first, top left */}
              <button type="button" className="imac-app imac-app--readme" onClick={() => setApp("readme")}>
                <span className="imac-app-emoji" aria-hidden>
                  📄
                </span>
                <span>README.md</span>
              </button>
              {APPS.map((a) => (
                <a key={a.title} className="imac-app" href={a.href} target="_blank" rel="noopener noreferrer" title={a.title}>
                  <img className={a.own ? "is-own" : undefined} src={a.icon} alt="" loading="lazy" />
                  <span>{a.name}</span>
                </a>
              ))}
            </div>

            {/* the dock: Molly's own apps, each opening its site */}
            <nav className="imac-dock" aria-label="Apps">
              {/* the Finder, first in the dock, as on a Mac */}
              <button type="button" className="imac-dock-app" onClick={() => setApp("finder")} title="Finder">
                <img src={`${process.env.PUBLIC_URL}/palais/imac/finder.svg`} alt="" />
                <span>Finder</span>
              </button>
              {folders && (
                <>
              <button type="button" className="imac-dock-app" onClick={() => setApp("favs")} title="My favs">
                <img className="imac-dock-pixel" src={HEART} alt="" />
                <span>My favs</span>
              </button>
              <button type="button" className="imac-dock-app" onClick={() => setApp("school")} title="Academy">
                <img className="imac-dock-pixel" src={APPLE} alt="" />
                <span>Academy</span>
              </button>
                </>
              )}
              {folders && (
                <>
              <button type="button" className="imac-dock-app" onClick={() => setApp("gifs")} title="GIF maker">
                <span className="imac-dock-emoji imac-dock-emoji--film" aria-hidden>
                  🎞
                </span>
                <span>GIF maker</span>
              </button>
              <button type="button" className="imac-dock-app" onClick={() => setApp("split")} title="Splitter">
                <span className="imac-dock-emoji" aria-hidden>
                  🎱
                </span>
                <span>Splitter</span>
              </button>
              <button type="button" className="imac-dock-app" onClick={() => setApp("oneline")} title="One line">
                <span className="imac-dock-emoji imac-dock-emoji--thread" aria-hidden>
                  🧵
                </span>
                <span>One line</span>
              </button>
                </>
              )}
              {folders && me?.google && DOCK.map((d) => (
                <a key={d.name} className="imac-dock-app" href={d.href} target="_blank" rel="noopener noreferrer" title={d.name}>
                  <img src={d.icon} alt="" />
                  <span>{d.name}</span>
                </a>
              ))}
            </nav>

            {app && <div className="imac-scrim" aria-hidden />}
            {app && (
              <div className={app === "gifs" || app === "split" || app === "oneline" || app === "finder" || app === "favs" || app === "school" || app === "readme" ? "imac-window imac-window--wide" : "imac-window"}>
                <div className="imac-window-bar">
                  <button type="button" className="imac-window-shut" onClick={() => setApp(null)} aria-label="Close the window" />
                  <span>{TITLES[app]}</span>
                </div>
                <div className="imac-window-body">
                  {app === "gifs" ? (
                    <GifMaker />
                  ) : app === "split" ? (
                    <StringSplitter />
                  ) : app === "oneline" ? (
                    <OneLine />
                  ) : app === "readme" ? (
                    <Readme />
                  ) : (
                    <Finder
                      key={app}
                      start={app === "school" || app === "favs" ? app : "home"}
                      onRoom={(r) => {
                        onRoom(r);
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {tall && <img className="imac-keys" src={KEYBOARD} alt="" />}
      </div>
  );
}

export function LibraryImac({ room = "library" }: { room?: "library" | "school" }) {
  const { place, go } = usePlace();
  const here = place === room;
  const mac = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(() => here && AT_THE_MAC());
  const tall = usePortrait();
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");

  /* keep it standing on the desk, wherever the photograph has landed */
  useLayoutEffect(() => {
    const el = mac.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(`.palais-room--${room} img`))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const box = coverBox(img, stage);
      if (room === "school") {
        placeOver(el, box, schoolSpot(img, "ibook"), stage);
        return;
      }
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
  }, [here, room]);

  /* the address says whether you're at the iMac, so it can be sent to someone */
  useEffect(() => {
    if (!here) return setOpen(false);
    const want = open ? `#${room}/mac` : `#${room}`;
    if (window.location.hash !== want) window.history.replaceState(window.history.state, "", want);
  }, [open, here, room]);
  useEffect(() => {
    const onHash = () => AT_THE_MAC() && setOpen(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
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
        className={room === "school" ? "palais-imac-spot palais-imac-spot--photo" : "palais-imac-spot"}
        aria-label={room === "school" ? "The iBook on the teacher's desk" : "The iMac on the desk"}
        title={room === "school" ? "The iBook" : "The iMac"}
        onClick={() => setOpen(true)}
      >
        {room === "library" && <img src={propSrc(ON_DESK)} alt="" />}
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

            <ImacScreen
              tall={tall}
              onRoom={(r) => {
                go(r);
                close();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
