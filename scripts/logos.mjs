// Cuts the reference logos out of the catalogue's last page (source/pages/p11.jpg):
// a 4 × 12 grid, in the order of LOGOS. Trimmed to the logo, on white, as WebP.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "dist/img/logos");

export const LOGOS = [
  "Koç Holding", "Otokoç", "Millî Eğitim Bakanlığı", "Millî Savunma Bakanlığı Antalya ASAL Şubesi",
  "Kültür ve Turizm Bakanlığı Antalya Müzesi", "Antalya Büyükşehir Belediyesi", "Marriott Otel Grubu", "IC Hotels",
  "Delphin Otel Grubu", "Sur Yapı", "Aeroflot Airways", "İran Hava Yolları",
  "Southwind Hava Yolları", "BBN Hava Yolları", "Muratpaşa Belediyesi", "Alanya Belediyesi",
  "Burdur Belediyesi", "Antalya Adliyesi İcra Müdürlükleri", "Antalya Yüksek Güvenlikli Ceza İnfaz Kurumu", "L Tipi ve S Tipi Ceza İnfaz Kurumları",
  "Antalya Barosu", "Antalya Eczacı Odası", "Hasmer", "Hastalya Otomotiv",
  "Özpınarlar İnşaat", "Osstem Implant", "Blue Bird Havacılık", "Amerikan Kültür Dil Okulları",
  "English Time Dil Okulları", "Amerikan VIP Eğitim Kurumları", "İlim Yayma Cemiyeti", "Çameli Belediyesi",
  "Teknima Enerji", "Aldis Havacılık", "Özel Vitale Hastanesi", "NTA Implant",
  "Toros Dental", "Mina Travel", "Let's Stay Hotels", "Leliko Suites",
  "Göz Balık", "Milklaç Süt Ürünleri", "Çikolata Evim", "OVA Kargo",
  "Remim Mimarlık", "Roas Medya", "24 YD Yabancı Dil Kursu", "ESA Alarm",
];

// Measured on an 800 px wide view of the page.
const COLS = [30, 225, 420, 615];
const COL_W = 160;
const TOP = 121;
const PITCH = 97.4;
const ROW_H = 72;

export const logoFile = (i) => `ref-${String(i + 1).padStart(2, "0")}.webp`;

export async function makeLogos() {
  fs.mkdirSync(OUT, { recursive: true });
  const src = path.join(ROOT, "source/pages/p11.jpg");
  for (let i = 0; i < LOGOS.length; i++) {
    const out = path.join(OUT, logoFile(i));
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs) continue;
    const r = Math.floor(i / 4);
    const c = i % 4;
    const box = {
      left: COLS[c] * 2,
      top: Math.round((TOP + PITCH * r) * 2),
      width: COL_W * 2,
      height: ROW_H * 2,
    };
    const cut = await sharp(src).extract(box).toBuffer();
    await sharp(cut)
      .trim({ background: "#ffffff", threshold: 30 })
      .resize({ height: 96, width: 260, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 88 })
      .toFile(out);
  }
  return LOGOS.length;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(`${await makeLogos()} logo → dist/img/logos`);
}
