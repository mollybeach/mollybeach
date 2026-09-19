import { useEffect, useRef, useState } from "react";
import { noteDoing } from "./visits";
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

const CAST: Character[] = [
  {
    id: "molly",
    name: "Molly",
    tag: "keeper of the Palais",
    blurb: "Molly, who the whole place belongs to, as a fallen angel: great black feathered wings, a dark halo floating over her braided crown, and a black gown of cascading ruffles.",
    notes: ["A strapless black chiffon gown in tiers of ruffles, with a high slit", "Black feathered wings", "A halo of dark feathers", "Black pointed heels with little bows, and a fine gold necklace"],
    color: "#5a3a2e",
    face: 0.18,
    sticker: "character_molly_sticker",
  },
  {
    id: "kate",
    name: "Kate",
    tag: "friend of the Palais",
    blurb: "Kate in a dove grey ball gown of tiered tulle ruffles, strapless with a draped bodice, long grey gloves and pearl earrings, smiling sideways at you.",
    notes: ["A strapless dove grey tulle ball gown", "Tiers of ruffled tulle, one on top of another", "Long grey opera gloves", "Pearl drop earrings"],
    color: "#8f9aab",
    face: 0.07,
    sticker: "character_kate_sticker",
  },
  {
    id: "brea",
    name: "Brea",
    tag: "friend of the Palais",
    blurb: "Brea as a peacock: great fanned wings of peacock feathers, her long strawberry blonde curls loose, in a sheer nude gown beaded with emerald vines that spills into a train of feathers.",
    notes: ["Peacock feather wings", "A sheer nude gown beaded with emerald vines and gold", "A tulle train trailing peacock feathers", "An emerald beaded collar"],
    color: "#1f7a5c",
    face: 0.13,
    sticker: "character_brea_sticker",
  },
  {
    id: "leonardo",
    name: "Leonardo",
    tag: "friend of the Palais",
    blurb: "Leonardo, walking through in a black leather jacket with a big fur collar, hands in his pockets and an earbud in, lost in whatever he's listening to.",
    notes: ["A black leather jacket with a fur collar", "A black half-zip underneath", "Black trousers and a black belt", "Black leather loafers"],
    color: "#5a4a8a",
    face: 0.1,
    sticker: "character_leonardo_sticker",
  },
  {
    id: "madeleine",
    name: "Madeleine",
    tag: "friend of the Palais",
    blurb: "Madeleine, all in black with long brown waves and curtain bangs, gazing off to one side like she's thinking of somewhere she'd rather be.",
    notes: ["A black high-neck sleeveless top", "High-waisted black flares", "A gold coin necklace and gold hoops", "Little tattoos on both forearms"],
    color: "#8a4a6a",
    face: 0.1,
    sticker: "character_madeleine_sticker",
  },
  {
    id: "moselle",
    name: "Moselle",
    tag: "friend of the Palais",
    blurb: "Moselle glancing back over her shoulder in a sheer black gown striped with silver ribbon, a bustle of ribbon loops at her hip and a slit to the thigh, her long dark hair in waves.",
    notes: ["A sheer black tulle gown scattered with crystals", "Silver ribbon stripes and a bustle of ribbon loops", "A beaded silver halter and collar", "Black ankle-strap heels"],
    color: "#5b5e66",
    face: 0.08,
    sticker: "character_moselle_sticker",
  },
  {
    id: "kayenat",
    name: "Kayenat",
    tag: "friend of the Palais",
    blurb: "Kayenat in golden-hour light, in a midnight blue velvet anarkali scattered with silver, a sheer ivory dupatta over one shoulder and her long hair blowing loose.",
    notes: ["A navy velvet anarkali with silver embroidery at the hem", "A sheer ivory net dupatta with a worked border", "Silver chandelier earrings", "Tassels of navy velvet at the dupatta's ends"],
    color: "#1f2f6b",
    face: 0.08,
    sticker: "character_kayenat_sticker",
  },
  {
    id: "ella",
    name: "Ella",
    tag: "friend of the Palais",
    blurb: "Ella, up on pointe with one arm raised, in a painted leotard and a sheer wrap skirt, gazing up and away mid-dance.",
    notes: ["A leotard painted with a cameo and classical scrolls", "A sheer grey wrap skirt", "A black velvet choker", "Pink satin pointe shoes"],
    color: "#b58aa0",
    face: 0.13,
    sticker: "character_ella_sticker",
  },
  {
    id: "sarah",
    name: "Sarah",
    tag: "friend of the Palais",
    blurb: "Sarah, all smiles in ivory and gold, with a high dark ponytail, henna on her hand and a long embroidered scarf falling over one shoulder.",
    notes: ["An ivory beaded top with pearl tassels", "Wide flowing ivory trousers with embroidered hems", "A maang tikka and gold bangles", "Henna on her hand"],
    color: "#c9a44c",
    face: 0.09,
    sticker: "character_sarah_sticker",
  },
  {
    id: "stephanie",
    name: "Stephanie",
    tag: "friend of the Palais",
    blurb: "Stephanie, turned half toward you in a long emerald jacquard gown, her braids falling past her waist and a knowing little smile.",
    notes: ["An emerald floral jacquard maxi dress with a tie front", "Long braids past her waist", "A silver pendant necklace and a gold cuff", "Gold strappy heeled sandals"],
    color: "#2f6b5a",
    face: 0.08,
    sticker: "character_stephanie_sticker",
  },
  {
    id: "dream",
    name: "Dream",
    tag: "friend of the Palais",
    blurb: "Dream in full Hospitaller kit — a black surcoat with the white eight-pointed cross, a chainmail coif pushed back, caught mid-laugh with his fist up by his chin.",
    notes: ["A black sleeveless surcoat with a white Maltese cross", "A chainmail coif and hood", "A wide black sash with a beaded tie", "Grey leather boots"],
    color: "#1f2430",
    face: 0.07,
    sticker: "character_dream_sticker",
  },
  {
    id: "jonathan",
    name: "Jonathan",
    tag: "friend of the Palais",
    blurb: "Jonathan in Mughal-inspired couture, grinning with his hands clasped: a black velvet cape painted with court scenes and edged in gold, over a gold-embroidered sherwani.",
    notes: ["A black velvet cape painted with court scenes", "Gold-embroidered borders and a standing collar", "A black and gold brocade sherwani", "Velvet dhoti trousers and embroidered velvet loafers"],
    color: "#b8924a",
    face: 0.07,
    sticker: "character_jonathan_sticker",
  },
  {
    id: "bryan",
    name: "Bryan",
    tag: "friend of the Palais",
    blurb: "Bryan in a cream cricket jumper over a blue shirt and tie, hands at his sides, smiling straight at whoever's taking the picture.",
    notes: ["A cream cable jumper with navy and red tipping", "A pale blue shirt and a spotted navy tie", "Tan pleated trousers", "Black horsebit loafers"],
    color: "#c8b48a",
    face: 0.08,
    sticker: "character_bryan_sticker",
  },
  {
    id: "jessica",
    name: "Jessica",
    tag: "friend of the Palais",
    blurb: "Jessica in a deep red gown with the skirt gathered at her hip, a gold rayed halo crown behind her long waved hair, looking steadily out like a painting of a saint.",
    notes: ["A red velvet gown with a gathered, trained skirt", "A cream blouse with full sleeves and lace cuffs", "A gilt halo crown of rays and roses", "A gold rosary necklace"],
    color: "#b3132c",
    face: 0.13,
    sticker: "character_jessica_sticker",
  },
  {
    id: "peter",
    name: "Peter",
    tag: "friend of the Palais",
    blurb: "Peter in Neverland green with pointed ears and a red feather in his cap, hands in his pockets, half smiling like he's about to suggest something.",
    notes: ["A green tunic with a laced front and leafy hem", "A green cap with a red feather", "A brown belt with a little pouch", "Tall brown cuffed boots"],
    color: "#2f5d3a",
    face: 0.08,
    sticker: "character_peter_sticker",
  },
  {
    id: "jordan",
    name: "Jordan",
    tag: "friend of the Palais",
    blurb: "Jordan in a royal cobalt cape that falls in deep pleats to a ruffled hem, under a jeweled capelet of silver lace trimmed in ivory fur, with a small knowing smile.",
    notes: ["A cobalt blue pleated floor-length cape", "A silver lace capelet edged in ivory fur", "A high jeweled collar", "Crystal teardrop brooches at the throat"],
    color: "#1f47b8",
    face: 0.06,
    sticker: "character_jordan_sticker",
  },
  {
    id: "destiny",
    name: "Destiny",
    tag: "friend of the Palais",
    blurb: "Destiny in a blue ditsy floral maxi dress with a high slit, long hair down past her shoulders, looking away to one side.",
    notes: ["A blue floral maxi dress, smocked bodice and tie sleeves", "A high slit down one side", "A small black shoulder bag", "Cream strappy heeled sandals"],
    color: "#4a86ad",
    face: 0.09,
    sticker: "character_destiny_sticker",
  },
  {
    id: "jericha",
    name: "Jericha",
    tag: "friend of the Palais",
    blurb: "Jericha in a dusty rose lehenga worked all over in silver thread and sequins, the dupatta over one shoulder, smiling wide.",
    notes: ["A mauve embroidered lehenga with a scalloped blouse", "A sheer dupatta scattered with flowers", "Silver jhumkas, a choker and a maang tikka", "A stack of silver bangles"],
    color: "#b58a99",
    face: 0.09,
    sticker: "character_jericha_sticker",
  },
  {
    id: "jerusha",
    name: "Jerusha",
    tag: "friend of the Palais",
    blurb: "Jerusha in a raspberry silk lehenga embroidered with pale flowers, a blush dupatta draped over her shoulder, her long hair down and a quiet smile.",
    notes: ["A raspberry silk lehenga with white floral embroidery", "A blush net dupatta with a scalloped gold border", "Pearl and gold jhumkas and a choker", "Gold bangles on both wrists"],
    color: "#a3285a",
    face: 0.08,
    sticker: "character_jerusha_sticker",
  },
  {
    id: "alisha",
    name: "Alisha",
    tag: "friend of the Palais",
    blurb: "Alisha in a sage green daisy-print sundress with tie straps and a high slit, dark curls down one shoulder and a small gold bindi, smiling straight at you.",
    notes: ["A sage green daisy-print midi sundress", "Tie shoulder straps and a thigh-high slit", "A small gold bindi and a fine gold necklace", "Green strappy heeled sandals"],
    color: "#6f8f4a",
    face: 0.08,
    sticker: "character_alisha_sticker",
  },
  {
    id: "jeannette",
    name: "Jeannette",
    tag: "friend of the Palais",
    blurb: "Jeannette as an angel of gold lace: wings worked in lace flowers, a halo tied in a lace bow, and a midnight velvet gown of starbursts with sheer ruffles edged in gold.",
    notes: ["A navy velvet gown embroidered with gold starbursts", "Sheer navy ruffles trimmed in gold lace, with a high slit", "Gold lace wings and a lace halo tied in a bow", "Black pointed heels with bows"],
    color: "#c9a05a",
    face: 0.14,
    sticker: "character_jeannette_sticker",
  },
];

