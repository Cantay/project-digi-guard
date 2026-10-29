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

## Sunucuda (Docker Compose)

Site Node.js ile derlenip nginx ile sunulur. Yönlendirme ve TLS Traefik'te: konteyner
Traefik'in Docker ağına (`PROXY_NETWORK`, varsayılan `traefik`) bağlanır, **port 8080**;
sunucuda dışarı port açılmaz. Konteyner salt okunur çalışır.

```sh
git clone git@github.com:Cantay/project-digi-guard.git && cd project-digi-guard
cp .env.example .env        # SITE_DOMAIN, PROXY_NETWORK
docker compose up -d --build
```

- Traefik'i Docker etiketleriyle kullanıyorsanız `.env`'de `TRAEFIK_LABELS=true` yapın;
  router `Host(SITE_DOMAIN)`, giriş noktası `TRAEFIK_ENTRYPOINT`, sertifika
  `TRAEFIK_CERTRESOLVER` ile kurulur. Dosya sağlayıcısıyla yönlendiriyorsanız hedef:
  `http://digi-guard-site-1:8080`.
- İçerik ya da logo değişince: `git pull && docker compose up -d --build`.
- Alan adı derleme sırasında sayfalara (kanonik bağlantı, sitemap) yazılır; değişirse
  yeniden derleyin.

## Yayın

`dist/` klasörü herhangi bir statik sunucudan (nginx, Netlify, Cloudflare Pages…) yayınlanır.
İletişim formu sunucusuz çalışır: kullanıcının e-posta programını dolu açar
(`kurumsal@digi-guard.com`). Form verisini sunucuya almak istenirse bir uç (ör. Formspree
ya da kendi API'niz) eklenmeli.
