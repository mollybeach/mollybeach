import { useEffect, useState } from "react";
import { Prop } from "./Prop";
import { Pendant } from "./Pendant";

/**
 * The terrace on a phone: its own photograph, and its own arrangement.
 *
 * The landscape room can't simply be squeezed. Cropped to a phone it loses
 * both walls and all of the floor, and the furniture shrinks to nothing. So a
 * tall screen gets the portrait photograph of the same terrace and fewer,
 * larger things, set out in depth rather than side by side.
 */

/** tall enough that the portrait photograph is the better fit */
const PORTRAIT = "(max-aspect-ratio: 4/5)";

export function usePortrait() {
  const [portrait, setPortrait] = useState(() => window.matchMedia(PORTRAIT).matches);
  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT);
    const on = () => setPortrait(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return portrait;
}

/* ==========================================================================
   SCALE

   Everything here is placed inside `.palais-frame`, a box exactly the shape of
   the photograph and cropped the way the photograph is, so a percentage means
   the same spot in the picture on every phone. `cqw` is a percentage of the
   photograph's width.

   Measured off the photograph (941 × 1672): the far tree line and the
   mountain's foot sit at a horizon 50% of the way down, and the bar stools —
   about 0.72m tall — stand 160px high where their feet are, 71% of the way
   down. That puts the camera 1.6m above the tiles, and from there the size of
   a metre at any spot on the floor follows from how far below the horizon it
   is.

   The middle of the photograph is the arch onto the pool, from about 30% to
   74% across and down to 67% (where the tiles begin), so nothing tall stands
   in front of it: the furniture keeps to the bar on the left and the
   bathroom door on the right.

   A phone is narrower than the photograph, so about 9% is cropped off each
   side: nothing that matters is placed outside 10–90% across.
   ========================================================================== */

const HORIZON = 0.5;
const EYE = 1.6; // metres
const TALL = 1672 / 941;

/** `y` is how far down the photograph the prop's feet are, 0–1 */
function at(y: number) {
  return {
    ground: `${((1 - y) * 100).toFixed(2)}%`,
    /** one metre, in cqw, at this spot on the floor */
    m: ((y - HORIZON) * TALL * 100) / EYE,
  };
}

const w = (metres: number, y: number) => `${(metres * at(y).m).toFixed(2)}cqw`;

/** the top of a piece of furniture: `aspect` is the sticker's height ÷ width,
    `frac` how far up the image its surface is */
function surface(metres: number, y: number, aspect: number, frac: number) {
  return `calc(${at(y).ground} + ${(metres * at(y).m * aspect * frac).toFixed(2)}cqw)`;
}

/* the rows, from the arch forward */
const CABINET_Y = 0.715;
const BED_Y = 0.79;
const DRESSER_Y = 0.82;
const DOG_Y = 0.77;
const VANITY_Y = 0.885;
const ARMCHAIR_Y = 0.875;
const CATS_Y = 0.965;

const BED_M = 1.35;
const CABINET_M = 0.7;
const DRESSER_M = 0.9;
const VANITY_M = 0.75;
const ARMCHAIR_M = 0.72;

const DRESSER_TOP = surface(DRESSER_M, DRESSER_Y, 1.362, 0.985);
const VANITY_TOP = surface(VANITY_M, VANITY_Y, 1.251, 0.47);
const CABINET_TOP = surface(CABINET_M, CABINET_Y, 1.329, 0.93);
const ARMCHAIR_SEAT = surface(ARMCHAIR_M, ARMCHAIR_Y, 1.28, 0.36);

