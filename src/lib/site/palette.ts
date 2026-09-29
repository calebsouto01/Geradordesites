import sharp from "sharp";
import type { Theme } from "./types";

import { themeFromAccent } from "./palette-client";
export { themeFromAccent, luminance, contrast } from "./palette-client";

const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function hsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

// Paleta da marca: agrupa as cores da imagem e ignora branco, preto e cinza. Só devolve códigos hex.
export async function extractPalette(image: Buffer): Promise<Theme | null> {
  const { data } = await sharp(image).resize(64, 64, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const { s, l } = hsl(r, g, b);
    if (l > 0.93 || l < 0.07 || s < 0.22) continue;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n += 1; cur.r += r; cur.g += g; cur.b += b;
    buckets.set(key, cur);
  }
  const total = [...buckets.values()].reduce((a, c) => a + c.n, 0);
  if (total < 40) return null; // imagem quase sem cor: usar o preset da categoria
  const cands = [...buckets.values()]
    .map((c) => { const r = c.r / c.n, g = c.g / c.n, b = c.b / c.n; return { hex: hex(r, g, b), r, g, b, n: c.n, s: hsl(r, g, b).s }; })
    .sort((a, b) => b.n * (0.5 + b.s) - a.n * (0.5 + a.s));
  const primary = cands[0];
  const second = cands.find((c) => Math.hypot(c.r - primary.r, c.g - primary.g, c.b - primary.b) > 90 && c.n > total * 0.05);
  return themeFromAccent(primary.hex, second?.hex);
}
