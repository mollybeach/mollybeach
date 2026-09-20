import { closetSrc, garment } from "./clothes";

/**
 * Clothes put into an ordinary room.
 *
 * The Wardrobe Wing hangs its clothes on its own rails (Wardrobe.tsx). These
 * are the same pieces brought out into any other room, where they behave like
 * every other sticker instead: they stand in the middle of the room when they
 * are put in, and from there they can be dragged, resized and saved with the
 * look, because they carry the same data-prop the room's things carry
 * (Draggable.tsx, arrangement.ts).
 */

export function RoomClothes({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id, n) => {
        const g = garment(id);
        return (
          <div
            key={id}
            className="palais-room-garment"
            data-prop={id}
            style={{
              // a step along for each, so two put in together aren't exactly
              // on top of one another
              left: `calc(50% + ${(n % 6) * 28}px)`,
              top: `calc(50% + ${(n % 6) * 28}px)`,
              zIndex: 880 + (n % 20),
            }}
          >
            <img
              src={closetSrc(id)}
              alt={g ? g.label : ""}
              title={g ? `${g.label} · ${g.store}` : undefined}
              decoding="async"
              draggable={false}
            />
          </div>
        );
      })}
    </>
  );
}
