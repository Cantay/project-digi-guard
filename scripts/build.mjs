// Builds the static site into dist/ from content/site.json (the catalogue's content)
// and the pictures cut by images.mjs. No framework: every page is a template string.
//
//   npm run build      → dist/
//   npm run dev        → build + http://localhost:4300
import fs from "node:fs";
import path from "node:path";
import { makeImages } from "./images.mjs";
import { LOGOS, logoFile, makeLogos } from "./logos.mjs";
import { icon, LOGO } from "../src/icons.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIST = path.join(ROOT, "dist");
const C = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));
const S = C.site;

const esc = (t = "") =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const img = (name) => `/img/${name.replace(/\.jpg$/, ".webp")}`;
const picture = (name, alt, attrs = 'loading="lazy"') =>
  `<img src="${img(name)}" alt="${esc(alt)}" ${attrs} decoding="async">`;
const solUrl = (s) => `/cozumler/${s.slug}/`;

// ---------- layout ----------

function header(current) {
  const solMenu = C.solutions
    .map((s) => `<a href="${solUrl(s)}">${icon(s.icon)}${esc(s.name)}</a>`)
    .join("");
  const links = C.nav
    .map((n) => {
      const on = current.startsWith(n.href) ? ' aria-current="page"' : "";
      if (n.children === "solutions") {
        return `<div class="drop"><a href="${n.href}"${on}>${esc(n.label)} ▾</a><div class="drop-menu">${solMenu}</div></div>`;
      }
      return `<a href="${n.href}"${on}>${esc(n.label)}</a>`;
    })
    .join("");
  return `<header class="top"><div class="wrap">
  <a class="brand" href="/">${LOGO}<span>${esc(S.name)}</span></a>
  <button class="menu-toggle" aria-label="Menü" aria-expanded="false" onclick="const n=document.querySelector('.nav');n.classList.toggle('open');this.setAttribute('aria-expanded',n.classList.contains('open'))">${icon("menu")}</button>
  <nav class="nav">${links}<a class="btn" href="/iletisim/">${esc(C.contact.cta)}</a></nav>
</div></header>`;
}

function footer() {
  const sols = C.solutions.map((s) => `<li><a href="${solUrl(s)}">${esc(s.name)}</a></li>`).join("");
  const year = new Date().getFullYear();
  return `<footer class="foot"><div class="wrap">
  <div class="cols">
    <div>
      <a class="brand" href="/">${LOGO}<span>${esc(S.name)}</span></a>
      <p>${esc(S.tagline)}. Kameralar görür, Digi-Guard anlar.</p>
      <ul>
        <li><a href="tel:${S.phoneHref}">${esc(S.phone)}</a></li>
        <li><a href="mailto:${S.email}">${esc(S.email)}</a></li>
      </ul>
    </div>
    <div><h4>Çözümler</h4><ul>${sols}</ul></div>
    <div><h4>Kurumsal</h4><ul>
      <li><a href="/nasil-calisir/">Nasıl çalışır?</a></li>
      <li><a href="/referanslar/">Referanslar</a></li>
      <li><a href="/iletisim/">İletişim</a></li>
    </ul></div>
  </div>
  <div class="legal"><span>© ${year} ${esc(S.name)} · ${esc(S.maker)}</span><span>${esc(S.closing)}</span></div>
</div></footer>`;
}

function page({ path: p, title, description, body, image = "hero.jpg" }) {
  const url = S.url + p;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: S.name,
    url: S.url,
    email: S.email,
    telephone: S.phone,
  };
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${S.url}${img(image)}">
<meta name="theme-color" content="#0d1f4f">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
${header(p)}
<main>
${body}
</main>
${footer()}
</body>
</html>
`;
}

// ---------- pieces ----------

const cards = (items, cls = "g4") =>
  `<div class="grid ${cls}">${items
    .map(
      (it, i) => `<div class="card">
  <div class="badge">${icon(it.icon)}</div>
  ${cls === "g4" && it.num !== false ? `<div class="num">${String(i + 1).padStart(2, "0")}</div>` : ""}
  <h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`,
    )
    .join("")}</div>`;

const features = (items) =>
  items
    .map(
      (f) => `<div class="feature"><div class="badge">${icon(f.icon)}</div><div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div></div>`,
    )
    .join("");

const areas = (items, cls = "") =>
  `<div class="areas ${cls}">${items
    .map(
      (a) => `<figure class="area">${picture(a.image, a.title)}<figcaption>${esc(a.title)}${a.text ? `<small>${esc(a.text)}</small>` : ""}</figcaption></figure>`,
    )
    .join("")}</div>`;

const quote = (q) => (q ? `<section class="section"><div class="wrap"><p class="quote">${esc(q)}</p></div></section>` : "");

const pageHero = ({ crumbs, kicker, title, lead }) => `<section class="page-hero"><div class="wrap">
  <div class="crumbs">${crumbs.map(([t, h]) => (h ? `<a href="${h}">${esc(t)}</a>` : esc(t))).join(" › ")}</div>
  ${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ""}
  <h1>${esc(title)}</h1>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ""}
