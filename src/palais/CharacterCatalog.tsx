import { useEffect, useRef, useState } from "react";
import { Blossoms } from "./WorldMap";
import { floralSrc, paletteOf, useFloral } from "./florals";

/**
 * The characters: the people of the Palais, laid out like the world map.
 *
 * On the left they stand side by side on a patch of the island's grass, and
 * the one you've picked steps forward and lights up; on the right is the same
 * card the map uses for a place, with their picture, a line or two about them,
 * and Back and Next to walk the line-up.
 *
 * It is also a catalogue: each character is a sticker as well (props.ts), so
 * the card can put them into the room you're in, where they stand and can be
 * dragged about like anything else, and take them out again.
 *
 * Each one is a cut-out in /public/palais/characters, with the same picture as
 * a sticker in /public/palais/props. Adding someone is one more entry below,
 * plus the sticker.
 */

interface Character {
  id: string;
  name: string;
  /** a word or two under the name */
  tag: string;
  blurb: string;
  /** little things about them, listed on the card */
  notes: string[];
  /** the colour of the glow when they're picked */
  color: string;
  /** where their face is in the cut-out, as a fraction down it, so the card's
      picture can frame it */
  face: number;
  /** the sticker that puts them in a room */
  sticker: string;
}

const CHARACTERS: Character[] = [
  {
    id: "kate",
    name: "Kate",
    tag: "friend of the Palais",
    blurb: "Kate, bundled up for the cold in a black scarf and vest over a green sweater, grinning like she's just heard the best news.",
    notes: ["A big black fringed scarf", "A deep green crewneck", "A brown leather shoulder bag", "White socks over black Chelsea boots"],
    color: "#3f7f6a",
    face: 0.12,
    sticker: "character_kate_sticker",
  },
];

const src = (c: Character) => `${process.env.PUBLIC_URL}/palais/characters/${c.id}.webp`;

export function CharacterCatalog({
  open,
  onClose,
  hidden,
  onPutIn,
  onTakeOut,
}: {
  open: boolean;
  onClose: () => void;
  /** the stickers taken out of the room, so the card knows who is standing in it */
  hidden: Set<string>;
  onPutIn: (ids: string[]) => void;
  onTakeOut: (ids: string[]) => void;
}) {
  const [here, setHere] = useState(0);
  const paper = useFloral("map");
  const cardPaper = useFloral("card");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setHere((h) => Math.min(CHARACTERS.length - 1, h + 1));
      if (e.key === "ArrowLeft") setHere((h) => Math.max(0, h - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const who = CHARACTERS[here];

  return (
    <div
      className="wm-backdrop"
      style={{
        ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
        ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
        ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
      }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="wm-panel cc-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-title"
        style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
      >
        <Blossoms className="wm-bloom wm-bloom--tl" posy="tl" />
        <Blossoms className="wm-bloom wm-bloom--bl" posy="bl" />
        <Blossoms className="wm-bloom wm-bloom--tr" posy="tr" />
        <Blossoms className="wm-bloom wm-bloom--br" posy="br" />

        <div className="wm-title">
          <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
          <h2 id="cc-title">
            <span aria-hidden>✿</span> Characters <span aria-hidden>✿</span>
          </h2>
          <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
        </div>
        <button ref={closeBtn} type="button" className="wm-close" onClick={onClose} aria-label="Close the characters">
          ×
        </button>

        {/* the line-up, standing on the island's grass */}
        <div className="wm-stage cc-stage">
          <div className="cc-lineup">
            {CHARACTERS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`cc-person${i === here ? " is-on" : ""}`}
                style={{ ["--cc-glow" as string]: c.color }}
                onClick={() => setHere(i)}
                aria-pressed={i === here}
                aria-label={c.name}
              >
                <img src={src(c)} alt="" decoding="async" />
                <span className="cc-name">{c.name}</span>
              </button>
            ))}
          </div>
          <div className="cc-ground" aria-hidden />
        </div>

        <div
          className="wm-card"
          aria-live="polite"
          style={{ backgroundImage: `linear-gradient(rgba(255, 252, 244, 0.93), rgba(251, 243, 232, 0.95)), url("${floralSrc(cardPaper.now)}")` }}
        >
          <div className="wm-card-body">
            <figure className="wm-peek cc-peek">
              <img key={who.id} src={src(who)} alt={who.name} style={{ objectPosition: `50% ${who.face * 100}%` }} decoding="async" />
            </figure>
            <div className="wm-card-head">
              <h3>{who.name}</h3>
              <p className="wm-tag">
                {here + 1} of {CHARACTERS.length} · {who.tag}
              </p>
            </div>
            <p className="wm-blurb">{who.blurb}</p>
            <ul className="wm-finds">
              {who.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div className="wm-actions">
            {hidden.has(who.sticker) ? (
              <button
                type="button"
                className="wm-btn wm-btn--visit"
                onClick={() => {
                  onPutIn([who.sticker]);
                  onClose();
                }}
              >
                Put {who.name} in the room ✿
              </button>
            ) : (
              <button type="button" className="wm-btn" onClick={() => onTakeOut([who.sticker])}>
                ✓ {who.name} is in the room · take out
              </button>
            )}
            <div className="wm-nav">
              <button type="button" className="wm-btn" onClick={() => setHere((h) => Math.max(0, h - 1))} disabled={here === 0}>
                ◀ Back
              </button>
              <button
                type="button"
                className="wm-btn wm-btn--next"
                onClick={() => setHere((h) => Math.min(CHARACTERS.length - 1, h + 1))}
                disabled={here === CHARACTERS.length - 1}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
