// Single-brand registry for dragonbot-frontend.
//
// This repo only builds the DragonBot app (deployed at
// app.getdragonbot.com). Sibling repo dragonrefunds-frontend builds
// the DragonRefunds app the same way with its own brand file.
//
// Kept as a module (rather than inlining into main.tsx) so the
// eventual shared components package can consume a BrandConfig via
// prop / provider and stay brand-agnostic.

import { DRAGONBOT } from "./dragonbot";

export type { BrandConfig } from "./types";
export { DRAGONBOT };

/** The one brand this repo builds. Consumers should call this
 *  instead of importing DRAGONBOT directly — makes it a one-line
 *  swap if we ever fork this repo again. */
export function activeBrand() {
  return DRAGONBOT;
}
