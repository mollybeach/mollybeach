import type { CSSProperties } from "react";

/**
 * A style object that may also carry CSS custom properties.
 *
 * The animations are driven by per-element variables (--tilt, --dur, --rise…),
 * which React's CSSProperties does not model, so every inline style that sets
 * one needs this widened type.
 */
export type Styled = CSSProperties & Record<string, string | number | undefined>;
