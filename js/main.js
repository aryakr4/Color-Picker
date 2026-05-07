import {
  hsvToRgb,
  rgbToHsv,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  rgbToCmyk,
} from "./color-math.js";
import { parseRgbString, parseHslString } from "./inputs.js";
import { createPicker } from "./picker.js";
import { createSwatchList } from "./swatches.js";

const $ = (id) => document.getElementById(id);

const els = {
  sv: $("sv"),
  svWrap: $("svWrap"),
  svCursor: $("svCursor"),
  svStatus: $("svStatus"),
  hue: $("hue"),
  hex: $("hex"),
  rgb: $("rgb"),
  hsl: $("hsl"),
  live: $("liveSwatch"),
  rgbOut: $("rgbOut"),
  cmykOut: $("cmykOut"),
  hsvOut: $("hsvOut"),
  hslOut: $("hslOut"),
  add: $("add"),
  swatches: $("swatches"),
  contrast: $("contrast"),
  windowStatus: $("windowStatus"),
  eyedrop: $("eyedrop"),
  copyHex: $("copyHex"),
  clearAll: $("clearAll"),
};

let state = { h: 217, s: 73, v: 96 };

const picker = createPicker({
  canvas: els.sv,
  wrap: els.svWrap,
  cursor: els.svCursor,
  getState: () => state,
  onChange: ({ h, s, v }) => {
    applyHSV(
      h !== undefined ? h : state.h,
      s !== undefined ? s : state.s,
      v !== undefined ? v : state.v,
    );
  },
});

function updateWindowStatus(hex) {
  const count = els.swatches.querySelectorAll(".swatch").length;
  els.windowStatus.textContent = `${hex.toUpperCase()}  •  ${count} ${count === 1 ? "swatch" : "swatches"}`;
}

const swatchList = createSwatchList({
  container: els.swatches,
  contrastEl: els.contrast,
  onChange: () => updateWindowStatus(els.hex.value),
});

function applyHSV(h, s, v) {
  state = { h, s, v };
  picker.drawSV(h);
  picker.setCursor(s, v);

  const rgb = hsvToRgb(h, s, v);
  const hex = rgbToHex(rgb).toLowerCase();
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  els.hue.value = h;
  if (document.activeElement !== els.hex) els.hex.value = hex;
  if (document.activeElement !== els.rgb)
    els.rgb.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  if (document.activeElement !== els.hsl)
    els.hsl.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;

  els.rgbOut.textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  els.cmykOut.textContent = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
  els.hsvOut.textContent = `${h}°, ${s}%, ${v}%`;
  els.hslOut.textContent = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;

  els.svStatus.textContent = `S: ${s}%  V: ${v}%`;
  els.live.style.background = hex;
  updateWindowStatus(hex);
}

els.hue.addEventListener("input", (e) => {
  applyHSV(parseInt(e.target.value, 10), state.s, state.v);
});

els.hex.addEventListener("input", (e) => {
  const rgb = hexToRgb(e.target.value);
  if (!rgb) return;
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  applyHSV(hsv.h, hsv.s, hsv.v);
});

els.rgb.addEventListener("change", (e) => {
  const rgb = parseRgbString(e.target.value);
  if (!rgb) return;
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  applyHSV(hsv.h, hsv.s, hsv.v);
});

els.hsl.addEventListener("change", (e) => {
  const hsl = parseHslString(e.target.value);
  if (!hsl) return;
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  applyHSV(hsv.h, hsv.s, hsv.v);
});

els.eyedrop.addEventListener("click", async () => {
  if (!window.EyeDropper) {
    alert("Eyedropper not supported in this browser.");
    return;
  }
  try {
    const ed = new window.EyeDropper();
    const res = await ed.open();
    const rgb = hexToRgb(res.sRGBHex);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    applyHSV(hsv.h, hsv.s, hsv.v);
  } catch (err) {
    if (err && err.name !== "AbortError") console.warn("Eyedropper:", err);
  }
});

async function copyText(text, btn, originalLabel) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = originalLabel), 900);
  } catch {
    alert("Could not copy to clipboard.");
  }
}

els.copyHex.addEventListener("click", () => {
  copyText(els.hex.value.trim(), els.copyHex, "Copy HEX");
});

document.querySelectorAll(".readouts dd").forEach((dd) => {
  dd.addEventListener("click", () => {
    const value = dd.textContent;
    const original = value;
    navigator.clipboard.writeText(value).catch(() => {});
    dd.textContent = "Copied!";
    setTimeout(() => {
      if (dd.textContent === "Copied!") dd.textContent = original;
    }, 700);
  });
});

els.clearAll.addEventListener("click", () => swatchList.clear());

els.add.addEventListener("click", () => {
  const rgb = hsvToRgb(state.h, state.s, state.v);
  swatchList.add(rgbToHex(rgb).toLowerCase());
});

applyHSV(state.h, state.s, state.v);
