import { floralSrc, useFloral } from "./florals";

/**
 * The footer: one of Molly's floral patterns, running the width of the room,
 * turning through them slowly (florals.ts). The pattern it has just come off
 * lies underneath and fades out, so the change is a dissolve rather than a jump.
 *
 * The pattern tiles horizontally at its natural height, so the flowers stay
 * the same size at any width instead of stretching.
 *
 * It also keeps a shelf for the album that's on the deck: on a phone the room
 * hasn't space for YouTube's player beside the turntable, so the player stands
 * down here on the flowers instead, propped against them, and the turntable up
 * in the room works it (RoomRadio). The shelf is invisible until something is
 * put on it.
 */
export function Footer() {
  const { now, was } = useFloral("footer");
  return (
    <footer className="palais-footer">
      <div className="palais-footer-band">
        {was && <div aria-hidden className="palais-floral palais-floral--out" style={{ backgroundImage: `url("${floralSrc(was)}")` }} />}
        <div aria-hidden className="palais-floral" key={now} style={{ backgroundImage: `url("${floralSrc(now)}")` }} />
        {/* the gilt rule where the floor meets it is the room's hem, up at the
            bottom of the stage (PalaisHome), so it shows without scrolling */}
        {/* the light in the room reaches the top of the band */}
        <div aria-hidden className="palais-footer-light" />
        {/* the album stands on the flowers themselves */}
        <div className="lake-shelf" id="palais-record-shelf" />
      </div>
    </footer>
  );
}
