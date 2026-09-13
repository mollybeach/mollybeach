import { useState, type ReactNode } from "react";
import { arrivalVars } from "./conjureSchedule";

/**
 * Small brass switches pinned to the top-right corner of the room.
 *
 * "Hide the room" shows or hides every sticker, leaving the photograph and its
 * falling pollen behind — hiding with `display:none` also stops the
 * animations, which keeps the empty room perfectly still.
 *
 * The other two hide one named group each (the `group` prop on <Prop>): the
 * blossoming things — lilac, jacaranda and both roses — and the trellises. They
 * set a data attribute that one rule in palais.css answers, so no prop has to
 * move in the markup to belong to a group.
 *
 * On a phone the sentences don't fit beside the menu button, so each switch
 * becomes a one-word chip with a lamp in it: lit while that thing is showing.
 */
export function StickerToggle({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState(true);
  // the blossoms start hidden; the button brings them in
  const [blossoms, setBlossoms] = useState(false);
  const [trellises, setTrellises] = useState(true);

  return (
    <>
      <div className="palais-switches">
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
        style={{ ...arrivalVars(), display: room ? undefined : "none" }}
        data-hide-blossoms={blossoms ? undefined : ""}
        data-hide-trellises={trellises ? undefined : ""}
      >
        {children}
      </div>
    </>
  );
}