/**
 * Who stands where on the carousel.
 *
 * Molly is always in the middle when the catalogue opens, and the girls keep
 * their places either side of her — Jerusha, Destiny, Jericha, Brea, Jessica,
 * Ella on her left, then Sarah, Kayenat, Kate, Stephanie, Moselle, Madeleine,
 * Alisha on her right. Everyone else falls in behind them in the order they were written, so
 * adding people never shuffles this line.
 */
const MIDDLE = [
  "jerusha", "destiny", "jericha", "brea", "jessica", "ella",
  "molly",
  "sarah", "kayenat", "kate", "stephanie", "moselle", "madeleine", "alisha",
] as const;
const USUAL: Character[] = [
  ...MIDDLE.map((id) => CAST.find((c) => c.id === id)!),
  ...CAST.filter((c) => !MIDDLE.includes(c.id as (typeof MIDDLE)[number])),
];

/**
 * The line-up can be rearranged from the catalogue (press its "Characters"
 * plaque). A rearrangement is kept in this browser only, as a list of ids;
 * anyone added since it was saved joins at the end, and anyone since removed
 * is simply skipped. It never changes the usual order written above.
 */
const ORDER_KEY = "palais-character-order";

function savedLine(): Character[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "null");
    if (!Array.isArray(ids)) return USUAL;
    const kept = ids.map((id) => USUAL.find((c) => c.id === id)).filter((c): c is Character => !!c);
    return [...kept, ...USUAL.filter((c) => !kept.includes(c))];
  } catch {
    return USUAL;
  }
}

