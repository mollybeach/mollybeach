import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { arrivalVars } from "./conjureSchedule";
import { currentSeason, holdSeasons, skipSeason, upcomingSeason, type Season } from "./seasons";
import { Catalogue } from "./Catalogue";
import { WorldMap } from "./WorldMap";
import { LayoutNow, PhoneLayoutNow, settle, type SeasonLayout } from "./arrangement";
import { defaultLook, hiddenFor } from "./roomLayouts";
import { usePortrait } from "./PortraitTerrace";
import { useCollection } from "./useCollection";
import { usePlace } from "./place";
import { useClosetHiddenDefault } from "./closetRacks";

/**
 * Small brass switches pinned to the top-right corner of the room.
 *
 * "Hide the room" shows or hides every sticker, leaving the photograph and its
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

  /** put a look on the room for this device (and, with both, for the other too) */
  const worn = useRef(wearing);
  worn.current = wearing;
  const wear = useCallback((look: { desktop?: SeasonLayout; phone?: SeasonLayout }, animate = true) => {
    const { place: at, portrait: tall } = now.current;
    const w = worn.current;
    const next = { desktop: look.desktop ?? w.desktop, phone: look.phone ?? w.phone, rev: w.rev + 1 };
    worn.current = next;
    setWearing(next);
    setHidden(new Set(hiddenFor(tall ? next.phone : next.desktop, at)));
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
  const putIn = useCallback((ids: string[]) => {
    setHidden((h) => {
      const next = new Set(h);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

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

  // pauses the year, and the furniture taking turns to vanish (Conjure)
  const [paused, setPaused] = useState(false);
  const stage = () => switches.current?.closest(".palais-stage") ?? null;

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
        {!inPalace && (
          <button type="button" onClick={() => go("palace")} className="palais-pill palais-pill--home" aria-label="Back to the palace">
            <span className="palais-pill-long">← Back to the palace</span>
            <span className="palais-pill-short">← Palace</span>
          </button>
        )}
        {seasons && (
          <button
            type="button"
            onClick={() => {
              const scope = stage();
              if (!scope) return;
              skipSeason(scope, paused);
              setUpcoming(upcomingSeason(scope));
              setSeason(currentSeason(scope));
            }}
            aria-label={`Skip to ${upcoming}`}
            className="palais-pill palais-pill--action"
          >
            <span className="palais-pill-long">Skip to {upcoming}</span>
            <span className="palais-pill-short">Season</span>
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
            title={paused ? "Let the year carry on, and the furniture vanish in turns" : `Stay in ${season}, with all the furniture in place`}
            className="palais-pill palais-pill--action"
          >
            <span className="palais-pill-long">{paused ? "Play seasons" : "Pause seasons"}</span>
            <span className="palais-pill-short">{paused ? "Play" : "Pause"}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setCatalogue(true)}
          aria-haspopup="dialog"
          aria-label={inCloset ? "Open the wardrobe catalogue" : "Open the catalogue"}
          className="palais-pill palais-pill--catalogue"
        >
          <span className="palais-pill-long">{inCloset ? "♡ Wardrobe" : "♡ Catalogue"}</span>
          <span className="palais-pill-short">{inCloset ? "♡ Wardrobe" : "♡ Catalogue"}</span>
        </button>
        <button
          type="button"
          onClick={() => setMap(true)}
          aria-haspopup="dialog"
          aria-label="Open the world map"
          className="palais-pill palais-pill--map"
        >
          <svg className="palais-map-icon" viewBox="0 0 24 24" aria-hidden>
            <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20Z" fill="#fff6d6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M8.5 4v13.5M15.5 6.5V20" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11.5l2 2m0-2-2 2" stroke="#ff4f8b" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="palais-pill-long">Map</span>
          <span className="palais-pill-short">Map</span>
        </button>
        <button
          type="button"
          onClick={() => setRoom((v) => !v)}
          aria-pressed={room}
          aria-label={room ? "Hide the room" : "Show the room"}
          className="palais-pill"
        >
          <span className="palais-pill-long">{room ? "Hide the room" : "Show the room"}</span>
          <span className="palais-pill-short">Room</span>
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
          <LayoutNow.Provider value={wearing.desktop}>
            <PhoneLayoutNow.Provider value={wearing.phone}>{children}</PhoneLayoutNow.Provider>
          </LayoutNow.Provider>
        </div>
      </div>

      {/* what the catalogue has taken out of the room. Hidden rather than
          removed, for the same reason as "Hide the room". */}
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

      <Catalogue
        open={catalogue}
        onClose={closeCatalogue}
        place={place}
        device={device}
        hidden={hidden}
        setHidden={setHidden}
        closetHidden={closetHidden}
        setClosetHidden={setClosetHidden}
        collection={collection}
        season={season}
        wearing={portrait ? wearing.phone : wearing.desktop}
        onWear={tryOn}
        onPutIn={putIn}
      />
    </>
  );
}
