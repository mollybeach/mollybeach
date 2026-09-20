import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { nextFloral, paletteOf, useFloral } from "./florals";
import { arrivalVars } from "./conjureSchedule";
import { currentSeason, holdSeasons, skipSeason, upcomingSeason, type Season } from "./seasons";
import { Catalogue } from "./Catalogue";
import { WorldMap } from "./WorldMap";
import { CharacterCatalog } from "./CharacterCatalog";
import { LayoutNow, PhoneLayoutNow, settle, type SeasonLayout } from "./arrangement";
import { defaultLook, hiddenFor } from "./roomLayouts";
import { usePortrait } from "./PortraitTerrace";
import { useCollection } from "./useCollection";
import { usePlace } from "./place";
import { useClosetHiddenDefault } from "./closetRacks";
import { isPortable, resolvePortable } from "./crossDevice";
import { noteDoing } from "./visits";
import { JustPlaced } from "./justPlaced";
import { pickSticker, resizeSticker, usePicked } from "./Draggable";
import { capture } from "./arrangement";
import { saveSeasonDefault } from "./layoutsDb";

/** the solid jewel a chosen thing wears — the sidebar's selected link, exactly
    (Sidebar.tsx), so these switches turn colour with the patterns */
const jewelled = (palette: { jewel: string; ink: string }) => ({
  backgroundColor: palette.jewel,
  color: "#fffaf0",
  boxShadow: `0 1px 0 ${palette.ink}`,
  borderColor: palette.ink,
});


/**
 * Small brass switches pinned to the top-right corner of the room.
 *
 * "Hide the items" shows or hides every sticker, leaving the photograph and its
 * falling pollen behind. It hides them by making them transparent rather than
 * removing them from the page: removed and put back, every animation would
 * start over, and the room would replay its whole entrance — slow enough that
 * the button would seem not to work. This way everything carries on unseen and
 * is simply there again, mid-motion, the moment it's shown.
 *
 * "Catalogue" opens the catalogue of every sticker (Catalogue.tsx), where each
 * one, or a whole shelf of them, can be put in the room or taken out. What's
 * taken out is one list of ids, answered by a rule written into the page, so
 * no prop has to know about it. (The blossoms start taken out.)
 *
 * On a phone the sentences don't fit beside the menu button, so each switch
 * becomes a one-word chip with a lamp in it: lit while that thing is showing.
 *
 * Where the terrace turns through the seasons, one more button hurries the
 * year along to the next one. It names the season it will bring.
 *
 * The stickers go with you into every room on the map. Each room wears its
 * own layout for the season and device (roomLayouts.ts), so a room starts
 * empty until it's dressed from the catalogue and saved.
 */
/** the four seasons as small drawings, inked in whatever colour the button is
    written in, rather than as emoji */
function SeasonMark({ season }: { season: string }) {
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const art =
    season === "spring" ? (
      <>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={12} cy={7.4} rx={2.6} ry={4.2} transform={`rotate(${a} 12 12)`} {...line} />
        ))}
        <circle cx={12} cy={12} r={1.5} fill="currentColor" />
      </>
    ) : season === "summer" ? (
      <>
        <circle cx={12} cy={12} r={4.4} {...line} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M12 3.4V5.8" transform={`rotate(${a} 12 12)`} {...line} />
        ))}
      </>
    ) : season === "autumn" ? (
      <>
        <path d="M12 20.5V11" {...line} />
        <path d="M12 11c0-4 2.6-7 6.4-7.6.6 3.8-1 7.6-6.4 7.6Z" {...line} />
        <path d="M12 14.6c-3.4 0-5.6-2-6-5.2 3.2-.4 5.6 1.6 6 5.2Z" {...line} />
      </>
    ) : (
      <>
        <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" {...line} />
        <path d="M9.4 4.9 12 7.5l2.6-2.6M9.4 19.1 12 16.5l2.6 2.6" {...line} />
        <path d="M4.6 11.2 5.4 7.8l3.4.5M19.4 12.8l-.8 3.4-3.4-.5" {...line} />
        <path d="M8.8 15.7l-3.4.5-.8-3.4M15.2 8.3l3.4-.5.8 3.4" {...line} />
      </>
    );
  return (
    <svg className="palais-season-mark" viewBox="0 0 24 24" aria-hidden>
      {art}
    </svg>
  );
}

/** the heart on the catalogue button, drawn so it can carry a proper weight */
/** the chip that opens the characters, drawn as a little person */
function PersonMark() {
  return (
    <svg className="palais-person-mark" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7.6" r="3.4" />
      <path d="M5.2 20.2c.6-4 3.3-6.4 6.8-6.4s6.2 2.4 6.8 6.4" />
    </svg>
  );
}

