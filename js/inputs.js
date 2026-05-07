import { clamp } from "./color-math.js";

export function parseRgbString(str) {
  str = str.trim().replace(/^rgba?\(/i, "").replace(/\)$/, "").replace("/", ",");
  const parts = str.split(/[,\s]+/).filter(Boolean).slice(0, 3);
  if (parts.length !== 3) return null;
  const [r, g, b] = parts.map(Number);
  if ([r, g, b].some((v) => !Number.isFinite(v))) return null;
  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
  };
}

export function parseHslString(str) {
  str = str.trim().replace(/^hsla?\(/i, "").replace(/\)$/, "").replace("/", ",");
  const parts = str.split(/[,\s]+/).filter(Boolean).slice(0, 3);
  if (parts.length !== 3) return null;
  const h = Number(parts[0].replace(/deg|°/i, ""));
  const s = Number(parts[1].replace("%", ""));
  const l = Number(parts[2].replace("%", ""));
  if (![h, s, l].every(Number.isFinite)) return null;
  return {
    h: (((Math.round(h) % 360) + 360) % 360),
    s: clamp(Math.round(s), 0, 100),
    l: clamp(Math.round(l), 0, 100),
  };
}
