// Single-brand registry for dragonbot-frontend.
//
// This repo only builds the DragonBot app (deployed at
// app.getdragonbot.com). Sibling repo dragonrefunds-frontend builds
// the DragonRefunds app the same way with its own brand file.
//
// The BrandConfig type is owned by @ballisticbrands/frontend-shared —
// consumers import it from there, and pass their brand into the
// shared BrandProvider + configureShared({ brand }).

import { DRAGONBOT } from "./dragonbot";

export type { BrandConfig } from "@ballisticbrands/frontend-shared";
export { DRAGONBOT };
export { META_PIXEL_ID } from "./dragonbot";

/** The one brand this repo builds. */
export function activeBrand() {
  return DRAGONBOT;
}