function saveLine(line: Character[] | null) {
  try {
    if (line) localStorage.setItem(ORDER_KEY, JSON.stringify(line.map((c) => c.id)));
    else localStorage.removeItem(ORDER_KEY);
  } catch {
    /* a private window: the order just won't outlast the page */
  }
}

/** the one the catalogue opens on */
const startOf = (line: Character[]) => Math.max(0, line.findIndex((c) => c.id === "molly"));

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
  const [line, setLine] = useState<Character[]>(savedLine);
  const [here, setHere] = useState(() => startOf(line));
  const [sorting, setSorting] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const count = useRef(line.length);
  count.current = line.length;
  const custom = line.some((c, i) => c.id !== USUAL[i].id);

  /** move someone to a new place in the line, keeping whoever is on stage on stage */
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= line.length) return;
    const onStage = line[here];
    const next = [...line];
    const [who] = next.splice(from, 1);
    next.splice(to, 0, who);
    setLine(next);
    setHere(next.indexOf(onStage));
    saveLine(next);
  };
  const reset = () => {
    const onStage = line[here];
    setLine(USUAL);
    setHere(USUAL.indexOf(onStage));
    saveLine(null);
  };
  const paper = useFloral("map");
  // the card wears the same turning floral as the catalogue's header
  const floral = useFloral("catalogue");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setHere(startOf(line)); // Molly is who you meet first
    setSorting(false);
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setHere((h) => (h + 1) % count.current);
      if (e.key === "ArrowLeft") setHere((h) => (h - 1 + count.current) % count.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // the line is read fresh on each open; reordering mid-visit keeps the current place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  /* who they stopped on. Only once they've stopped: sliding past four people
     on the way to the fifth isn't looking at four people. */
  useEffect(() => {
    if (!open) return;
    const who = line[here];
    const t = setTimeout(() => noteDoing("character", who.name), 2500);
    return () => clearTimeout(t);
  }, [open, here, line]);

  if (!open) return null;
  const who = line[here];

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
            {/* the plaque is also the way into rearranging the line-up */}
            <button
              type="button"
              className="cc-title-btn"
              onClick={() => setSorting((v) => !v)}
              aria-expanded={sorting}
              aria-controls="cc-sort"
              title="Rearrange the line-up"
            >
              <span aria-hidden>✿</span> Characters <span aria-hidden className="cc-title-caret">{sorting ? "▴" : "▾"}</span>
            </button>
          </h2>
          <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
        </div>
        <button ref={closeBtn} type="button" className="wm-close" onClick={onClose} aria-label="Close the characters">
          ×
        </button>

        {/* the line-up as a carousel: whoever is picked stands in the middle,
            the ones either side step back smaller, and the rest wait off stage */}
        <div className="wm-stage cc-stage">
          <div className="cc-carousel">
            {line.map((c, i) => {
              // measured round the ring, so there's always someone either side
              const n = line.length;
              let off = i - here;
              if (off > n / 2) off -= n;
              if (off < -n / 2) off += n;
              const away = Math.abs(off);
              if (away > 2) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cc-person${off === 0 ? " is-on" : ""}`}
                  style={{
                    ["--cc-glow" as string]: c.color,
                    left: `${50 + off * 24}%`,
                    transform: `translateX(-50%) scale(${[1, 0.7, 0.5][away]})`,
                    opacity: [1, 0.72, 0.38][away],
                    zIndex: 10 - away,
                  }}
                  onClick={() => setHere(i)}
                  aria-pressed={off === 0}
                  aria-label={c.name}
                  tabIndex={away > 1 ? -1 : 0}
                >
                  <img src={src(c)} alt="" decoding="async" />
                  <span className="cc-name">{c.name}</span>
                </button>
              );
            })}
          </div>
          <div className="cc-ground" aria-hidden />

          {sorting && (
            <div id="cc-sort" className="cc-sort" role="region" aria-label="Rearrange the characters">
              <p className="cc-sort-head">
                Drag to rearrange, or use ↑ ↓ · kept in this browser
              </p>
              <ol className="cc-sort-list">
                {line.map((c, i) => (
                  <li
                    key={c.id}
                    className={`cc-sort-row${i === here ? " is-on" : ""}${dragging === i ? " is-dragging" : ""}`}
                    draggable
                    onDragStart={(e) => {
                      setDragging(i);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragging !== null && dragging !== i) {
                        move(dragging, i);
                        setDragging(i);
                      }
                    }}
                    onDragEnd={() => setDragging(null)}
                  >
                    <span className="cc-sort-grip" aria-hidden>⋮⋮</span>
                    <span className="cc-sort-num">{i + 1}</span>
                    <img src={src(c)} alt="" style={{ objectPosition: `50% ${c.face * 100}%` }} />
                    <button type="button" className="cc-sort-name" onClick={() => setHere(i)}>
                      {c.name}
                    </button>
                    <span className="cc-sort-moves">
                      <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${c.name} earlier`}>
                        ↑
                      </button>
                      <button type="button" onClick={() => move(i, i + 1)} disabled={i === line.length - 1} aria-label={`Move ${c.name} later`}>
                        ↓
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="cc-sort-foot">
                <button type="button" className="wm-btn" onClick={reset} disabled={!custom}>
                  Usual order
                </button>
                <button type="button" className="wm-btn wm-btn--visit" onClick={() => setSorting(false)}>
                  Done ✿
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="cc-arrow cc-arrow--back"
            onClick={() => setHere((h) => (h - 1 + line.length) % line.length)}
            aria-label="The one before"
          >
            ‹
          </button>
          <button
            type="button"
            className="cc-arrow cc-arrow--next"
            onClick={() => setHere((h) => (h + 1) % line.length)}
            aria-label="The next one"
          >
            ›
          </button>
          <div className="cc-dots" role="tablist" aria-label="Characters">
            {line.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === here}
                aria-label={c.name}
                className={`cc-dot${i === here ? " is-on" : ""}`}
                onClick={() => setHere(i)}
              />
            ))}
          </div>
        </div>

        <div
          className="wm-card cc-card"
          aria-live="polite"
        >
          {floral.was && (
            <div aria-hidden className="palais-floral palais-floral--cover palais-floral--out" style={{ backgroundImage: `url("${floralSrc(floral.was)}")` }} />
          )}
          <div aria-hidden className="palais-floral palais-floral--cover" key={floral.now} style={{ backgroundImage: `url("${floralSrc(floral.now)}")` }} />
          <div className="wm-card-body">
            <figure className="wm-peek cc-peek">
              <img key={who.id} src={src(who)} alt={who.name} style={{ objectPosition: `50% ${who.face * 100}%` }} decoding="async" />
            </figure>
            <div className="wm-card-head">
              <h3>{who.name}</h3>
              <p className="wm-tag">
                {here + 1} of {line.length} · {who.tag}
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
              <button
                type="button"
                className="wm-btn"
                onClick={() => setHere((h) => (h - 1 + line.length) % line.length)}
              >
                ◀ Back
              </button>
              <button
                type="button"
                className="wm-btn wm-btn--next"
                onClick={() => setHere((h) => (h + 1) % line.length)}
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
