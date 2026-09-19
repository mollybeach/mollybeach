import { Room } from "./Room";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { Prop } from "./Prop";
import { propSpec } from "./props";
import { Pollen } from "./Pollen";
import { Plinth } from "./Plinth";
import { Footer } from "./Footer";
import { Pendant } from "./Pendant";
import { Conjure } from "./Conjure";
import { StickerToggle } from "./StickerToggle";
import { Flyers } from "./Flyers";
import { PortraitTerrace, usePortrait } from "./PortraitTerrace";
import { Weather } from "./Weather";
import { Draggable } from "./Draggable";
import { Scene } from "./FittedScene";
import { SummerYard } from "./SummerYard";
import { LOOSE } from "./decor";
import { ArrangedRoom } from "./arrangement";
import { ArrangedBox } from "./ArrangedBox";
import { SeasonRoom } from "./SeasonRoom";
import { GlobeEgg } from "./GlobeEgg";
import { LibraryImac } from "./LibraryImac";
import { LakehouseRadio } from "./LakehouseRadio";
import { Wardrobe } from "./Wardrobe";
import { PlaceNow, usePlaceState } from "./place";
import { countPage, recordPlace, recordVisit } from "./visits";
import { useEffect } from "react";
import "./palais.css";

/* Narrow screens keep the furniture and drop the small things — a 390px-wide
   room cannot hold forty objects without becoming a pile. */
const sm = "palais-sm";
const md = "palais-md";
const lg = "palais-lg";

/* ==========================================================================
   SCALE

   Everything is placed in metres, not in guessed percentages.

   In the photograph the tiled terrace meets the balustrade 27% up from the
   bottom of the frame, the terrace is about 15m across at that line and about
   9m across at the near edge. So a metre is worth roughly 6.7% of the viewport
   width at the back and 11% at the front.

   `at(d)` turns a depth — 0 at the far wall, 1 at the camera — into the two
   numbers a prop needs: where its feet go, and how wide a metre is there. Size
   and position then cannot disagree, which is what made the earlier version
   read as furniture floating at random.
   ========================================================================== */

const FLOOR_DEPTH = 27; // % of the frame the terrace floor occupies, measured up
const M_BACK = 6.7; // cqw per metre at the far wall
const M_FRONT = 11; // cqw per metre at the near edge of the floor

function at(d: number) {
  return {
    /** the prop's base, as a distance up from the bottom of the scene */
    ground: `${(FLOOR_DEPTH * (1 - d)).toFixed(2)}%`,
    /** one metre, in cqw, at this distance */
    m: M_BACK + (M_FRONT - M_BACK) * d,
  };
}

/** the width of something `metres` wide standing at depth `d` */
const w = (metres: number, d: number) => `${(metres * at(d).m).toFixed(2)}cqw`;

/**
 * Where the top of a piece of furniture is, so things can be set down on it.
 *
 * `aspect` is the sticker's height ÷ width, and `frac` is how far up its own
 * image the usable surface sits. Both are measured off the cutout once, and
 * then the offset tracks the furniture's size automatically.
 */
function surface(metres: number, d: number, aspect: number, frac: number) {
  return `calc(${at(d).ground} + ${(metres * at(d).m * aspect * frac).toFixed(2)}cqw)`;
}

/* --- the coiffeuse: the piece everything else is arranged around --------- */
const VANITY_D = 0.86;
const VANITY_M = 1.95;
const VANITY_TOP = surface(VANITY_M, VANITY_D, 1.251, 0.47);

/* --- the settee and the wingback ---------------------------------------- */
const SETTEE_D = 0.84;
const SETTEE_SEAT = surface(1.8, SETTEE_D, 0.79, 0.42);

/* --- the two other surfaces things are set down on --------------------- */
/* measured off the cutout: the dresser is 1.362 times as tall as it is wide,
   and seen straight on, so its top edge — at 98.5% of its height — is the
   surface. (An aspect of 1.249 here once sank everything into the carved
   panel at the front.) */
const DRESSER_TOP = surface(1.9, 0.6, 1.362, 0.985);
/* The jewellery cabinet stands at the dresser's depth, so their feet share a
   line on the floor. Its top is measured off the cutout: the image is 1.329
   times as tall as it is wide, and the top surface is at 93% of its height. */
