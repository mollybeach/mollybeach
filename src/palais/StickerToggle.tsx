import { useEffect, useRef, useState, type ReactNode } from "react";
import { arrivalVars } from "./conjureSchedule";
import { currentSeason, holdSeasons, skipSeason, upcomingSeason, type Season } from "./seasons";

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
 * The other two hide one named group each (the `group` prop on <Prop>): the
 * blossoming things — lilac, jacaranda and both roses — and the trellises. They
 * set a data attribute that one rule in palais.css answers, so no prop has to
 * move in the markup to belong to a group.
 *
 * On a phone the sentences don't fit beside the menu button, so each switch
 * becomes a one-word chip with a lamp in it: lit while that thing is showing.
 *
 * Where the terrace turns through the seasons, one more button hurries the
 * year along to the next one. It names the season it will bring.
 */
export function StickerToggle({ children, seasons = false }: { children: ReactNode; seasons?: boolean }) {
  const [room, setRoom] = useState(true);
  // the blossoms start hidden; the button brings them in
  const [blossoms, setBlossoms] = useState(false);
  const [trellises, setTrellises] = useState(true);

  const switches = useRef<HTMLDivElement>(null);
  const [upcoming, setUpcoming] = useState<Season>("summer");
  const [season, setSeason] = useState<Season>("spring");
  const [paused, setPaused] = useState(false);
  // the furniture taking turns to vanish (Conjure) — on unless switched off
  const [conjuring, setConjuring] = useState(true);
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
            title={paused ? "Let the year carry on" : `Stay in ${season}`}
            className="palais-pill palais-pill--action"
          >
            <span className="palais-pill-long">{paused ? "Play seasons" : "Pause seasons"}</span>
            <span className="palais-pill-short">{paused ? "Play" : "Pause"}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setConjuring((v) => !v)}
          aria-pressed={conjuring}
          disabled={!room}
          aria-label={conjuring ? "Pause the furniture fading" : "Play the furniture fading"}
          title={conjuring ? "Keep all the furniture in the room" : "Let the furniture take turns vanishing again"}
          className="palais-pill"
        >
          <span className="palais-pill-long">{conjuring ? "Pause fading" : "Play fading"}</span>
          <span className="palais-pill-short">Fading</span>
        </button>
        <button
          type="button"
          onClick={() => setTrellises((v) => !v)}
          aria-pressed={trellises}
          disabled={!room}
          aria-label={trellises ? "Hide the trellises" : "Show the trellises"}
          className="palais-pill"
        >
          <span className="palais-pill-long">{trellises ? "Hide the trellises" : "Show the trellises"}</span>
          <span className="palais-pill-short">Trellises</span>
        </button>
        <button
          type="button"
          onClick={() => setBlossoms((v) => !v)}
          aria-pressed={blossoms}
          title="The lilac, the jacaranda, and both roses"
          disabled={!room}
          aria-label={blossoms ? "Hide the blossoms" : "Show the blossoms"}
          className="palais-pill"
        >
          <span className="palais-pill-long">{blossoms ? "Hide the blossoms" : "Show the blossoms"}</span>
          <span className="palais-pill-short">Blossoms</span>
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
        data-hide-blossoms={blossoms ? undefined : ""}
        data-hide-trellises={trellises ? undefined : ""}
        data-conjure-paused={conjuring ? undefined : ""}
        data-season={seasons ? season : undefined}
      >
        {/* the arrival animates the layer's own opacity, which would override
            an opacity set on it here, so hiding happens one level in */}
        <div className="palais-layer" data-hidden={room ? undefined : ""} aria-hidden={room ? undefined : true}>
          {children}
        </div>
      </div>
    </>
  );
}
