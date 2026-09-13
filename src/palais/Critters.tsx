/**
 * The two creatures that visit the terrace, drawn rather than photographed.
 *
 * Both are drawn facing right. What makes them read as real rather than as
 * cartoons is mostly the wings:
 *
 * - A hummingbird's wings beat far too fast to see. What the eye actually gets
 *   is a translucent fan where the wings have been, with a faint wing edge
 *   flickering through it — so that is what is drawn: a soft blurred fan, and
 *   a sharper wing strobing between the top and bottom of its stroke.
 * - A dragonfly's wings are glass: nearly clear, netted with fine veins, with
 *   a dark cell near each tip, and they shiver rather than visibly flap.
 *
 * Proportions follow the real animals — the bird's bill is as long as its
 * head and body are deep; the dragonfly's wings are as long as its abdomen.
 */

export function Hummingbird() {
  return (
    <svg viewBox="0 0 160 110" className="palais-critter-svg" aria-hidden>
      <defs>
        <linearGradient id="hbBack" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#9ccf6e" />
          <stop offset="30%" stopColor="#4c9a4e" />
          <stop offset="65%" stopColor="#2c6b3d" />
          <stop offset="100%" stopColor="#1c432b" />
        </linearGradient>
        <linearGradient id="hbFlank" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="rgba(236,238,226,0)" />
          <stop offset="45%" stopColor="rgba(222,226,210,0.85)" />
          <stop offset="100%" stopColor="#c7c9b6" />
        </linearGradient>
        <linearGradient id="hbThroat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7aa8" />
          <stop offset="40%" stopColor="#d8175a" />
          <stop offset="100%" stopColor="#6d0b2e" />
        </linearGradient>
        <linearGradient id="hbTail" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f5a3a" />
          <stop offset="60%" stopColor="#1a2a20" />
          <stop offset="100%" stopColor="#111713" />
        </linearGradient>
        <linearGradient id="hbWing" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(70,72,66,0.8)" />
          <stop offset="100%" stopColor="rgba(95,98,90,0.35)" />
        </linearGradient>
        <radialGradient id="hbFan" gradientUnits="userSpaceOnUse" cx="88" cy="50" r="62">
          <stop offset="0%" stopColor="rgba(120,128,118,0.34)" />
          <stop offset="55%" stopColor="rgba(150,158,148,0.2)" />
          <stop offset="100%" stopColor="rgba(170,176,166,0)" />
        </radialGradient>
        <filter id="hbSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* the blur of the wingbeat: the whole arc the wings sweep through */}
      <path d="M88,50 L84,-8 A58,58 0 0 0 36,84 Z" fill="url(#hbFan)" filter="url(#hbSoft)" />

      {/* tail, fanned and cocked down while it hovers */}
      <path
        d="M64,76 C56,84 46,92 36,98 Q38,103 43,101 Q44,106 49,105 Q51,109 56,106 C60,98 64,90 70,82 Z"
        fill="url(#hbTail)"
      />
      <path d="M36,98 Q38,103 43,101 M43,101 Q44,106 49,105" stroke="#f1efe6" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M66,80 L44,101 M67,82 L51,104" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />

      {/* body: green back, pale flanks */}
      <path d="M98,30 C86,34 72,48 62,66 C58,72 58,80 64,84 C80,82 96,70 106,54 C112,44 108,32 98,30 Z" fill="url(#hbBack)" />
      <path d="M104,52 C96,66 82,80 64,84 C62,80 64,76 70,74 C84,70 94,62 100,52 Z" fill="url(#hbFlank)" />
      {/* the metallic sheen on the back and the edge of the folded coverts */}
      <path d="M94,34 C84,40 74,50 68,60" stroke="#d6f59c" strokeWidth="2.4" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M90,46 C82,54 76,62 70,72" stroke="rgba(10,30,18,0.35)" strokeWidth="1" fill="none" />

      {/* head */}
      <ellipse cx="104" cy="39" rx="10" ry="9.4" fill="url(#hbBack)" />
      <ellipse cx="101" cy="34" rx="5" ry="2.4" fill="#cdef9a" opacity="0.28" />
      {/* the gorget, iridescent ruby, with its scaled edge */}
      <path d="M113,43 C112,52 104,60 92,62 C90,58 92,52 96,49 C102,49 108,47 113,43 Z" fill="url(#hbThroat)" />
      <path d="M96,57 q2,-1.5 4,0 q2,-1.5 4,0 q2,-1.5 3.5,-1" stroke="rgba(255,190,215,0.55)" strokeWidth="0.8" fill="none" />
      {/* the small white spot behind the eye, and the eye */}
      <ellipse cx="100.5" cy="39.8" rx="1.1" ry="0.7" fill="#f2f0e8" opacity="0.7" />
      <circle cx="106.4" cy="37.6" r="2.3" fill="#070707" />
      <circle cx="107.1" cy="36.9" r="0.65" fill="#ffffff" />
      {/* the bill: long, straight, needle-fine */}
      <path d="M112.5,37.2 L156,32.6 L156.2,33.4 L113.4,41.4 Z" fill="#1b1714" />

      {/* the wing itself, strobing through the top and bottom of its stroke */}
      <g className="palais-hb-wing">
        <path d="M88,50 C84,36 70,16 46,2 C44,1 43,3 45,5 C60,20 72,38 83,55 Z" fill="url(#hbWing)" />
        <path d="M87,50 C80,36 66,18 47,4" stroke="rgba(230,232,226,0.45)" strokeWidth="0.6" fill="none" />
      </g>
    </svg>
  );
}

