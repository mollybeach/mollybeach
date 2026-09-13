import { Prop } from "./Prop";

/**
 * The garden's animals: the goats grazing on the lawn in front of the pool,
 * all year, and the dogs in the pool — except in winter, when it's frozen.
 *
 * They're placed on the photograph itself rather than on the stage: the frame
 * below is the exact box the photograph covers (the same crop and zoom as in
 * Room), so a percentage is a spot in the picture — the lawn stays the lawn at
 * any window size. Measured on the 1672 × 941 photographs, which are all
 * aligned to spring's.
 */

const PHOTO_W = 1672;
const PHOTO_H = 941;

/** left edge and width across, feet down, in photograph pixels */
const at = (x: number, width: number, feet: number) => ({
  left: `${((x / PHOTO_W) * 100).toFixed(2)}%`,
  w: `${((width / PHOTO_W) * 100).toFixed(2)}%`,
  ground: `${(((PHOTO_H - feet) / PHOTO_H) * 100).toFixed(2)}%`,
});

/** the same, for things afloat: no shadow on the water */
const afloat = (x: number, width: number, waterline: number) => {
  const { ground, ...rest } = at(x, width, waterline);
  return { ...rest, bottom: ground };
};

const OUT_OF_WINTER = "spring summer autumn";

export function SummerYard() {
  return (
    <div className="palais-photo-frame" style={{ zIndex: 20 }}>
      {/* grazing on the lawn in front of the pool */}
      <Prop id="goat-bambi" {...at(545, 150, 836)} motion="none" />
      <Prop id="goats-pumpkin-ferdinand" {...at(708, 90, 840)} motion="none" />
      {/* in the pool */}
      <Prop id="dog-maggie-frisbee" only={OUT_OF_WINTER} {...afloat(830, 95, 786)} motion="bob" dur={6} rise={2} />
      <Prop id="dog-charlie-kiddie-pool" only={OUT_OF_WINTER} {...afloat(975, 155, 792)} motion="bob" dur={8} rise={1} />
    </div>
  );
}
