// Cuts the site's pictures out of the catalogue pages (source/pages/pNN.jpg, 1600 px
// wide, made by scripts/render-pages.swift) and writes them as WebP to dist/img.
// Boxes are measured on an 800 px wide view: [page, x, y, w, h].
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "source/pages");
const OUT = path.join(ROOT, "dist/img");
const SCALE = 2; // 800 → 1600

export const CROPS = {
  "hero.jpg": [1, 0, 790, 800, 390],
  "how-1.jpg": [3, 60, 320, 258, 160],
  "how-2.jpg": [3, 60, 526, 258, 160],
  "how-3.jpg": [3, 60, 728, 258, 160],
  "how-4.jpg": [3, 60, 930, 258, 160],
  "how-5.jpg": [3, 60, 1128, 258, 154],
  "bekci-fabrika.jpg": [4, 58, 468, 332, 200],
  "bekci-depo.jpg": [4, 410, 468, 333, 200],
  "bekci-santiye.jpg": [4, 58, 736, 332, 200],
  "bekci-otopark.jpg": [4, 410, 736, 333, 200],
  "bekci-bina.jpg": [4, 58, 1002, 332, 184],
  "bekci-acik-alan.jpg": [4, 410, 1002, 333, 184],
  "fire.jpg": [5, 32, 430, 736, 354],
  "fire-depo.jpg": [5, 60, 1040, 160, 110],
  "fire-fabrika.jpg": [5, 233, 1040, 160, 110],
  "fire-otel.jpg": [5, 406, 1040, 160, 110],
  "fire-kamu.jpg": [5, 580, 1040, 163, 110],
  "sensor.jpg": [6, 395, 130, 205, 440],
  "sensor-oda.jpg": [6, 372, 615, 408, 400],
  "sensor-pano.jpg": [6, 36, 1200, 116, 74],
  "sensor-uretim.jpg": [6, 159, 1200, 116, 74],
  "sensor-depo.jpg": [6, 282, 1200, 116, 74],
  "sensor-server.jpg": [6, 405, 1200, 116, 74],
  "sensor-otel.jpg": [6, 528, 1200, 116, 74],
  "sensor-kamu.jpg": [6, 651, 1200, 116, 74],
  "bariyer.jpg": [7, 58, 898, 685, 354],
  "telefon.jpg": [8, 302, 290, 208, 520],
  "kontrol-merkezi.jpg": [8, 360, 822, 430, 254],
  "rapor.jpg": [9, 150, 430, 620, 440],
  "tesis.jpg": [10, 30, 440, 740, 330],
};

export async function makeImages() {
  fs.mkdirSync(OUT, { recursive: true });
  const made = [];
  for (const [name, [page, x, y, w, h]] of Object.entries(CROPS)) {
    const file = path.join(SRC, `p${String(page).padStart(2, "0")}.jpg`);
    const out = path.join(OUT, name.replace(/\.jpg$/, ".webp"));
    const fresh =
      fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(file).mtimeMs;
    if (!fresh) {
      await sharp(file)
        .extract({ left: x * SCALE, top: y * SCALE, width: w * SCALE, height: h * SCALE })
        .resize({ width: Math.min(w * SCALE, 1600), withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(out);
    }
    made.push(name);
  }
  return made;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const made = await makeImages();
  console.log(`${made.length} görsel → dist/img`);
}
