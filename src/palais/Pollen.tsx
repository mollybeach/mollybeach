import type { Styled } from "./styled";

/** deterministic PRNG so the server and client agree on where the dust is */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * What is actually in the air: wisteria pollen and gold dust, rising through
 * the light from the arches. Two populations — motes that drift upward and
 * larger flecks that only twinkle, as if catching the sun and losing it.
 */
export function Pollen({
  count = 120,
  seed = 20260913,
  className = "",
}: {
  count?: number;
  seed?: number;
  className?: string;
}) {
  const rand = seeded(seed);

  const bits = Array.from({ length: count }, (_, i) => {
    const rising = i % 5 !== 0;
    const lilac = rand() > 0.62;
    return {
      key: i,
      rising,
      lilac,
      size: rising ? 1.4 + rand() * 2.4 : 2.6 + rand() * 3.6,
      left: rand() * 100,
      top: rand() * 100,
      dur: rising ? 16 + rand() * 24 : 3.4 + rand() * 5,
      delay: -rand() * 34,
      dx: (rand() - 0.5) * 60,
      peak: rising ? 0.3 + rand() * 0.5 : 0.45 + rand() * 0.5,
    };
  });

  return (
    <div
      aria-hidden
      className={`palais-pollen ${className}`}
    >
      {bits.map((b) => {
        const style: Styled = {
          position: "absolute",
          left: `${b.left}%`,
          top: `${b.top}%`,
          width: `${b.size}px`,
          height: `${b.size}px`,
          borderRadius: "50%",
          background: b.lilac
            ? "radial-gradient(circle, #f2ecff 0%, #c6bade 45%, rgba(154,138,196,0) 74%)"
            : "radial-gradient(circle, #fffaea 0%, #e8ce86 44%, rgba(201,164,76,0) 74%)",
          boxShadow:
            b.size > 3 ? "0 0 7px rgba(255,246,214,0.85)" : undefined,
          animation: `${b.rising ? "palais-pollen" : "palais-twinkle"} ${b.dur}s ${
            b.rising ? "linear" : "ease-in-out"
          } ${b.delay}s infinite`,
          "--dx": `${b.dx}px`,
          "--peak": b.peak,
        };
        return <span key={b.key} style={style} />;
      })}
    </div>
  );
}