/** the chip that puts the room's things away, drawn as a chair */
function ChairMark() {
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg className="palais-chair-mark" viewBox="0 0 24 24" aria-hidden>
      {/* the back: two posts under a shell rail, with a slat across */}
      <path d="M7.6 13.2V6.4a4.4 4.4 0 0 1 8.8 0v6.8" {...line} />
      <path d="M7.6 9.4h8.8" {...line} />
      {/* the seat, the legs, and the rail between them */}
      <path d="M5.8 13.2h12.4" {...line} />
      <path d="M7.2 13.2v7.2M16.8 13.2v7.2" {...line} />
      <path d="M7.2 18.6h9.6" {...line} />
    </svg>
  );
}

function HeartMark() {
  return (
    <svg className="palais-heart-mark" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 20.4S3.4 14.9 3.4 9.3A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.6 2.7c0 5.6-8.6 11.1-8.6 11.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StickerToggle({ children, seasons = false }: { children: ReactNode; seasons?: boolean }) {
  const [room, setRoom] = useState(true);
  // on a phone the room has its own layouts (phoneLayout.ts)
  const portrait = usePortrait();
  const device = portrait ? "phone" : "desktop";
  const { place, go } = usePlace();
  const inPalace = place === "palace";
  const inCloset = place === "closet";
  const collection = useCollection();
  const switches = useRef<HTMLDivElement>(null);
  const [upcoming, setUpcoming] = useState<Season>("summer");
  const [season, setSeason] = useState<Season>("spring");

  /* Each room, season and device brings its own look: what's in the room, and
     where. The room's default in the saved collection wins, then the palace's
     layouts in the code; any other room starts empty. A look can also be
     tried on from the catalogue; it's worn until the season or room changes
     or the default changes. */
  const desktopDefault = defaultLook(collection.saved, place, season, "desktop");
  const phoneDefault = defaultLook(collection.saved, place, season, "phone");
  // changes when a different look becomes a default, or a default is saved
  // over — not when one is only renamed
  const defaultKey = useMemo(
    () =>
      [desktopDefault, phoneDefault]
        .map((d) => (d.saved ? `${d.saved.id}:${JSON.stringify(d.saved.props)}` : d.source))
        .join("|") + `|${place}|${season}`,
    [desktopDefault, phoneDefault, place, season],
  );

  // what's been taken out of the room
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(hiddenFor((portrait ? phoneDefault : desktopDefault).layout, place)),
  );
  const [catalogue, setCatalogue] = useState(false);
  const closeCatalogue = useCallback(() => setCatalogue(false), []);
  // the world map (WorldMap.tsx)
  const [map, setMap] = useState(false);
  const closeMap = useCallback(() => setMap(false), []);
  const [cast, setCast] = useState(false);
  const closeCast = useCallback(() => setCast(false), []);
  // what's been taken out of the closet (Wardrobe.tsx); everything starts in it
  const [closetHidden, setClosetHiddenState] = useState<Set<string>>(() => new Set());
  // Molly's saved list of what's taken out (closetRacks.ts): worn once it loads,
  // unless the hearts have already been changed here
  const closetHiddenDefault = useClosetHiddenDefault();
  const touchedCloset = useRef(false);
  const setClosetHidden = useCallback((next: Set<string>) => {
    touchedCloset.current = true;
    setClosetHiddenState(next);
  }, []);
  useEffect(() => {
    if (!touchedCloset.current) setClosetHiddenState(new Set(closetHiddenDefault));
  }, [closetHiddenDefault]);

  const [wearing, setWearing] = useState<{ desktop: SeasonLayout; phone: SeasonLayout; rev: number }>(() => ({
    desktop: desktopDefault.layout,
    phone: phoneDefault.layout,
    rev: 0,
  }));
  const [rearranging, setRearranging] = useState(false);
  const glide = useRef<ReturnType<typeof setTimeout>>();
  const now = useRef({ place, portrait });
  now.current = { place, portrait };

  /* the characters put into each room from the character catalogue. A look
     going on (the season turning, walking in) would otherwise take them
     straight back out; they stay until they're taken out by hand */
  const standingIn = useRef(new Map<string, Set<string>>());
  const castIn = (at: string) => {
    let set = standingIn.current.get(at);
    if (!set) standingIn.current.set(at, (set = new Set()));
    return set;
  };

  /** put a look on the room for this device (and, with both, for the other too) */
  const worn = useRef(wearing);
  worn.current = wearing;
  const wear = useCallback((look: { desktop?: SeasonLayout; phone?: SeasonLayout }, animate = true) => {
    const { place: at, portrait: tall } = now.current;
    const w = worn.current;
    const next = { desktop: look.desktop ?? w.desktop, phone: look.phone ?? w.phone, rev: w.rev + 1 };
    worn.current = next;
    setWearing(next);
    const standing = standingIn.current.get(at);
    setHidden(new Set(hiddenFor(tall ? next.phone : next.desktop, at).filter((id) => !standing?.has(id))));
    clearTimeout(glide.current);
    setRearranging(animate);
    if (animate) glide.current = setTimeout(() => setRearranging(false), 1800);
  }, []);
  /** try a look on from the catalogue, on whichever device this is */
  const tryOn = useCallback(
    (layout: SeasonLayout) => wear(now.current.portrait ? { phone: layout } : { desktop: layout }),
    [wear],
  );
  useEffect(() => () => clearTimeout(glide.current), []);
  /** put stickers into the room as it is (after anything tried on just before) */
  const [justPlaced, setJustPlaced] = useState<Map<string, number>>(() => new Map());

  const putIn = useCallback((ids: string[]) => {
    setHidden((h) => {
      const next = new Set(h);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    // and stand them in the middle of the view, so they are never lost behind
    // the furniture (justPlaced.ts)
    setJustPlaced((was) => {
      const next = new Map(was);
      ids.forEach((id) => next.set(id, next.size));
      return next;
    });
  }, []);

  /* things stand in the middle of the view until you walk into another room —
     the seasons may turn over them meanwhile, and they stay where they were
     put. After that they're wherever the layout, or a hand, has left them. */
  useEffect(() => {
    setJustPlaced(new Map());
    pickSticker(null);
  }, [place]);

  const latestDefaults = useRef({ desktop: desktopDefault.layout, phone: phoneDefault.layout });
  latestDefaults.current = { desktop: desktopDefault.layout, phone: phoneDefault.layout };
  const firstLook = useRef(true);
  const lastPlace = useRef(place);
  useEffect(() => {
    if (firstLook.current) {
      firstLook.current = false;
      return;
    }
    // walking into another room swaps its things in at once; a turning season glides
    const moved = lastPlace.current !== place;
    lastPlace.current = place;
    wear(latestDefaults.current, !moved);
  }, [defaultKey, wear, portrait, place]);

  // undo any dragging once the new look is on (see settle)
  useLayoutEffect(() => {
    if (wearing.rev === 0) return;
    const scope = switches.current?.closest(".palais-stage");
    if (scope) settle(scope, wearing.desktop, wearing.phone);
  }, [wearing]);

  // a look saved on the other device: put its stickers where they belong here (crossDevice.ts)
  const wornHere = portrait ? wearing.phone : wearing.desktop;
  useEffect(() => {
    if (!isPortable(wornHere)) return;
    const scope = switches.current?.closest<HTMLElement>(".palais-stage");
    if (!scope) return;
    return resolvePortable(scope, place, portrait ? "phone" : "desktop", wornHere);
  }, [wornHere, place, portrait]);

  // pauses the year, and the furniture taking turns to vanish (Conjure)
  const [paused, setPaused] = useState(false);
  const stage = () => switches.current?.closest(".palais-stage") ?? null;

  /* whatever sticker was last picked up in the room, and the four switches
     that work on it: bigger, smaller, out of the room, and keep it. They save
     walking back into the catalogue for every little change. */
  const picked = usePicked();
  const sidebarFloral = useFloral("sidebar");
  const jewel = paletteOf(sidebarFloral.now);
  const [keeping, setKeeping] = useState<"" | "busy" | "kept" | "no">("");

  const sizePicked = (factor: number) => {
    const scope = stage();
    if (scope && picked) resizeSticker(scope, ".palais-layer [data-prop]", picked, factor);
  };
  const takePickedOut = () => {
    if (!picked) return;
    setHiddenHeld(new Set([...Array.from(hidden), picked]));
    pickSticker(null);
  };
  /** keep the room as it stands: this season's look on this device */
  const keepTheRoom = async () => {
    const scope = stage();
    if (!scope || !collection.editor?.canSave) return;
    setKeeping("busy");
    try {
      const { stage: size, props } = capture(scope as HTMLElement, hidden);
      await saveSeasonDefault(collection.saved, {
        place,
        season,
        device,
        name: `${season} · the room as it was`,
        stage: size,
        props,
      });
      await collection.refresh();
      setKeeping("kept");
    } catch {
      setKeeping("no");
    } finally {
      setTimeout(() => setKeeping(""), 2200);
    }
  };

  /* on to the next season. The header's Skip pill does this, and so does the
     season on the catalogue's own plaque */
  const skip = useCallback(() => {
    const scope = switches.current?.closest(".palais-stage");
    if (!scope) return;
    skipSeason(scope, paused);
    setUpcoming(upcomingSeason(scope));
    setSeason(currentSeason(scope));
  }, [paused]);

  /* When Molly, signed in, moves, resizes, puts in or takes out anything, the
     year holds still. Otherwise the season could turn before she saves, and
     the next season's layout would sweep her changes away (each season keeps
     its own). "Play seasons" lets it carry on. */
  const owner = Boolean(collection.editor?.canSave && collection.editor.email.toLowerCase() === "mollyjbeach@gmail.com");
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const holdForEditing = useCallback(() => {
    if (!ownerRef.current || !seasons) return;
    const scope = switches.current?.closest(".palais-stage");
    if (scope) holdSeasons(scope, true);
    setPaused(true);
  }, [seasons]);
  useEffect(() => {
    window.addEventListener("palais:arranged", holdForEditing);
    return () => window.removeEventListener("palais:arranged", holdForEditing);
  }, [holdForEditing]);
  const setHiddenHeld = useCallback(
    (next: Set<string>) => {
      holdForEditing();
      setHidden(next);
    },
    [holdForEditing],
  );

  // keep the label, and the season the room is dressed for, in step with the
  // year as it turns on its own
  useEffect(() => {
    if (!seasons) return;
    const tick = () => {
      const scope = switches.current?.closest(".palais-stage");
      if (!scope) return;
      // also catches photographs that were swapped (turning a phone round
      // changes which set is showing) and would otherwise start playing
      holdSeasons(scope, paused);
      setUpcoming(upcomingSeason(scope));
      setSeason(currentSeason(scope));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [seasons, paused]);

  return (
    <>
      <div className="palais-switches" ref={switches}>
        {picked && (
          <span className="palais-picked" role="group" aria-label="The piece you picked up">
            <button
              type="button"
              className="palais-pill palais-pill--picked"
              style={jewelled(jewel)}
              onClick={() => sizePicked(1.12)}
              aria-label="Make it bigger"
              title="Bigger"
            >
              +
            </button>
            <button
              type="button"
              className="palais-pill palais-pill--picked"
              style={jewelled(jewel)}
              onClick={() => sizePicked(1 / 1.12)}
              aria-label="Make it smaller"
              title="Smaller"
            >
              −
            </button>
            <button
              type="button"
              className="palais-pill palais-pill--picked"
              style={jewelled(jewel)}
              onClick={takePickedOut}
              aria-label="Take it out of the room"
              title="Take it out"
            >
              ×
            </button>
            {collection.editor?.canSave && (
              <button
                type="button"
                className="palais-pill palais-pill--picked"
                style={jewelled(jewel)}
                onClick={keepTheRoom}
                disabled={keeping === "busy"}
                aria-label={`Keep the room as it is, as the ${season} look`}
                title={`Keep the room as the ${season} look`}
              >
                {keeping === "busy" ? "…" : keeping === "kept" ? "✓" : keeping === "no" ? "!" : "❤"}
              </button>
            )}
          </span>
        )}
        {!inPalace && (
          <button type="button" onClick={() => go("palace")} className="palais-pill palais-pill--home" aria-label="Back to the Palais">
            <span className="palais-pill-long">← Palais</span>
            <span className="palais-pill-short">← Palais</span>
          </button>
        )}
        {seasons && (
          <button
            type="button"
            onClick={skip}
            aria-label={`Skip to ${upcoming}`}
            className="palais-pill palais-pill--action"
          >
            <span className="palais-pill-long">
              <SeasonMark season={upcoming} /> Skip
            </span>
            <span className="palais-pill-short">
              <SeasonMark season={upcoming} />
            </span>
          </button>
        )}
        {seasons && (
          <button
            type="button"
            onClick={() => {
              const next = !paused;
              setPaused(next);
              const scope = stage();
              if (scope) holdSeasons(scope, next);
            }}
            aria-pressed={paused}
            aria-label={paused ? "Play the seasons" : "Pause the seasons"}
            title={paused ? "Let the year carry on" : `Stay in ${season}`}
            className="palais-pill palais-pill--action"
          >
            <span className="palais-pill-long">{paused ? "▶ Seasons" : "❚❚ Seasons"}</span>
            <span className="palais-pill-short" aria-hidden>{paused ? "▶" : "❚❚"}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setCatalogue(true);
            noteDoing("catalogue");
          }}
          aria-haspopup="dialog"
          aria-label={inCloset ? "Open the wardrobe catalogue" : "Open the catalogue"}
          className="palais-pill palais-pill--catalogue"
        >
          <span className="palais-pill-long">
            <HeartMark /> {inCloset ? "Wardrobe" : "Catalogue"}
          </span>
          <span className="palais-pill-short">
            <HeartMark /> {inCloset ? "Wardrobe" : "Catalogue"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMap(true)}
          aria-haspopup="dialog"
          aria-label="Open the world map"
          className="palais-pill palais-pill--map"
        >
          <svg
            className="palais-map-icon"
            viewBox="0 0 24 24"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.4 6.6 9 4.2l6 2.4 5.6-2.4v13.2L15 19.8l-6-2.4-5.6 2.4Z" />
            <path d="M9 4.2v13.2M15 6.6v13.2" />
            <path d="M10.9 10.9l2.2 2.2m0-2.2-2.2 2.2" />
          </svg>
          <span className="palais-pill-long">Map</span>
          <span className="palais-pill-short">Map</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setCast(true);
            noteDoing("characters");
          }}
          aria-haspopup="dialog"
          aria-label="Open the characters"
          className="palais-pill palais-pill--cast"
        >
          <PersonMark />
          <span className="palais-pill-long">Characters</span>
          <span className="palais-pill-short">Cast</span>
        </button>
        <button
          type="button"
          onClick={() => nextFloral()}
          aria-label="Change the floral patterns"
          title="Change the floral patterns"
          className="palais-pill palais-pill--floral"
        >
          <span className="palais-pill-long">
            <span className="palais-floral-mark" aria-hidden>
              ✿
            </span>{" "}
            Pattern
          </span>
          <span className="palais-pill-short" aria-hidden>
            ✿
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRoom((v) => !v)}
          aria-pressed={room}
          aria-label={room ? "Hide the items" : "Show the items"}
          className="palais-pill"
        >
          <span className="palais-pill-long">
            <ChairMark /> {room ? "Hide" : "Show"}
          </span>
          <span className="palais-pill-short">
            <ChairMark />
          </span>
        </button>
      </div>

      {/* the sticker layer: empty on arrival, then everything materialises */}
      <div
        className="palais-arrive"
        style={arrivalVars()}
        data-conjure-paused={paused ? "" : undefined}
        data-season={seasons ? season : undefined}
        data-rearranging={rearranging ? "" : undefined}
      >
        {/* the arrival animates the layer's own opacity, which would override
            an opacity set on it here, so hiding happens one level in */}
        <div className="palais-layer" data-hidden={room ? undefined : ""} aria-hidden={room ? undefined : true}>
          <JustPlaced.Provider value={justPlaced}>
            <LayoutNow.Provider value={wearing.desktop}>
              <PhoneLayoutNow.Provider value={wearing.phone}>{children}</PhoneLayoutNow.Provider>
            </LayoutNow.Provider>
          </JustPlaced.Provider>
        </div>
      </div>

      {/* what the catalogue has taken out of the room. Hidden rather than
          removed, for the same reason as "Hide the items". */}
      {hidden.size > 0 && (
        <style>
          {`${Array.from(hidden)
            .map((id) => `.palais .palais-layer [data-prop="${id}"]`)
            .join(",\n")} { visibility: hidden !important; }`}
        </style>
      )}

      {closetHidden.size > 0 && (
        <style>
          {`${Array.from(closetHidden)
            .map((id) => `.palais .palais-closet [data-prop="${id}"]`)
            .join(",\n")} { visibility: hidden !important; }`}
        </style>
      )}

      <WorldMap open={map} onClose={closeMap} />
      <CharacterCatalog
        open={cast}
        onClose={closeCast}
        hidden={hidden}
        onPutIn={(ids) => {
          ids.forEach((id) => castIn(place).add(id));
          putIn(ids);
        }}
        onTakeOut={(ids) => {
          ids.forEach((id) => castIn(place).delete(id));
          setHiddenHeld(new Set([...Array.from(hidden), ...ids]));
        }}
      />

      <Catalogue
        open={catalogue}
        onClose={closeCatalogue}
        place={place}
        device={device}
        hidden={hidden}
        setHidden={setHiddenHeld}
        closetHidden={closetHidden}
        setClosetHidden={setClosetHidden}
        collection={collection}
        season={season}
        wearing={portrait ? wearing.phone : wearing.desktop}
        onWear={tryOn}
        onPutIn={putIn}
        onSkipSeason={seasons ? skip : undefined}
      />
    </>
  );
}
