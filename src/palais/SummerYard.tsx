import { Prop } from "./Prop";

/**
 * The summer garden's animals: the goats grazing on the lawn and the dogs in
 * the pool, where the painted ones were before the summer photograph was
 * redone without them.
 *
 * They're placed on the photograph itself rather than on the stage: the frame
 * below is the exact box the photograph covers (the same crop and zoom as in
 * Room), so a percentage is a spot in the picture — the lawn stays the lawn at
 * any window size. Measured on the 1672 × 941 photograph.
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

export function SummerYard() {
  return (
    <div className="palais-photo-frame" style={{ zIndex: 20 }}>
      {/* grazing on the lawn, left of the pool */}
      <Prop id="goat-bambi" only="summer" {...at(535, 145, 745)} motion="none" />
      <Prop id="goats-pumpkin-ferdinand" only="summer" {...at(700, 86, 748)} motion="none" />
      {/* in the pool */}
      <Prop id="dog-maggie-frisbee" only="summer" {...afloat(830, 90, 696)} motion="bob" dur={6} rise={2} />
      <Prop id="dog-charlie-kiddie-pool" only="summer" {...afloat(975, 150, 708)} motion="bob" dur={8} rise={1} />
    </div>
  );
}
