import type { Styled } from "./styled";
import { propSpec, propSrc, type Plane, type PropId } from "./props";
import type { SetName } from "./conjureSchedule";
import { RIGS } from "./rigs";
import { Conjure } from "./Conjure";

type Motion = "bob" | "swing" | "rustle" | "drift" | "turn" | "none";

export interface PropProps {
  id: PropId;
  /** width, any CSS length. Percentages are of the act. */
  w: string;
  left?: string;
  right?: string;
  /** `top`, or `ground` to stand it on the floor line */
  top?: string;
  bottom?: string;
  /**
   * Stand the prop on the floor: its *base* is placed at this distance from
   * the bottom of the act, and it gets a contact shadow. This is the thing
   * that stops furniture from looking like it is floating.
   */
  ground?: string;
  tilt?: number;
  motion?: Motion;
  dur?: number;
  delay?: number;
  z?: number;
  rise?: number;
  arc?: number;
  /** override the plane from the catalogue */
  plane?: Plane;
  /** fade in and out forever, on its own clock */
  ghost?: boolean;
  /** seconds for one appear/disappear cycle */
  ghostDur?: number;
  /**
   * Share a spot with another prop and take turns in it.
   *
   * Two props with the same `slot` and the same `ghostDur`, one with `phase`
   * 0 and one with `phase` 1, are offset by half a cycle — so as one fades out
   * the other fades in, and the spot is never empty or doubled. This is how a
   * full surface holds more than it has room for.
   */
  slot?: string;
  phase?: 0 | 1;
  /** the piece of furniture this belongs to; it vanishes and returns with it */
  set?: SetName;
  /** a named set of props that one of the room's switches can hide together */
  group?: "blossoms" | "trellises";
  opacity?: number;
  /** flip horizontally — useful for mirroring a branch into the other corner */
  flip?: boolean;
  className?: string;
}

const MOTION: Record<Motion, string> = {
  bob: "anim-bob",
  swing: "anim-swing",
  rustle: "anim-rustle",
  drift: "anim-drift",
  turn: "anim-turn",
  none: "",
};

/** how wide the contact shadow is relative to the prop, per plane */
const SHADOW: Record<Plane, { w: number; h: number; o: number }> = {
  haze: { w: 0.5, h: 0.02, o: 0.1 },
  far: { w: 0.62, h: 0.03, o: 0.22 },
  mid: { w: 0.74, h: 0.045, o: 0.34 },
  near: { w: 0.84, h: 0.06, o: 0.46 },
  fore: { w: 0.9, h: 0.07, o: 0.5 },
};

/**
 * One object standing in the room.
 *
 * Three nested elements, each with one job: the outer one is placed and holds
 * the fade cycle, the middle one carries the drift animation, the inner one
 * carries the plane's filter stack. Keeping them apart means a `transform`
 * animation never has to share an element with a `filter`, which is what
 * causes the shadows to jitter as things move.
 */
export function Prop({
  id,
  w,
  left,
  right,
  top,
  bottom,
  ground,
  tilt = 0,
  motion = "bob",
  dur = 8,
  delay = 0,
  z = 20,
  rise = 8,
  arc = 2,
  plane,
  ghost = false,
  ghostDur = 26,
  slot,
  phase = 0,
  group,
  set,
  opacity,
  flip = false,
  className = "",
}: PropProps) {
  const spec = propSpec(id);
  const p: Plane = plane ?? spec.plane ?? "mid";
  const sh = SHADOW[p];
  /* stickers with moving parts (rigs.tsx) */
  const rig = RIGS[id];

  const outer: Styled = {
    position: "absolute",
    width: w,
    left,
    right,
    top,
    bottom: ground ?? bottom,
    zIndex: z,
    opacity,
  };
  const sharing = slot !== undefined;
  if (ghost || sharing) {
    const offset = delay - (sharing ? phase * (ghostDur / 2) : 0);
    outer.animation = `palais-ghost ${ghostDur}s ease-in-out ${offset}s infinite`;
    outer["--peak"] = opacity ?? 1;
    outer["--tilt"] = `${tilt}deg`;
  }

  const mover: Styled = {
    "--tilt": `${tilt}deg`,
    "--dur": `${dur}s`,
    "--rise": `${rise}px`,
    "--arc": `${arc}deg`,
    "--twist": `${tilt >= 0 ? -1 : 1}deg`,
    animationDelay: ghost || sharing ? undefined : `${delay}s`,
    transform: motion === "none" && !ghost && !sharing ? `rotate(${tilt}deg)` : undefined,
  };

  const filterClass =
    "prop " +
    (spec.lit ? "prop--lit" : spec.glass ? "prop--glass" : `prop--${p}`);

  return (
    <div style={outer} data-slot={slot} data-group={group} className={className || undefined}>
      <Conjure set={set}>
        <div
          className={`${ghost || sharing ? "" : MOTION[motion]} ${motion === "swing" ? "pivot-top" : ""}`}
          style={mover}
        >
          {/* the shadow it casts where it meets the floor */}
          {ground !== undefined && (
            <span
              className="contact-shadow"
              style={{
                width: `${sh.w * 100}%`,
                paddingBottom: `${sh.h * 100}%`,
                bottom: `-${sh.h * 40}%`,
                opacity: sh.o,
              }}
            />
          )}

          <div className={filterClass} style={{ transform: flip ? "scaleX(-1)" : undefined }}>
            {rig ? (
              <div className="prop-rig">
                {rig.under}
                <img src={propSrc(id)} alt={spec.label} loading="lazy" decoding="async" />
                {rig.over}
              </div>
            ) : (
              <img src={propSrc(id)} alt={spec.label} loading="lazy" decoding="async" />
            )}
          </div>
        </div>
      </Conjure>
    </div>
  );
}
