import type { Theme } from "./types";

export const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const luminance = (h: string) => { const [r, g, b] = parse(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function hsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

const mix = (a: string, b: string, t: number) => { const [x, y] = [parse(a), parse(b)]; return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };

// Monta o tema completo a partir de uma cor principal, garantindo contraste legível no botão.
export function themeFromAccent(accent: string, accent2?: string): Theme {
  const dark = "#12141c";
  const onAccent = contrast(accent, "#ffffff") >= 4.5 ? "#ffffff" : contrast(accent, dark) >= 4.5 ? dark : contrast(accent, "#ffffff") >= contrast(accent, dark) ? "#ffffff" : dark;
  return { accent, accent2: accent2 ?? mix(accent, "#000000", 0.45), onAccent, surface: mix(accent, "#ffffff", 0.94), text: "#1a1d29" };
}