export function Dragonfly() {
  const segments = Array.from({ length: 9 }, (_, i) => 86 - i * 8);
  const wings = (
    <>
      {/* hindwing: broad at the base */}
      <g>
        <path d="M97,66 C95,46 90,26 84,10 C82,5 76,6 76.5,12 C77,32 79,52 83,66 Z" fill="url(#dfGlass)" />
        <path d="M97,66 C95,46 90,26 84,10 C82,5 76,6 76.5,12 C77,32 79,52 83,66 Z" fill="url(#dfVeins)" />
        <path d="M97,66 C95,46 90,26 84,10 C82,5 76,6 76.5,12 C77,32 79,52 83,66" stroke="rgba(28,40,44,0.55)" strokeWidth="0.55" fill="none" />
        <path d="M96,64 C93,44 88,26 83,10 M90,65 C88,46 84,28 80,11" stroke="rgba(28,40,44,0.35)" strokeWidth="0.45" fill="none" />
        <path d="M84.2,14 L82.6,9.6 L80.6,10.2 L82,14.6 Z" fill="#2b2119" />
      </g>
      {/* forewing: narrower, reaching a little forward */}
      <g>
        <path d="M100,66 C102,46 106,26 111,10 C113,5 119,6 119,12 C117,32 112,52 108,66 Z" fill="url(#dfGlass)" />
        <path d="M100,66 C102,46 106,26 111,10 C113,5 119,6 119,12 C117,32 112,52 108,66 Z" fill="url(#dfVeins)" />
        <path d="M100,66 C102,46 106,26 111,10 C113,5 119,6 119,12 C117,32 112,52 108,66" stroke="rgba(28,40,44,0.55)" strokeWidth="0.55" fill="none" />
        <path d="M101,64 C103,44 107,26 112,10 M105,65 C107,46 110,28 115,11" stroke="rgba(28,40,44,0.35)" strokeWidth="0.45" fill="none" />
        <path d="M111,14.4 L112.6,9.8 L114.8,10.2 L113.2,14.8 Z" fill="#2b2119" />
      </g>
    </>
  );

  return (
    <svg viewBox="0 0 140 140" className="palais-critter-svg" aria-hidden>
      <defs>
        <linearGradient id="dfAbdomen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#082a38" />
          <stop offset="42%" stopColor="#2aa7c2" />
          <stop offset="58%" stopColor="#79dbe8" />
          <stop offset="100%" stopColor="#082a38" />
        </linearGradient>
        <linearGradient id="dfThorax" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f3529" />
          <stop offset="50%" stopColor="#56b98a" />
          <stop offset="100%" stopColor="#0f3529" />
        </linearGradient>
        <radialGradient id="dfEye" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#a9eef6" />
          <stop offset="45%" stopColor="#2a9fb6" />
          <stop offset="100%" stopColor="#06313f" />
        </radialGradient>
        {/* almost clear, with the faint oil-slick colour of real wing membrane */}
        <linearGradient id="dfGlass" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stopColor="rgba(190,170,120,0.28)" />
          <stop offset="30%" stopColor="rgba(225,240,245,0.14)" />
          <stop offset="70%" stopColor="rgba(215,205,240,0.16)" />
          <stop offset="100%" stopColor="rgba(235,245,250,0.1)" />
        </linearGradient>
        {/* the net of fine cross-veins */}
        <pattern id="dfVeins" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
          <path d="M0,0 L0,3.2 M0,1.6 L3.2,1.6" stroke="rgba(30,44,48,0.16)" strokeWidth="0.3" fill="none" />
        </pattern>
      </defs>

      {/* four glass wings, spread flat; the top pair mirrored to the bottom */}
      <g className="palais-df-wings">
        {wings}
        <g transform="translate(0 140) scale(1 -1)">{wings}</g>
      </g>

      {/* the long banded abdomen */}
      <path d="M94,66.6 L28,68.1 Q16,68.5 11,70 Q16,71.5 28,71.9 L94,73.4 Z" fill="url(#dfAbdomen)" />
      {segments.map((x) => (
        <line key={x} x1={x} y1="67.2" x2={x} y2="72.8" stroke="rgba(4,20,28,0.55)" strokeWidth="0.9" />
      ))}
      <path d="M13,69.4 L6,67.6 M13,70.6 L6,72.4" stroke="#082a38" strokeWidth="0.9" strokeLinecap="round" />

      {/* thorax, with its dark shoulder stripes */}
      <ellipse cx="101" cy="70" rx="9.5" ry="7" fill="url(#dfThorax)" />
      <path d="M97,63.6 Q99.5,70 97,76.4 M103,63.2 Q105.5,70 103,76.8" stroke="rgba(6,24,18,0.55)" strokeWidth="1" fill="none" />

      {/* head, and the two great compound eyes meeting on top */}
      <ellipse cx="112" cy="70" rx="4.5" ry="5.5" fill="#0f2a33" />
      <circle cx="114.4" cy="65.4" r="5" fill="url(#dfEye)" />
      <circle cx="114.4" cy="74.6" r="5" fill="url(#dfEye)" />
      <circle cx="113" cy="64" r="1" fill="#ffffff" opacity="0.75" />
      <circle cx="113" cy="73.2" r="1" fill="#ffffff" opacity="0.75" />
    </svg>
  );
}
