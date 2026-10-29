# Digi-Guard web sitesi

Digi-Guard kataloğundan (`DigiGuard_Tam_Katalog_Yuksek_Kalite.pdf`) üretilen statik site.

```sh
npm install
npm run dev      # derler, http://localhost:4300
npm run build    # yalnızca dist/
```

| Dosya | Ne |
|---|---|
| `content/site.json` | Bütün içerik: sayfa planı, başlıklar, metinler, çözümler, referanslar, iletişim. Metni burada değiştirin. |
| `scripts/logos.mjs` | Referans logolarını katalogun son sayfasından kırpar (`dist/img/logos`). |
| `scripts/images.mjs` | Görselleri katalog sayfalarından kırpar (`source/pages/pNN.jpg` → `dist/img/*.webp`). |
| `scripts/build.mjs` | Sayfaları üretir; `sitemap.xml`, `robots.txt` da. Bağımlılığı yalnızca `sharp`. |
| `scripts/render-pages.swift` | Katalog PDF'ini sayfa görsellerine çevirir (macOS): `swift scripts/render-pages.swift katalog.pdf source/pages 1600` |
| `src/style.css`, `src/icons.mjs` | Tasarım ve simgeler. |

## Sayfalar

`/` · `/nasil-calisir/` · `/cozumler/` · `/cozumler/{dijital-bekci, digi-fire, termal-sensor, sinyalizasyon, uyari-altyapisi, raporlama}/` · `/referanslar/` · `/iletisim/`

## Yayın

`dist/` klasörü herhangi bir statik sunucudan (nginx, Netlify, Cloudflare Pages…) yayınlanır.
İletişim formu sunucusuz çalışır: kullanıcının e-posta programını dolu açar
(`kurumsal@digi-guard.com`). Form verisini sunucuya almak istenirse bir uç (ör. Formspree
ya da kendi API'niz) eklenmeli.
