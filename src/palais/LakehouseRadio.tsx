import { usePlace } from "./place";

/**
 * The Lakehouse radio: Vulfpeck's "The Beautiful Game", the full album from
 * Vulf's own YouTube channel, playing on a little radio in the corner of the
 * Lakehouse.
 *
 * It's YouTube's own player, embedded — the album isn't copied onto the site —
 * and YouTube asks that its player stay visible and at least 200px square, so
 * the radio shows it rather than hiding it. Browsers won't start sound on
 * their own; the visitor presses play. Leaving the Lakehouse takes the radio
 * away, and the music with it.
 *
 * youtube-nocookie.com is YouTube's privacy-enhanced embed: nothing is stored
 * on the visitor's machine until they press play.
 */

const VIDEO = "DRdnpKRvMwI";
const SRC = `https://www.youtube-nocookie.com/embed/${VIDEO}?rel=0&playsinline=1&modestbranding=1`;

export function LakehouseRadio() {
  const { place } = usePlace();
  if (place !== "lakehouse") return null;

  return (
    <aside className="lake-radio" aria-label="The Lakehouse radio">
      <p className="lake-radio-dial">
        <span aria-hidden>♪</span> The Lakehouse Radio
      </p>
      <div className="lake-radio-screen">
        <iframe
          src={SRC}
          title="Vulfpeck — The Beautiful Game (full album)"
          width={200}
          height={200}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
      <p className="lake-radio-now">Vulfpeck · The Beautiful Game</p>
    </aside>
  );
}
