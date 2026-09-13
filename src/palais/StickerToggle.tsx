import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { arrivalVars } from "./conjureSchedule";
import { currentSeason, holdSeasons, skipSeason, upcomingSeason, type Season } from "./seasons";
import { Catalogue } from "./Catalogue";
import { HIDDEN_AT_FIRST } from "./shelves";
import { SeasonNow, hiddenIn } from "./arrangement";

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
 */
export function StickerToggle({ children, seasons = false }: { children: ReactNode; seasons?: boolean }) {
  const [room, setRoom] = useState(true);
  // what's been taken out of the room; the blossoms start out of it
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(HIDDEN_AT_FIRST));
  const [catalogue, setCatalogue] = useState(false);
  const closeCatalogue = useCallback(() => setCatalogue(false), []);


  const switches = useRef<HTMLDivElement>(null);
  const [upcoming, setUpcoming] = useState<Season>("summer");
  const [season, setSeason] = useState<Season>("spring");
  // each season brings its own arrangement: what's in the room, and where
  const [rearranging, setRearranging] = useState(false);
  const firstSeason = useRef(true);
  useEffect(() => {
    if (firstSeason.current) {
      firstSeason.current = false;
      return;
    }
    setHidden(new Set(hiddenIn(season) ?? HIDDEN_AT_FIRST));
    setRearranging(true);
    const t = setTimeout(() => setRearranging(false), 1800);
    return () => clearTimeout(t);
  }, [season]);
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
          aria-label="Open the catalogue"
          className="palais-pill palais-pill--catalogue"
        >
          <span className="palais-pill-long">♡ Catalogue</span>
          <span className="palais-pill-short">♡ Catalogue</span>
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
          <SeasonNow.Provider value={season}>{children}</SeasonNow.Provider>
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

      <Catalogue open={catalogue} onClose={closeCatalogue} hidden={hidden} setHidden={setHidden} />
    </>
  );
}