export function PortraitTerrace() {
  return (
    <div className="palais-frame">
      {/* ---- wisteria in the top corners, over the fresco ---------------- */}
      <Prop id="wisteria-branch-lavender" w="72cqw" left="-14%" top="-5%" tilt={-3} motion="rustle" dur={17} z={90} plane="fore" />
      <Prop id="wisteria-branch-purple" w="46cqw" right="-10%" top="-4%" tilt={5} motion="rustle" dur={21} z={90} plane="fore" flip />

      {/* one fixture, hung clear of the photograph's own glass pendants */}
      <Pendant id="pendant-opal" x="55%" w="16cqw" tilt={0} arc={1.3} dur={13} />

      {/* ---- out on the lawn, either side of the pool ----------------------- */}
      <Prop id="rose-bush" group="blossoms" w={w(1, 0.668)} left="32%" ground={at(0.668).ground} tilt={1.5} motion="rustle" dur={17} z={14} plane="far" />
      <Prop id="lilac-bush" group="blossoms" w={w(1.1, 0.668)} right="27%" ground={at(0.668).ground} tilt={-1} motion="rustle" dur={19} z={14} plane="far" />

      {/* ---- the dogs in the pool (spring and summer, set by the season
           layouts) and the goats on the lawn in front of it (not in winter).
           These places fit the spring photograph; summer's and autumn's are
           framed a little differently, so palais.css moves them there. ------- */}
      <Prop id="dog-maggie-frisbee" w="9cqw" left="40%" bottom={at(0.638).ground} motion="none" z={12} />
      <Prop id="dog-charlie-kiddie-pool" w="14cqw" left="53%" bottom={at(0.641).ground} motion="none" z={12} />
      <Prop id="goat-bambi" w="8.5cqw" left="30%" ground={at(0.668).ground} motion="none" z={16} />
      <Prop id="goats-pumpkin-ferdinand" w="5.6cqw" left="58%" ground={at(0.66).ground} motion="none" z={16} />

      {/* ---- the trellises, flanking the arch onto the pool ------------------ */}
      <Prop set="trellisL" id="trellis-wisteria" group="trellises" w={w(1.1, 0.68)} left="22%" ground={at(0.68).ground} tilt={-1} motion="rustle" dur={19} z={18} plane="mid" />
      <Prop set="trellisR" id="trellis-ivy" group="trellises" w={w(1.1, 0.682)} right="22%" ground={at(0.682).ground} tilt={1} motion="rustle" dur={23} z={18} plane="mid" />

      {/* ---- the jewellery cabinet, in the bathroom doorway ----------------- */}
      <Prop set="cabinet" id="cabinet-jewelry" w={w(CABINET_M, CABINET_Y)} right="11%" ground={at(CABINET_Y).ground} tilt={-0.8} motion="bob" dur={18} rise={2} z={24} plane="mid" />
      <Prop set="cabinet" id="teacups-collection" w={w(0.26, CABINET_Y)} right="15%" ground={CABINET_TOP} tilt={-1.5} motion="bob" dur={12} z={25} />

      {/* ---- the bed, in front of the bar stools ---------------------------- */}
      <Prop set="bed" id="bed-iron" w={w(BED_M, BED_Y)} left="2%" ground={at(BED_Y).ground} tilt={-0.5} motion="bob" dur={22} rise={2} z={30} plane="mid" />

      {/* ---- the dresser, against the bathroom wall ------------------------- */}
      <Prop set="dresser" id="dresser" w={w(DRESSER_M, DRESSER_Y)} right="3%" ground={at(DRESSER_Y).ground} tilt={0.4} motion="bob" dur={20} rise={2} z={32} plane="mid" />
      <Prop set="dresser" id="planter-greek-head" w={w(0.36, DRESSER_Y)} right="14%" ground={DRESSER_TOP} tilt={-1} motion="rustle" dur={13} z={34} />
      <Prop set="dresser" id="lamp-porcelain" w={w(0.24, DRESSER_Y)} right="25%" ground={DRESSER_TOP} tilt={1} motion="bob" dur={15} z={34} />

      {/* ---- Brea and Molly at the harvest table, where the
           dresser and wingback stand in spring ------------------------------ */}
      <Prop id="fall-table-brea-molly" w={w(1.2, 0.82)} right="4%" ground={at(0.82).ground} motion="none" z={38} />

      {/* ---- the dog, in the open middle of the tiles, clear of the pool ----- */}
      <Prop id="dog-frisbee" w={w(0.8, DOG_Y)} left="40%" bottom={at(DOG_Y).ground} motion="none" z={40} />

      {/* ---- the coiffeuse, in front of the bed ----------------------------- */}
      <Prop set="vanity" id="vanity" w={w(VANITY_M, VANITY_Y)} left="6%" ground={at(VANITY_Y).ground} tilt={-0.5} motion="bob" dur={19} rise={2} z={50} />
      <Prop set="vanity" id="perfume-collection" w={w(0.26, VANITY_Y)} left="14%" ground={VANITY_TOP} tilt={-1} motion="bob" dur={13} z={52} />

      {/* ---- the wingback, out on the open tiles, clear of the dresser ------ */}
      <Prop set="armchair" id="armchair-sage" w={w(ARMCHAIR_M, ARMCHAIR_Y)} right="34%" ground={at(ARMCHAIR_Y).ground} tilt={-1.2} motion="bob" dur={18} rise={2} z={54} />
      <Prop set="armchair" id="cat-blueberry-party" w={w(0.24, ARMCHAIR_Y)} right="45%" ground={ARMCHAIR_SEAT} tilt={-2} motion="bob" dur={12} rise={3} z={56} />

      {/* ---- the cats, along the front edge -------------------------------- */}
      <Prop id="cats-birthday" w={w(0.3, CATS_Y)} left="10%" ground={at(CATS_Y).ground} tilt={1} motion="bob" dur={13} rise={3} z={74} />
      <Prop id="cat-blueberry-running" w={w(0.3, CATS_Y)} left="40%" ground={at(CATS_Y).ground} tilt={2} motion="bob" dur={7} rise={6} z={74} />
      <Prop id="honeysuckle-tricycle" w={w(0.28, CATS_Y)} right="10%" ground={at(CATS_Y).ground} tilt={-1} motion="bob" dur={12} rise={3} z={74} />
      <Prop id="cats-roses" w={w(0.28, CATS_Y)} left="62%" ground={at(CATS_Y).ground} tilt={-1} motion="bob" dur={14} rise={3} z={74} />
    </div>
  );
}