</div></section>`;

function cta() {
  const c = C.contact;
  return `<section class="section"><div class="wrap"><div class="cta">
  <div><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p>
    <a class="btn light" href="/iletisim/">${esc(c.cta)} ${icon("arrow")}</a></div>
  <ul class="contact-list">
    <li><a href="tel:${S.phoneHref}"><span class="badge">${icon("call")}</span>${esc(S.phone)}</a></li>
    <li><a href="mailto:${S.email}"><span class="badge">${icon("mail")}</span>${esc(S.email)}</a></li>
    <li><a href="${S.url}"><span class="badge">${icon("globe")}</span>${esc(S.url.replace(/^https:\/\//, ""))}</a></li>
  </ul>
</div></div></section>`;
}

function solutionCards(list = C.solutions) {
  return `<div class="grid g3">${list
    .map(
      (s) => `<a class="card sol-card" href="${solUrl(s)}">${picture(s.image, s.name)}<div class="body">
  <span class="kicker">${esc(s.name)}</span><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p>
  <span class="more">İncele ${icon("arrow")}</span></div></a>`,
    )
    .join("")}</div>`;
}

/** The reference logos as a grid; `featured` first (well-known names). */
function logoWall(limit) {
  const featured = [
    "Koç Holding", "Otokoç", "Marriott Otel Grubu", "Antalya Büyükşehir Belediyesi",
    "Millî Eğitim Bakanlığı", "IC Hotels", "Sur Yapı", "Aeroflot Airways",
    "Delphin Otel Grubu", "Southwind Hava Yolları", "Özel Vitale Hastanesi", "Osstem Implant",
    "Hastalya Otomotiv", "Muratpaşa Belediyesi", "Teknima Enerji", "ESA Alarm",
  ];
  const order = [
    ...featured.map((n) => LOGOS.indexOf(n)).filter((i) => i >= 0),
    ...LOGOS.map((_, i) => i).filter((i) => !featured.includes(LOGOS[i])),
  ].slice(0, limit ?? LOGOS.length);
  return `<ul class="logos">${order
    .map(
      (i) => `<li title="${esc(LOGOS[i])}"><img src="/img/logos/${logoFile(i)}" alt="${esc(LOGOS[i])}" loading="lazy" decoding="async"></li>`,
    )
    .join("")}</ul>`;
}

// ---------- pages ----------

function home() {
  const h = C.home;
  const how = C.how;
  const body = `
<section class="hero">
  <div class="bg" style="background-image:url('${img(h.hero.image)}')"></div>
  <div class="wrap">
    <span class="kicker">${esc(h.hero.eyebrow)}</span>
    <h1>${esc(h.hero.title)}</h1>
    <p class="lead">${esc(h.hero.lead)}</p>
    <ul class="points">${h.hero.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="actions">
      <a class="btn light" href="/iletisim/">${esc(C.contact.cta)} ${icon("arrow")}</a>
      <a class="btn ghost" href="/cozumler/">Çözümleri inceleyin</a>
    </div>
  </div>
</section>

<section class="section"><div class="wrap">
  <span class="kicker">${esc(h.needs.kicker)}</span>
  <h2>${esc(h.needs.title)}</h2>
  <p class="lead">${esc(h.needs.lead)}</p>
  <div style="margin-top:36px">${cards(h.needs.items)}</div>
</div></section>

<section class="section soft"><div class="wrap center">
  <span class="kicker">${esc(how.kicker)}</span>
  <h2>${esc(how.title)}</h2>
  <div class="flow">${how.steps
    .map((s) => `<div class="f">${picture(s.image, s.title)}<b>${esc(s.title)}</b><span>${esc(s.text)}</span></div>`)
    .join("")}</div>
  <p style="margin-top:32px"><a class="btn" href="/nasil-calisir/">Sistemi yakından tanıyın ${icon("arrow")}</a></p>
</div></section>

<section class="section"><div class="wrap">
  <div class="center"><span class="kicker">Çözümler</span><h2>Her alana, her riske uygun teknoloji.</h2>
  <p class="lead">Dijital bekçiden termal yangın erken uyarıya, sinyalizasyondan çok kanallı uyarı ve raporlamaya kadar uçtan uca güvenlik.</p></div>
  <div style="margin-top:40px">${solutionCards()}</div>
</div></section>

<section class="section soft"><div class="wrap">
  <div class="banner">${picture("kontrol-merkezi.jpg", "Digi-Guard kontrol merkezi")}<p>Her an bağlantıda, her zaman bir adım önde.</p></div>
</div></section>

<section class="section"><div class="wrap center">
  <span class="kicker">Referanslar</span><h2>${esc(C.references.title)}</h2>
  <p class="lead">${esc(C.references.lead)}</p>
  <div style="margin-top:36px">${logoWall(24)}</div>
  <p style="margin-top:28px"><a class="btn" href="/referanslar/">${LOGOS.length} referansın tümü ${icon("arrow")}</a></p>
</div></section>

${quote(h.needs.quote)}
${cta()}`;
  return page({ path: "/", title: h.title, description: h.description, body });
}

function howPage() {
  const h = C.how;
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["Nasıl çalışır?"]], kicker: h.kicker, title: h.title, lead: h.description })}
<section class="section soft"><div class="wrap"><div class="steps">${h.steps
    .map((s) => `<div class="step">${picture(s.image, s.title)}<div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></div>`)
    .join("")}</div></div></section>
${quote(h.quote)}
<section class="section soft"><div class="wrap"><h2 class="center">Bu adımları kullanan çözümler</h2><div style="margin-top:32px">${solutionCards()}</div></div></section>
${cta()}`;
  return page({ path: "/nasil-calisir/", title: `Nasıl Çalışır · ${S.name}`, description: h.description, body, image: "how-2.jpg" });
}

function solutionsIndex() {
  const body = `${pageHero({
    crumbs: [["Ana sayfa", "/"], ["Çözümler"]],
    kicker: "Çözümler",
    title: "İhtiyacınıza uygun sistemler, size özel senaryolar.",
    lead: "Digi-Guard çözümleri tek başına ya da birlikte çalışır; mevcut kamera, sensör ve altyapınızla entegre edilir.",
  })}
<section class="section"><div class="wrap">${solutionCards()}</div></section>
${cta()}`;
  return page({ path: "/cozumler/", title: `Çözümler · ${S.name}`, description: "Digi-Guard güvenlik ve IoT çözümleri.", body });
}

function solutionPage(s) {
  const i = C.solutions.indexOf(s);
  const others = C.solutions.filter((o) => o !== s).slice(0, 3);
  let main = "";
  if (s.features) {
    main += `<section class="section"><div class="wrap"><div class="split${i % 2 ? " flip" : ""}">
  <div><span class="kicker">${esc(s.name)}</span><h2>${esc(s.featuresTitle)}</h2>${features(s.features)}</div>
  <div class="figure${s.slug === "uyari-altyapisi" || s.slug === "termal-sensor" ? " plain" : ""}">${picture(s.image, s.name, "")}</div>
</div></div></section>`;
  } else {
    main += `<section class="section"><div class="wrap"><div class="figure">${picture(s.image, s.name, "")}</div></div></section>`;
  }
  if (s.spec) {
    main += `<section class="section soft"><div class="wrap"><div class="split flip">
  <div><span class="kicker">${esc(s.spec.title)}</span><h2>Yüksek çözünürlüklü termal görüntüleme</h2>
    <ul class="parts">${s.spec.parts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <p class="lead">${esc(s.spec.detail)}</p></div>
  <div class="figure plain">${picture(s.spec.detailImage, "Sıcaklık farkı haritası")}</div>
</div></div></section>`;
  }
  if (s.channels) {
    main += `<section class="section soft"><div class="wrap"><div class="center"><h2>${esc(s.channelsTitle)}</h2></div>
  <div style="margin-top:32px">${cards(s.channels.map((c) => ({ ...c, num: false })), "g3")}</div></div></section>`;
  }
  if (s.scenarios) {
    const chips = `<div class="chips"><span>${icon("bell")}</span><span>${icon("chat")}</span><span>${icon("mail")}</span></div>`;
    main += `<section class="section"><div class="wrap"><div class="center"><h2>${esc(s.scenarios.title)}</h2><p class="lead">${esc(s.scenarios.lead)}</p></div>
  <div class="grid g3" style="margin-top:32px">${s.scenarios.items
    .map((it) => `<div class="card scenario"><div class="badge">${icon(it.icon)}</div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p>${chips}</div>`)
    .join("")}</div></div></section>`;
  }
  if (s.banner) {
    main += `<section class="section soft"><div class="wrap"><div class="banner">${picture(s.banner.image, "Kontrol merkezi")}<p>${esc(s.banner.text)}</p></div></div></section>`;
  }
  if (s.areas) {
    main += `<section class="section${s.spec ? "" : " soft"}"><div class="wrap"><h2>${esc(s.areasTitle)}</h2><div style="margin-top:28px">${areas(
      s.areas,
      s.areas.length === 4 ? "a4" : "",
    )}</div></div></section>`;
  }
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["Çözümler", "/cozumler/"], [s.name]], kicker: s.kicker, title: s.title, lead: s.lead })}
${main}
${quote(s.quote)}
<section class="section soft"><div class="wrap"><h2>Diğer çözümler</h2><div style="margin-top:28px">${solutionCards(others)}</div></div></section>
${cta()}`;
  return page({ path: solUrl(s), title: `${s.name} · ${S.name}`, description: s.summary, body, image: s.image });
}

function referencesPage() {
  const r = C.references;
  const total = r.groups.reduce((n, g) => n + g.items.length, 0);
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["Referanslar"]], kicker: `${total}+ kurum`, title: r.title, lead: r.lead })}
<section class="section"><div class="wrap">${logoWall()}</div></section>
<section class="section soft"><div class="wrap"><h2>Sektörlere göre</h2><div class="refs" style="margin-top:24px">${r.groups
    .map((g) => `<div class="ref-group"><h3>${esc(g.name)}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`)
    .join("")}</div></div></section>
${cta()}`;
  return page({ path: "/referanslar/", title: `Referanslar · ${S.name}`, description: r.lead, body });
}

