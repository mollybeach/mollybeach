/**
 * Moving the year along by hand.
 *
 * The seasons are CSS animations (palais-season-* in palais.css), so skipping
 * ahead is done on those animations directly: jump the shared timeline to the
 * moment the next season starts fading in, and play that fade five times
 * faster. Afterwards the timeline carries on at its normal pace from there.
 *
 * These numbers must match the keyframes: an 80s cycle in which summer,
 * autumn and winter start fading in at 20s, 40s and 60s, and winter starts
 * fading back to spring at 77.5s.
 */

export const SEASON_NAMES = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASON_NAMES)[number];

const CYCLE = 80_000;
const FADE = 2_500;
/** when each season begins to arrive, in ms into the cycle */
const ARRIVES: Record<Season, number> = { summer: 20_000, autumn: 40_000, winter: 60_000, spring: 77_500 };
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
let skipping = false;

/**
 * Stop the year where it is, or let it carry on. A skip in progress is left
 * to finish its fade (it pauses itself at the end if the year is paused).
 */
export function holdSeasons(scope: ParentNode, paused: boolean) {
  if (skipping) return;
  for (const a of seasonAnimations(scope)) {
    if (paused && a.playState === "running") a.pause();
    if (!paused && a.playState === "paused") a.play();
  }
}

/** fade quickly into the next season, then let the year run on from there —
    or, if the year is paused, stay in the new season */
export function skipSeason(scope: ParentNode, paused = false) {
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
    a.play();
  }
  skipping = true;
  clearTimeout(settle);
  settle = setTimeout(() => {
    skipping = false;
    for (const a of seasonAnimations(scope)) {
      a.playbackRate = 1;
      if (paused) {
        // land exactly at the end of the fade, so nothing is left half-blended
        a.currentTime = target + FADE;
        a.pause();
      }
    }
  }, FADE / FAST + 30);
}
