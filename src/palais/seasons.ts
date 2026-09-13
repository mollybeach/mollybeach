/**
 * Moving the year along by hand.
 *
 * The seasons are CSS animations (palais-season-* in palais.css), so skipping
 * ahead is done on those animations directly: jump the shared timeline to the
 * moment the next season starts fading in, and play that fade five times
 * faster. Afterwards the timeline carries on at its normal pace from there.
 *
 * These numbers must match the keyframes: a 160s cycle in which summer,
 * autumn and winter start fading in at 40s, 80s and 120s, and winter starts
 * fading back to spring at 155s.
 */

export const SEASON_NAMES = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASON_NAMES)[number];

const CYCLE = 160_000;
const FADE = 5_000;
/** when each season begins to arrive, in ms into the cycle */
const ARRIVES: Record<Season, number> = { summer: 40_000, autumn: 80_000, winter: 120_000, spring: 155_000 };
const FAST = 5;

function seasonAnimations(scope: ParentNode) {
  return Array.from(scope.querySelectorAll<HTMLElement>(".palais-season"))
    .flatMap((el) => el.getAnimations())
    .filter((a): a is CSSAnimation => "animationName" in a && String((a as CSSAnimation).animationName).startsWith("palais-season"));
}

const position = (a: Animation) => (Number(a.currentTime ?? 0) % CYCLE + CYCLE) % CYCLE;

/** the season showing (or arriving) at this point in the cycle */
export function currentSeason(scope: ParentNode): Season {
  const [a] = seasonAnimations(scope);
  if (!a) return "spring";
  const t = position(a);
  if (t >= ARRIVES.spring) return "spring";
  if (t >= ARRIVES.winter) return "winter";
  if (t >= ARRIVES.autumn) return "autumn";
  if (t >= ARRIVES.summer) return "summer";
  return "spring";
}

export function upcomingSeason(scope: ParentNode): Season {
  return SEASON_NAMES[(SEASON_NAMES.indexOf(currentSeason(scope)) + 1) % SEASON_NAMES.length];
}

let settle: ReturnType<typeof setTimeout> | undefined;

/** fade quickly into the next season, then let the year run on from there */
export function skipSeason(scope: ParentNode) {
  const anims = seasonAnimations(scope);
  if (!anims.length) return;

  const next = upcomingSeason(scope);
  const start = anims[0].currentTime === null ? 0 : Number(anims[0].currentTime);
  const cycles = Math.floor(start / CYCLE);
  let target = cycles * CYCLE + ARRIVES[next];
  if (target <= start) target += CYCLE;

  for (const a of anims) {
    a.currentTime = target;
    a.playbackRate = FAST;
  }
  clearTimeout(settle);
  settle = setTimeout(() => {
    for (const a of seasonAnimations(scope)) a.playbackRate = 1;
  }, FADE / FAST);
}