function contactPage() {
  const c = C.contact;
  const options = C.solutions.map((s) => `<option>${esc(s.name)}</option>`).join("");
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["İletişim"]], kicker: "İletişim", title: c.title, lead: c.lead })}
<section class="section"><div class="wrap"><div class="split">
  <div>
    <h2>${esc(c.cta)}</h2>
    <form class="contact" onsubmit="event.preventDefault();const f=new FormData(this);const b=['Ad Soyad: '+f.get('name'),'Firma: '+f.get('company'),'Telefon: '+f.get('phone'),'İlgilenilen çözüm: '+f.get('topic'),'',f.get('message')].join('\\n');location.href='mailto:${S.email}?subject='+encodeURIComponent('Görüşme talebi · '+f.get('company'))+'&body='+encodeURIComponent(b);">
      <div class="row2"><label>Ad soyad<input name="name" required autocomplete="name"></label>
      <label>Firma<input name="company" required autocomplete="organization"></label></div>
      <div class="row2"><label>Telefon<input name="phone" type="tel" autocomplete="tel"></label>
      <label>İlgilendiğiniz çözüm<select name="topic"><option>Genel bilgi</option>${options}</select></label></div>
      <label>Mesajınız<textarea name="message" rows="5" placeholder="Tesisiniz, alanlarınız ve ihtiyacınız…"></textarea></label>
      <button class="btn" type="submit">${esc(c.cta)} ${icon("arrow")}</button>
      <p class="note">Gönder dediğinizde e-posta programınız bu bilgilerle açılır; bilgiler başka bir yere iletilmez.</p>
    </form>
  </div>
  <div>
    <div class="figure" style="margin-bottom:28px">${picture(c.image, "Digi-Guard ile korunan tesis", "")}</div>
    <div class="cta" style="grid-template-columns:1fr;padding:32px">
      <ul class="contact-list">
        <li><a href="tel:${S.phoneHref}"><span class="badge">${icon("call")}</span>${esc(S.phone)}</a></li>
        <li><a href="mailto:${S.email}"><span class="badge">${icon("mail")}</span>${esc(S.email)}</a></li>
      </ul>
    </div>
  </div>
</div></div></section>
${quote(S.closing)}`;
  return page({ path: "/iletisim/", title: `İletişim · ${S.name}`, description: c.lead, body, image: c.image });
}

// ---------- write ----------

function write(rel, html) {
  const file = path.join(DIST, rel, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return rel || "/";
}

const images = await makeImages();
await makeLogos();
fs.copyFileSync(path.join(ROOT, "src/style.css"), path.join(DIST, "style.css"));
fs.writeFileSync(path.join(DIST, "favicon.svg"), LOGO.replace('class="logo-mark" ', 'xmlns="http://www.w3.org/2000/svg" '));

const pages = [
  write("", home()),
  write("nasil-calisir", howPage()),
  write("cozumler", solutionsIndex()),
  ...C.solutions.map((s) => write(`cozumler/${s.slug}`, solutionPage(s))),
  write("referanslar", referencesPage()),
  write("iletisim", contactPage()),
];
const urls = pages.map((p) => `${S.url}/${p === "/" ? "" : p + "/"}`);
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${S.url}/sitemap.xml\n`);
console.log(`${pages.length} sayfa, ${images.length} görsel → dist/`);