const CABINET_D = 0.6;
const CABINET_TOP = surface(1, CABINET_D, 1.329, 0.93);

/* The bed is seen three-quarters on, so its quilt is higher at the head
   (left) than at the foot (right). Each spot on it is measured separately. */
const BED_D = 0.4;
const BED_M = 2.1;
const quilt = (frac: number) => surface(BED_M, BED_D, 1.25, frac);

export default function PalaisHome() {
  const portrait = usePortrait();
  // the buttons along the top wear whatever the sidebar is wearing
  const chips = useFloral("sidebar");
  // and they swap to the footer's pattern while you point at one
  const chipsHover = useFloral("footer");
  // which room you're in: the terrace or one of the rooms off it (place.ts)
  const places = usePlaceState();
  // count this visit, once per session (visits.ts)
  useEffect(() => {
    void recordVisit();
  }, []);
  // and each place on the map this visit walks into
  useEffect(() => {
    countPage();
    recordPlace(places.place);
  }, [places.place]);
  return (
    <PlaceNow.Provider value={places}>
    <>
      <div
        className="palais"
        style={{
          ["--palais-chip" as string]: `url("${floralSrc(chips.now)}")`,
          ["--palais-chip-hover" as string]: `url("${floralSrc(chipsHover.now)}")`,
          ["--palais-jewel" as string]: paletteOf(chips.now).jewel,
        }}
      >
        

        {/* ==============================================================
            THE TERRACE

            Three rules hold this layout together:

            1. Nothing is buried. A prop may overlap another, but must not be
               substantially covered by it. The only things allowed to stand
               behind furniture are the climbing ones — trellises, arches,
               bushes, wisteria — and the dresser, which stands behind the
               green wingback on purpose.
            2. Small things sit on furniture, not on the floor. A porcelain
               purse in the middle of a terrace is both odd and impossible to
               keep clear of everything else; on the dresser it is neither.
            3. The middle of the photograph is the mountain, so nothing tall
               stands between about 30% and 70% across.

            overlap.py checks the first rule for real, by measuring how much of
            each prop is covered by whatever paints over it.
            ============================================================== */}
        <section className="palais-stage" data-place={places.place}>
          <Room portrait={portrait} />
          <SeasonRoom place="kitchen" />
          <SeasonRoom place="bathroom" />
          <SeasonRoom place="garden" />
          <SeasonRoom place="closet" />
          <SeasonRoom place="lakehouse" />
          <SeasonRoom place="lagoon" />
          <SeasonRoom place="rainwood" />
          <SeasonRoom place="gorge" />
          <SeasonRoom place="domes" />
          <SeasonRoom place="jacaranda" />
          <SeasonRoom place="reef" />
          <SeasonRoom place="lanterns" />
          <SeasonRoom place="shore" />
          <SeasonRoom place="caves" />
          <SeasonRoom place="madeleine" />
          <SeasonRoom place="library" />
          <SeasonRoom place="sunliner" />
          {/* the clothes in the Wardrobe Wing */}
          <Wardrobe />
          {/* snow and falling leaves, with the seasons: behind the furniture, and past the camera */}
          <Weather layer="back" />
          <Pollen count={portrait ? 60 : 110} className="palais-pollen--front" />
          <StickerToggle seasons>
          {portrait ? <PortraitTerrace /> : <ArrangedRoom.Provider value={true}><Scene>
          <SummerYard />
          {/* ---- blossom, broken by the top corners --------------------- */}
          <Prop id="wisteria-branch-lavender" w="clamp(17rem,35cqw,33rem)" left="-7%" top="-11%" tilt={-3} motion="rustle" dur={17} z={90} plane="fore" />
          <Prop id="wisteria-branch-purple" w="clamp(12rem,26cqw,24rem)" right="-6%" top="-9%" tilt={5} motion="rustle" dur={21} z={90} plane="fore" flip className={sm} />
          <Prop id="wisteria-vine" w="clamp(8rem,17cqw,15rem)" left="26%" top="-13%" tilt={2} motion="rustle" dur={25} z={86} plane="fore" className={lg} />
          <Prop id="wisteria-garland" w="clamp(8rem,17cqw,15rem)" right="28%" top="-14%" tilt={-2} motion="rustle" dur={27} z={86} plane="fore" flip className={lg} />

          {/* ---- on the marble, up the far left and right --------------- */}
          <Prop id="panel-four-seasons" w={w(1, 0)} left="1.5%" top="17%" tilt={0} motion="swing" dur={19} arc={0.4} z={11} className={lg} />
          <Prop id="cherub-gilded" w={w(0.75, 0)} left="2%" top="27%" tilt={-2} motion="bob" dur={11} z={13} className={md} />
          <Prop id="relief-gold-frame" w={w(0.85, 0)} right="2%" top="26%" tilt={2} motion="swing" dur={20} arc={0.6} z={13} className={lg} />
          <Prop id="mirror-glass-floral" w={w(1.4, 0)} left="1%" top="34%" tilt={-1} motion="swing" dur={15} arc={0.9} z={12} className={sm} />
          <Prop id="mirror-glass-blue" w={w(1, 0)} left="71%" top="29%" tilt={1.5} motion="swing" dur={17} arc={0.8} z={12} className={md} />
          <Prop id="medallion-lady" w={w(0.5, 0)} left="9%" top="21%" tilt={-3} motion="bob" dur={12} z={13} className={lg} />
          <Prop id="cameo-jasperware" w={w(0.48, 0)} right="9%" top="20%" tilt={3} motion="bob" dur={13} z={13} className={lg} />
          <Prop id="plaque-lyre" w={w(0.48, 0)} left="9%" top="30%" tilt={-2} motion="bob" dur={14} z={13} className={lg} />
          <Prop id="plaque-ivory" w={w(0.46, 0)} right="9%" top="29%" tilt={2} motion="bob" dur={12} z={13} className={lg} />
          <Prop id="plaque-rose-wood" w={w(0.46, 0)} left="22%" top="20%" tilt={-3} motion="bob" dur={15} z={13} className={lg} />
          <Prop id="plaque-wood-dark" w={w(0.46, 0)} right="22%" top="19%" tilt={3} motion="bob" dur={13} z={13} className={lg} />

          {/* ---- hanging from the top of the page ----------------------
               Each fixture is fully in view and swings from the ceiling. They
               hang above the opening, and stop well short of the mountain. */}
          <Pendant id="pendant-opal" x="30%" w="clamp(5rem,9.5cqw,10rem)" tilt={0} arc={1.3} dur={13} />
          <Pendant id="pendant-cameo" x="45.5%" w="clamp(4.4rem,8.5cqw,9rem)" tilt={0} arc={1.6} dur={11} delay={-4} className={md} />
          <Pendant id="pendant-opal-antique" x="60%" w="clamp(5rem,9.5cqw,10rem)" tilt={0} arc={1.2} dur={14} delay={-2} />

          {/* ---- planting along the balustrade. These may overlap each
               other and stand behind things; that is what a border does. --- */}
          <Prop id="jacaranda" group="blossoms" w={w(3.4, 0.15)} right="-5%" ground={at(0.15).ground} tilt={1} motion="rustle" dur={21} z={14} plane="far" />
          <Prop id="hydrangea-bush" group="blossoms" w={w(2, 0.18)} left="-4%" ground={at(0.18).ground} tilt={-1.5} motion="rustle" dur={15} z={14} plane="far" />
          <Prop id="lilac-bush" group="blossoms" w={w(2.1, 0.22)} right="32%" ground={at(0.22).ground} tilt={-1} motion="rustle" dur={19} z={16} plane="far" className={sm} />
          <Prop id="rose-bush" group="blossoms" w={w(1.6, 0.26)} left="33%" ground={at(0.26).ground} tilt={1.5} motion="rustle" dur={17} z={16} plane="far" className={sm} />
          <Prop id="arch-roses" group="blossoms" w={w(2.3, 0.24)} right="12%" ground={at(0.24).ground} tilt={-1} motion="rustle" dur={23} z={18} plane="far" className={sm} />

          {/* ---- the two trellises: tall, and a long way apart ---------- */}
          <Prop set="trellisL" id="trellis-wisteria" group="trellises" w={w(2.8, 0.3)} left="9%" ground={at(0.3).ground} tilt={-1} motion="rustle" dur={19} z={20} plane="mid" className={sm} />
          <Prop set="trellisR" id="trellis-ivy" group="trellises" w={w(2.8, 0.34)} right="36%" ground={at(0.34).ground} tilt={1} motion="rustle" dur={23} z={20} plane="mid" className={sm} />

          {/* ---- mid floor --------------------------------------------- */}
          <Prop set="bed" id="bed-iron" w={w(BED_M, BED_D)} left="0%" ground={at(BED_D).ground} tilt={-0.5} motion="bob" dur={22} rise={2} z={24} plane="mid" className={md} />
          {/* tea, in bed */}
          <Prop set="bed" id="teacup-turquoise" w={w(0.28, BED_D)} left="4.6%" ground={quilt(0.56)} tilt={-3} motion="bob" dur={9} z={25} className={md} />
          <Prop set="bed" id="teacup-blush" w={w(0.28, BED_D)} left="7.4%" ground={quilt(0.53)} tilt={2} motion="bob" dur={10} z={25} className={md} />
          <Prop set="bed" id="teacup-rosebud" w={w(0.28, BED_D)} left="10.2%" ground={quilt(0.5)} tilt={-2} motion="bob" dur={8.5} z={25} className={md} />
          <Prop set="bed" id="teacup-rosebud-mini" w={w(0.27, BED_D)} left="13%" ground={quilt(0.47)} tilt={3} motion="bob" dur={9.5} z={25} className={md} />
          {/* the dresser is bigger and stands behind the wingback, which is
              the one pair meant to overlap */}
          <Prop set="dresser" id="dresser" w={w(1.9, 0.6)} left="31%" ground={at(0.6).ground} tilt={0.4} motion="bob" dur={20} rise={2} z={28} plane="mid" className={sm} />
          {/* Along the top, each thing in a spot of its own. */}
          {/* the tulip mirror, hung above the dresser, clear of everything on it */}
          <Prop id="mirror-glass-tulip" w={w(0.72, 0.6)} left="37.4%" ground={`calc(${DRESSER_TOP} + 8.5cqw)`} tilt={-1.5} motion="swing" dur={18} arc={0.7} z={29} className={md} />
          <Prop set="dresser" id="planter-greek-head" w={w(0.72, 0.6)} left="30.9%" ground={DRESSER_TOP} tilt={-1} motion="rustle" dur={13} z={30} className={md} />
          <Prop set="dresser" id="perfume-daisy" w={w(0.22, 0.6)} left="35.8%" ground={DRESSER_TOP} tilt={-3} motion="bob" dur={8} z={30} className={lg} />
          <Prop set="dresser" id="plate-blue-gold" w={w(0.26, 0.6)} left="38.2%" ground={DRESSER_TOP} tilt={0} motion="drift" dur={22} z={30} className={lg} />
          <Prop set="dresser" id="purse-porcelain" w={w(0.26, 0.6)} left="41%" ground={DRESSER_TOP} tilt={-4} motion="bob" dur={10} z={30} className={lg} />
          <Prop set="dresser" id="urn-glass" w={w(0.26, 0.6)} left="43.8%" ground={DRESSER_TOP} tilt={1} motion="bob" dur={14} z={30} className={lg} />
          <Prop set="dresser" id="teacup-sage" w={w(0.22, 0.6)} left="46.4%" ground={DRESSER_TOP} tilt={-4} motion="bob" dur={9} z={30} className={lg} />
          <Prop set="dresser" id="lamp-porcelain" w={w(0.44, 0.6)} left="35.6%" ground={DRESSER_TOP} tilt={1} motion="bob" dur={15} z={29} className={md} />
          <Prop set="dresser" id="perfume-cloud" w={w(0.22, 0.6)} left="37.1%" ground={DRESSER_TOP} tilt={3} motion="bob" dur={10} z={31} className={lg} />
          <Prop set="dresser" id="tissue-holder" w={w(0.24, 0.6)} left="39.6%" ground={DRESSER_TOP} tilt={-2} motion="bob" dur={11} z={31} className={lg} />
          <Prop set="dresser" id="mirror-hand" w={w(0.24, 0.6)} left="42.4%" ground={DRESSER_TOP} tilt={6} motion="bob" dur={9} z={31} className={lg} />
          <Prop set="dresser" id="flask-horseshoe" w={w(0.22, 0.6)} left="45.1%" ground={DRESSER_TOP} tilt={3} motion="bob" dur={12} z={31} className={lg} />
          <Prop set="dresser" id="teacup-multicolor" w={w(0.22, 0.6)} left="47.6%" ground={DRESSER_TOP} tilt={3} motion="bob" dur={10} z={31} className={lg} />
          {/* and everything small lives on top of it */}

          {/* ---- near floor -------------------------------------------- */}
          {/* the fig, tucked in behind the settee with its leaves showing over the back */}
          <Prop id="fiddle-leaf-fig" w={w(1.9, 0.5)} left="15.5%" ground={at(0.5).ground} tilt={1} motion="rustle" dur={16} z={26} className={sm} />
          <Prop id="candles-bottles" w={w(0.48, 0.74)} left="6.2%" ground={at(0.74).ground} tilt={1.5} motion="bob" dur={13} z={36} className={md} />
          <Prop set="settee" id="loveseat" w={w(1.8, 0.84)} left="13%" ground={at(0.84).ground} tilt={0.6} motion="bob" dur={21} rise={2} z={50} />
          <Prop set="settee" id="pillow-floral" w={w(0.46, 0.84)} left="16%" ground={SETTEE_SEAT} tilt={-6} motion="bob" dur={12} z={52} className={md} />
          <Prop set="settee" id="pillow-lace" w={w(0.46, 0.84)} left="23.5%" ground={SETTEE_SEAT} tilt={5} motion="bob" dur={13} z={52} className={md} />

          <Prop set="armchair" id="armchair-sage" w={w(1.15, 0.8)} left="34%" ground={at(0.8).ground} tilt={-1.2} motion="bob" dur={18} rise={2} z={54} className={sm} />
          <Prop set="armchair" id="pillow-bolster" w={w(0.44, 0.8)} left="36%" ground={surface(1.15, 0.8, 1.25, 0.36)} tilt={3} motion="bob" dur={14} z={56} className={lg} />

          {/* in front of the wingback and off to its side, standing on the
              tiles — not tucked in behind it */}
          <Prop set="cabinet" id="cabinet-jewelry" w={w(1, CABINET_D)} left="48.3%" ground={at(CABINET_D).ground} tilt={-0.8} motion="bob" dur={18} rise={2} z={31} />
          <Prop set="cabinet" id="book-tiffany" w={w(0.24, CABINET_D)} left="48.5%" ground={CABINET_TOP} tilt={6} motion="bob" dur={11} z={32} className={md} />
          <Prop set="cabinet" id="teacups-collection" w={w(0.4, CABINET_D)} left="51.1%" ground={CABINET_TOP} tilt={-1.5} motion="bob" dur={12} z={32} className={md} />
          <Prop set="cabinet" id="teacup-rose" w={w(0.26, CABINET_D)} left="55.0%" ground={CABINET_TOP} tilt={4} motion="bob" dur={8} z={32} className={md} />
          <Prop set="cabinet" id="tea-caddy" w={w(0.22, CABINET_D)} left="53.3%" ground={CABINET_TOP} tilt={-3} motion="bob" dur={10} z={33} className={md} />
          <Prop set="cabinet" id="teacup-blue-gilt" w={w(0.26, CABINET_D)} left="56.4%" ground={CABINET_TOP} tilt={-3} motion="bob" dur={9} z={33} className={md} />

          {/* ---- the coiffeuse, and everything set down on it ---------- */}
          {/* the dracaena: tall, in the right-hand corner, standing behind the
              coiffeuse so its leaves rise over the top of the mirror */}
          <Prop id="dracaena" w={w(2.6, 0.65)} right="8%" ground={at(0.65).ground} tilt={-1} motion="rustle" dur={14} z={34} className={md} />
          {/* The dog, catching the frisbee: an animated WebP cut out of a video.
              It carries its own motion, so it gets no bob, and `bottom` rather
              than `ground` — a contact shadow sized to the whole clip would sit
              still while she leaps; the drop shadow follows her outline instead. */}
          {/* Brea and Molly with their cats at the harvest table. Drawn a
              little larger than life (2.4m across), like the furniture, and
              stood just far enough back that the cats along the front don't
              hide their feet. */}
          <Prop id="fall-table-brea-molly" w={w(2.4, 0.6)} left="31%" ground={at(0.6).ground} motion="none" z={40} />
          <Prop id="dog-frisbee" w={w(1.9, 0.9)} left="56%" bottom={at(0.9).ground} motion="none" z={60} className={sm} />
          <Prop set="vanity" id="vanity" w={w(VANITY_M, VANITY_D)} right="12%" ground={at(VANITY_D).ground} tilt={-0.5} motion="bob" dur={19} rise={2} z={44} />
          <Prop set="vanity" id="candle-pillar" w={w(0.18, VANITY_D)} right="21.6%" ground={VANITY_TOP} tilt={1} motion="bob" dur={12} z={47} className={md} />
          <Prop set="vanity" id="perfume-flora" w={w(0.18, VANITY_D)} right="29%" ground={VANITY_TOP} tilt={2} motion="bob" dur={9} z={46} className={lg} />
          <Prop set="vanity" id="music-box-egg" w={w(0.19, VANITY_D)} right="30.4%" ground={VANITY_TOP} tilt={4} motion="bob" dur={10} z={47} className={lg} />
          <Prop set="vanity" id="candle-cherub" w={w(0.2, VANITY_D)} right="20.1%" ground={VANITY_TOP} tilt={2} motion="bob" dur={9} z={48} className={md} />
          <Prop set="vanity" id="candle-rose-portrait" w={w(0.2, VANITY_D)} right="27.6%" ground={VANITY_TOP} tilt={-2} motion="bob" dur={11} z={48} className={lg} />
          <Prop set="vanity" id="egg-cobalt" w={w(0.19, VANITY_D)} right="31.9%" ground={VANITY_TOP} tilt={-3} motion="bob" dur={11} z={48} className={lg} />
          <Prop set="vanity" id="mirror-tabletop" w={w(0.36, VANITY_D)} right="23.4%" ground={VANITY_TOP} tilt={1} motion="bob" dur={11} z={46} className={sm} />
          <Prop set="vanity" id="perfume-collection" w={w(0.5, VANITY_D)} right="18.2%" ground={VANITY_TOP} tilt={-1} motion="bob" dur={13} z={46} className={sm} />
          <Prop set="vanity" id="perfume-butterfly" w={w(0.2, VANITY_D)} right="16%" ground={VANITY_TOP} tilt={3} motion="bob" dur={9} z={47} className={md} />
          <Prop set="vanity" id="brushes" w={w(0.27, VANITY_D)} right="13.4%" ground={VANITY_TOP} tilt={-3} motion="bob" dur={10} z={47} className={md} />
          <Prop set="vanity" id="trinket-box" w={w(0.22, VANITY_D)} right="26.6%" ground={VANITY_TOP} tilt={-2} motion="bob" dur={11} z={46} className={lg} />

          {/* her chair, pulled up to the coiffeuse, in front of it */}
          <ArrangedBox
            id="chair-vanity"
            set="chair"
            className={md}
            style={{ position: "absolute", zIndex: 64, left: "95.5%", bottom: at(0.99).ground, width: w(0.6, 0.99) }}
          >
            <Conjure set="chair">
              <Plinth id="chair-vanity" w="100%" />
            </Conjure>
          </ArrangedBox>

          {/* bigger, at the near right corner */}
          <Prop id="monstera-crystal" w={w(1.8, 0.95)} right="-6%" ground={at(0.95).ground} tilt={1} motion="rustle" dur={16} z={66} />

          {/* ---- the cats. The front strip is theirs alone: nothing else
               stands here, so none of them is behind anything. ---------- */}
          <Prop id="cats-birthday" w={w(0.58, 0.99)} left="1.0%" ground={at(0.99).ground} tilt={1} motion="bob" dur={13} rise={3} z={74} />
          <Prop id="cat-blueberry-running" w={w(0.58, 0.99)} left="11.8%" ground={at(0.99).ground} tilt={2} motion="bob" dur={7} rise={6} z={74} />
          <Prop id="honeysuckle-tricycle" w={w(0.58, 0.99)} left="22.6%" ground={at(0.99).ground} tilt={-1} motion="bob" dur={12} rise={3} z={74} className={sm} />
          <Prop id="cats-toilet" w={w(0.58, 0.99)} left="33.4%" ground={at(0.99).ground} tilt={-1} motion="bob" dur={15} rise={2} z={74} className={md} />
          <Prop id="honeysuckle-clock" w={w(0.58, 0.99)} left="44.2%" ground={at(0.99).ground} tilt={1} motion="bob" dur={14} rise={3} z={74} className={md} />
          <Prop id="cat-strawberry-roses" w={w(0.58, 0.99)} left="55.0%" ground={at(0.99).ground} tilt={1} motion="bob" dur={14} rise={2} z={74} className={sm} />
          <Prop id="honeysuckle-sewing" w={w(0.58, 0.99)} left="65.8%" ground={at(0.99).ground} tilt={-1} motion="bob" dur={13} rise={3} z={74} className={md} />
          <Prop id="cats-roses" w={w(0.58, 0.99)} left="76.6%" ground={at(0.99).ground} tilt={-1} motion="bob" dur={14} rise={3} z={74} className={sm} />

          {/* a second rank, just behind and offset into the gaps */}
          <Prop id="cat-strawberry" w={w(0.5, 0.955)} left="6.4%" ground={at(0.955).ground} tilt={2} motion="bob" dur={12} rise={2} z={70} className={md} />
          <Prop id="honeysuckle-bow-alt" w={w(0.5, 0.955)} left="17.2%" ground={at(0.955).ground} tilt={-2} motion="bob" dur={13} rise={2} z={70} className={lg} />
          <Prop id="kitten-strawberry" w={w(0.5, 0.955)} left="28.0%" ground={at(0.955).ground} tilt={-1} motion="bob" dur={13} rise={2} z={70} className={lg} />
          <Prop id="cat-blueberry-sitting" w={w(0.5, 0.955)} left="38.8%" ground={at(0.955).ground} tilt={-1} motion="bob" dur={13} rise={2} z={70} className={md} />
          <Prop id="honeysuckle-bow" w={w(0.5, 0.955)} left="49.6%" ground={at(0.955).ground} tilt={1} motion="bob" dur={15} rise={2} z={70} className={lg} />
          <Prop id="cat-honeysuckle" w={w(0.5, 0.955)} left="71.2%" ground={at(0.955).ground} tilt={-2} motion="bob" dur={14} rise={2} z={70} className={lg} />
          <Prop id="kittens-christmas" w={w(0.58, 0.99)} left="87.4%" ground={at(0.99).ground} tilt={1} motion="bob" dur={14} rise={2} z={70} className={md} />
          <Prop id="cat-strawberry-window" w={w(0.5, 0.955)} left="82.0%" ground={at(0.955).ground} tilt={-1} motion="bob" dur={16} rise={2} z={72} className={lg} />

          {/* the room decor (decor.ts): lined up along the front of the terrace,
              out of the room until the catalogue puts a piece in */}
          {LOOSE.map((id, n) => (
            <Prop
              key={id}
              id={id}
              w={w(propSpec(id).metres ?? (/umbrella|postcards|moon-kiss|towels|mirror_wall|suncatcher/.test(id) ? 0.55 : 0.32), 0.93)}
              left={`${(3 + ((n * 31) % 90)).toFixed(1)}%`}
              ground={at(0.93 - (n % 3) * 0.03).ground}
              tilt={0}
              motion="bob"
              dur={10 + (n % 5)}
              rise={2}
              z={76 + (n % 3)}
            />
          ))}

          {/* these two live on things rather than on the tiles */}
          <Prop set="settee" id="cat-blueberry-party" w={w(0.5, 0.84)} left="20%" ground={`calc(${SETTEE_SEAT} + 0.6cqw)`} tilt={-2} motion="bob" dur={12} rise={3} z={53} className={sm} />
          <Prop id="cat-blueberry-monstera" w={w(0.72, 0.96)} right="2.5%" ground={`calc(${at(0.96).ground} + 1.4cqw)`} tilt={1} motion="bob" dur={15} rise={3} z={68} />
          </Scene></ArrangedRoom.Provider>}

          {/* the visitors: a hummingbird, a dragonfly, now and then */}
          <Flyers />
          </StickerToggle>
          <Weather layer="front" />
          <Draggable />
          {/* the globe in the library, for anyone who thinks to click it */}
          <GlobeEgg />
          {/* and the iMac on its desk, which opens when you click it */}
          <LibraryImac />
          {/* and a radio in the Lakehouse, playing Vulfpeck */}
          <LakehouseRadio />
          {/* the gilded band the footer wears, brought up onto the bottom of
              the room so it shows at the foot of the screen without scrolling;
              scroll on and it lands exactly on the top of the footer */}
          <div aria-hidden className="palais-stage-hem" />
        </section>

        <Footer />
      </div>
    </>
    </PlaceNow.Provider>
  );
}
