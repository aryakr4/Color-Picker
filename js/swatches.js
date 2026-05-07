import { textColorFor, contrastRatio, hexToRgb } from "./color-math.js";

const STORAGE_KEY = "color-picker:swatches";
const MAX_SELECTED = 2;

export function createSwatchList({ container, contrastEl, onChange = () => {} }) {
  let swatches = load();
  let selected = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(swatches));
    } catch (err) {
      console.warn("Could not save swatches:", err);
    }
  }

  function updateContrast() {
    if (selected.length !== 2) {
      contrastEl.textContent = "Select 2 swatches to compare contrast.";
      contrastEl.dataset.level = "";
      return;
    }
    const [a, b] = selected.map((hex) => hexToRgb(hex));
    const ratio = contrastRatio(a, b);
    const level =
      ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA Large" : "Fail";
    contrastEl.textContent = `Contrast ${ratio.toFixed(2)} : 1  •  ${level}`;
    contrastEl.dataset.level = level;
  }

  function render() {
    container.innerHTML = "";
    swatches.forEach((hex) => {
      const rgb = hexToRgb(hex);
      const card = document.createElement("div");
      card.className = "swatch";
      card.style.background = hex;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", selected.includes(hex) ? "true" : "false");
      if (selected.includes(hex)) card.classList.add("selected");

      const tag = document.createElement("div");
      tag.className = "tag";
      tag.style.color = textColorFor(rgb);
      tag.textContent = `${hex}  •  rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      const remove = document.createElement("button");
      remove.className = "remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${hex}`);
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        swatches = swatches.filter((s) => s !== hex);
        selected = selected.filter((s) => s !== hex);
        save();
        render();
        updateContrast();
        onChange();
      });

      card.addEventListener("click", () => {
        const i = selected.indexOf(hex);
        if (i >= 0) selected.splice(i, 1);
        else {
          selected.push(hex);
          if (selected.length > MAX_SELECTED) selected.shift();
        }
        render();
        updateContrast();
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });

      card.appendChild(remove);
      card.appendChild(tag);
      container.appendChild(card);
    });
  }

  function add(hex) {
    if (swatches.includes(hex)) return;
    swatches.push(hex);
    save();
    render();
    onChange();
  }

  function clear() {
    swatches = [];
    selected = [];
    save();
    render();
    updateContrast();
    onChange();
  }

  render();
  updateContrast();

  return { add, clear };
}
