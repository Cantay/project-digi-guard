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

## Sunucuda (Docker Compose + sunucudaki nginx)

Site Node.js ile derlenip konteynerdeki nginx ile sunulur. Konteyner yalnızca
`127.0.0.1:8088`'e açılır (dışarıdan erişilemez); alan adı ve TLS sunucudaki nginx'te.
Konteyner salt okunur çalışır.

```sh
git clone git@github.com:Cantay/project-digi-guard.git && cd project-digi-guard
cp .env.example .env              # SITE_DOMAIN, SITE_PORT, SMTP_* (form e-postası)
docker compose up -d --build
curl -I http://127.0.0.1:8088/    # 200 OK

sudo cp deploy/nginx-digi-guard.conf /etc/nginx/sites-available/digi-guard.conf
sudo ln -s /etc/nginx/sites-available/digi-guard.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d www.digi-guard.com -d digi-guard.com   # sertifika yoksa
sudo nginx -t && sudo systemctl reload nginx
```

- `deploy/nginx-digi-guard.conf`: http → https ve kök alan → www yönlendirmesi,
  `www.digi-guard.com` → `127.0.0.1:8088`. Port `.env`'deki `SITE_PORT` ile aynı olmalı.
- İçerik ya da logo değişince: `git pull && docker compose up -d --build` (nginx'e
  dokunmak gerekmez).
- Alan adı derleme sırasında sayfalara (kanonik bağlantı, sitemap) yazılır; değişirse
  yeniden derleyin.

## İletişim formu

Form `/api/contact` adresine gönderilir; compose'daki `api` servisi (Node.js,
nodemailer) talebi SMTP ile `MAIL_TO` adresine e-posta olarak iletir. "Yanıtla"
ziyaretçiye gider. Hiçbir şey kaydedilmez.

- SMTP bilgileri sunucudaki `.env`'de: `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS / 465 TLS),
  `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`. `.env` repoya girmez.
- Korumalar: gizli tuzak alanı, en az 2,5 sn doldurma süresi, IP başına 10 dakikada
  5 gönderim, alan uzunluk sınırları, e-posta başlıklarına satır sonu sızdırılmaz,
  KVKK onay kutusu zorunlu.
- Gönderilemeyen talepler `docker compose logs api`'de görünür; ziyaretçiye telefon ve
  e-posta önerilir.
- Testler: `cd api && npm test`.

## Yayın

`dist/` klasörü herhangi bir statik sunucudan (nginx, Netlify, Cloudflare Pages…) yayınlanır.
İletişim formu sunucusuz çalışır: kullanıcının e-posta programını dolu açar
(`kurumsal@digi-guard.com`). Form verisini sunucuya almak istenirse bir uç (ör. Formspree
ya da kendi API'niz) eklenmeli.
