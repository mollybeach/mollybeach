import { useState, type ReactNode } from "react";

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
          className="palais-pill"
        >
          {trellises ? "Hide the trellises" : "Show the trellises"}
        </button>
        <button
          type="button"
          onClick={() => setBlossoms((v) => !v)}
          aria-pressed={blossoms}
          title="The lilac, the jacaranda, and both roses"
          disabled={!room}
          className="palais-pill"
        >
          {blossoms ? "Hide the blossoms" : "Show the blossoms"}
        </button>
        <button
          type="button"
          onClick={() => setRoom((v) => !v)}
          aria-pressed={room}
          className="palais-pill"
        >
          {room ? "Hide the room" : "Show the room"}
        </button>
      </div>

      <div
        style={{ display: room ? "contents" : "none" }}
        data-hide-blossoms={blossoms ? undefined : ""}
        data-hide-trellises={trellises ? undefined : ""}
      >
        {children}
      </div>
    </>
  );
}
