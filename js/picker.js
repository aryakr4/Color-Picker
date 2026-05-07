import { hsvToRgb, clamp } from "./color-math.js";

const SV_NUDGE = 1;
const SV_NUDGE_LARGE = 10;

export function createPicker({ canvas, wrap, cursor, onChange, getState }) {
  const ctx = canvas.getContext("2d");
  let dragging = false;

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawSV(h) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width,
      hgt = rect.height;
    const hueRgb = hsvToRgb(h, 100, 100);
    ctx.fillStyle = `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`;
    ctx.fillRect(0, 0, w, hgt);

    const gradWhite = ctx.createLinearGradient(0, 0, w, 0);
    gradWhite.addColorStop(0, "rgba(255,255,255,1)");
    gradWhite.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradWhite;
    ctx.fillRect(0, 0, w, hgt);

    const gradBlack = ctx.createLinearGradient(0, 0, 0, hgt);
    gradBlack.addColorStop(0, "rgba(0,0,0,0)");
    gradBlack.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = gradBlack;
    ctx.fillRect(0, 0, w, hgt);
  }

  function setCursor(s, v) {
    const rect = canvas.getBoundingClientRect();
    cursor.style.left = `${(s / 100) * rect.width}px`;
    cursor.style.top = `${(1 - v / 100) * rect.height}px`;
  }

  function pickFromEvent(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);
    onChange({ s, v });
  }

  wrap.addEventListener("mousedown", (e) => {
    dragging = true;
    wrap.focus();
    pickFromEvent(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => {
    if (dragging) pickFromEvent(e.clientX, e.clientY);
  });
  window.addEventListener("mouseup", () => (dragging = false));

  wrap.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      const t = e.touches[0];
      pickFromEvent(t.clientX, t.clientY);
      e.preventDefault();
    },
    { passive: false },
  );
  wrap.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      pickFromEvent(t.clientX, t.clientY);
      e.preventDefault();
    },
    { passive: false },
  );
  wrap.addEventListener("touchend", () => (dragging = false));

  wrap.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? SV_NUDGE_LARGE : SV_NUDGE;
    const { s, v } = getState();
    let ds = 0,
      dv = 0;
    switch (e.key) {
      case "ArrowLeft":
        ds = -step;
        break;
      case "ArrowRight":
        ds = step;
        break;
      case "ArrowUp":
        dv = step;
        break;
      case "ArrowDown":
        dv = -step;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange({
      s: clamp(s + ds, 0, 100),
      v: clamp(v + dv, 0, 100),
    });
  });

  window.addEventListener("resize", () => {
    fitCanvas();
    const { h, s, v } = getState();
    drawSV(h);
    setCursor(s, v);
  });

  fitCanvas();

  return { drawSV, setCursor };
}
