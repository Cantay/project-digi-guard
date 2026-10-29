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
  const solMenu =
    `<a href="/${C.overview.slug}/">${icon("globe")}${esc(C.overview.name)}: güvenlik, IoT, sürdürülebilirlik</a>` +
    C.solutions.map((s) => `<a href="${solUrl(s)}">${icon(s.icon)}${esc(s.name)}</a>`).join("");
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
      <li><a href="/${C.overview.slug}/">Akıllı güvenlik, IoT ve sürdürülebilirlik</a></li>
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

/** Packages: price cards; `compact` leaves out the item lists (home). */
function planCards(compact = false) {
  const P = C.packages;
  return `<div class="plans">${P.plans
    .map(
      (p) => `<div class="plan${p.featured ? " featured" : ""}">
  ${p.featured ? `<span class="ribbon">En çok tercih edilen</span>` : ""}
  <span class="kicker">${esc(p.tier)}</span>
  <h3>${esc(p.name)}</h3>
  <div class="price"><b>${esc(p.price)}</b><span>${esc(p.period)}</span></div>
  <p>${esc(p.text)}</p>
  ${compact ? "" : `<ul class="ticks">${p.items.map((i) => `<li>${icon("check")}${esc(i)}</li>`).join("")}</ul>`}
  <a class="btn${p.featured ? "" : " outline"}" href="/iletisim/?konu=${encodeURIComponent(p.name)}">${esc(compact ? "İncele ve başvur" : p.cta)} ${icon("arrow")}</a>
</div>`,
    )
    .join("")}</div>`;
}

/** The platform in the middle, the channels around it, joined by lines. */
function hub(h) {
  const n = h.channels.length;
  const nodes = h.channels.map((c, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { ...c, x: 50 + 38 * Math.cos(a), y: 50 + 38 * Math.sin(a) };
  });
  const lines = nodes
    .map((p) => `<line x1="50" y1="50" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`)
    .join("");
  const dots = nodes
    .map((p) => `<circle r="0.9"><animateMotion dur="2.4s" repeatCount="indefinite" path="M50,50 L${p.x.toFixed(1)},${p.y.toFixed(1)}"/></circle>`)
    .join("");
  return `<div class="hub">
  <svg class="hub-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}${dots}</svg>
  <div class="hub-center">${LOGO}<b>Digi-Guard</b><span>${esc(h.center)}</span></div>
  ${nodes
    .map(
      (p) => `<div class="hub-node" style="left:${p.x.toFixed(1)}%;top:${p.y.toFixed(1)}%">
    <div class="badge">${icon(p.icon)}</div><b>${esc(p.title)}</b><span>${esc(p.text)}</span></div>`,
    )
    .join("")}
</div>`;
}

/** A brand's official logo from source/brands/<slug>.(svg|png|webp), copied to
 * dist/img/brands; without one, its name in plain type (never a drawn logo). */
const BRAND_DIR = path.join(ROOT, "source/brands");
function brandLogo(b) {
  for (const ext of ["svg", "png", "webp"]) {
    const src = path.join(BRAND_DIR, `${b.slug}.${ext}`);
    if (fs.existsSync(src)) {
      const out = path.join(DIST, "img/brands");
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(src, path.join(out, `${b.slug}.${ext}`));
      return `<img src="/img/brands/${b.slug}.${ext}" alt="${esc(b.name)}" loading="lazy">`;
    }
  }
  return `<span class="brand-name">${esc(b.name)}</span>`;
}

function brandShowcase({ withText = false, marquee = true } = {}) {
  const I = C.integrations;
  const card = (b, hidden = false) =>
    `<li class="brand-card${b.badge ? " partner" : ""}"${hidden ? ' aria-hidden="true"' : ""}><div class="brand-logo">${brandLogo(b)}</div>${
      b.badge ? `<b class="brand-badge">${esc(b.badge)}</b>` : ""
    }${
      withText ? `<span>${esc(b.text)}</span>` : ""
    }</li>`;
  const grid = `<ul class="brands">${I.brands.map((b) => card(b)).join("")}</ul>`;
  const strip = marquee
    ? `<div class="brand-marquee" aria-hidden="true"><ul>${[...I.brands, ...I.brands].map((b) => card(b, true)).join("")}</ul></div>`
    : "";
  return `${marquee ? strip : grid}<p class="brands-more">${esc(I.more)}</p>`;
}

/** Our partners: logo, "Partner" under it, what the partnership is about. */
function partnerRow() {
  const P = C.integrations.partners;
  return `<ul class="partners">${P.items
    .map(
      (b) => `<li class="brand-card partner"><div class="brand-logo">${brandLogo(b)}</div><b class="brand-badge">${esc(b.badge)}</b><span>${esc(b.text)}</span></li>`,
    )
    .join("")}</ul>`;
}

function flowSteps(steps) {
  return `<ol class="chain">${steps
    .map((st) => `<li><div class="badge">${icon(st.icon)}</div><b>${esc(st.title)}</b></li>`)
    .join("")}</ol>`;
}

// ---------- pages ----------

const comm = () => C.solutions.find((x) => x.slug === "uyari-altyapisi");

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

<section class="section"><div class="wrap"><a class="ov-band" href="/${C.overview.slug}/">
  <div><span class="kicker">${esc(C.overview.brand)}</span><h2>Akıllı güvenlik, verimli operasyonlar ve sürdürülebilir gelecek.</h2>
  <p>Dijital Bekçi, Digi-Fire ve IoT'nin işletmenize ekonomik, operasyonel ve çevresel katkısını tek sayfada görün.</p></div>
  <span class="btn light">Genel bakışı inceleyin ${icon("arrow")}</span></a></div></section>

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
  <p class="lead">Dijital bekçiden termal yangın erken uyarıya, IoT izleme ve otomasyondan akıllı iletişim ve raporlamaya kadar uçtan uca güvenlik.</p></div>
  <div style="margin-top:40px">${solutionCards(C.solutions.slice(0, 6))}</div>
  <p class="center" style="margin-top:24px"><a href="/cozumler/">Tüm çözümler →</a></p>
</div></section>

<section class="section soft"><div class="wrap">
  <div class="center"><span class="kicker">${esc(C.packages.kicker)}</span><h2>${esc(C.packages.title)}</h2>
  <p class="lead">Donanım dahil, aylık abonelikle dijital bekçi. Kamera, anons, mobil uygulama, çağrı merkezi ve sınırsız garanti tek pakette.</p></div>
  <div style="margin-top:40px">${planCards(true)}</div>
  <p class="center" style="margin-top:24px"><a href="/paketler/">Paketleri karşılaştırın →</a></p>
</div></section>

<section class="section dark"><div class="wrap">
  <div class="center"><span class="kicker">${esc(comm().kicker)}</span><h2>${esc(comm().title)}</h2>
  <p class="lead">${esc(comm().lead)}</p></div>
  ${hub(comm().hub)}
  <p class="commons">${esc(comm().hub.commons)}</p>
  <p class="center" style="margin-top:20px"><a class="btn light" href="/cozumler/uyari-altyapisi/">Akıllı iletişimi inceleyin ${icon("arrow")}</a></p>
</div></section>

<section class="section dark integ"><div class="wrap">
  <div class="center"><span class="kicker">${esc(C.integrations.kicker)}</span><h2>${esc(C.integrations.title)}</h2>
  <p class="lead">${esc(C.integrations.lead)}</p></div>
  <div style="margin-top:36px">${partnerRow()}</div>
  <p class="brands-more" style="margin:26px 0 18px">Entegre çalıştığımız teknolojiler</p>
  ${brandShowcase()}
  <p class="center" style="margin-top:28px"><a class="btn light" href="/entegrasyonlar/">${esc(C.integrations.cta)} ${icon("arrow")}</a></p>
  <p class="scope">${esc(C.integrations.scope)}</p>
  <p class="disclaimer">${esc(C.integrations.disclaimer)}</p>
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
  if (s.intro) {
    main += `<section class="section"><div class="wrap"><div class="split">
  <div><h2>${esc(s.intro.title)}</h2>${s.intro.text.map((t) => `<p class="lead">${esc(t)}</p>`).join("")}</div>
  <div class="figure plain">${picture(s.image, s.name, "")}</div>
</div></div></section>`;
  }
  if (s.hub) {
    main += `<section class="section dark"><div class="wrap"><div class="center"><h2>${esc(s.hub.title)}</h2></div>
  ${hub(s.hub)}<p class="commons">${esc(s.hub.commons)}</p></div></section>`;
  }
  if (s.flow) {
    main += `<section class="section"><div class="wrap"><div class="center"><h2>${esc(s.flow.title)}</h2><p class="lead">${esc(s.flow.lead)}</p></div>
  ${flowSteps(s.flow.steps)}
  <div class="example"><b>Örnek senaryo</b><p>${esc(s.flow.example)}</p></div></div></section>`;
  }
  if (s.control) {
    main += `<section class="section soft"><div class="wrap center"><h2>${esc(s.control.title)}</h2><p class="lead">${esc(s.control.text)}</p>
  <p class="claim">Digi-Guard – ${esc(s.control.line)}</p></div></section>`;
  }
  if (s.blocks) {
    main += `<section class="section"><div class="wrap"><h2>${esc(s.blocksTitle)}</h2><div class="blocks">${s.blocks
      .map(
        (b) => `<article class="block">${picture(b.image, b.title)}<div><div class="badge">${icon(b.icon)}</div><h3>${esc(b.title)}</h3><p>${esc(b.text)}</p></div></article>`,
      )
      .join("")}</div></div></section>`;
  }
  if (s.platform) {
    main += `<section class="section dark"><div class="wrap"><div class="split">
  <div><span class="kicker">IoT platformu</span><h2>${esc(s.platformTitle)}</h2><p class="lead">${esc(s.platformLead)}</p></div>
  <ul class="ticks light">${s.platform.map((i) => `<li>${icon("check")}${esc(i)}</li>`).join("")}</ul>
</div></div></section>`;
  }
  if (s.custom) {
    main += `<section class="section"><div class="wrap"><div class="cta">
  <div><h2>${esc(s.custom.title)}</h2><p>${esc(s.custom.text)}</p></div>
  <div><h3 style="color:#fff">${esc(s.custom.sub)}</h3><p>${esc(s.custom.detail)}</p>
    <a class="btn light" href="/iletisim/?konu=${encodeURIComponent(s.custom.topic)}">${esc(s.custom.cta)} ${icon("arrow")}</a></div>
</div></div></section>`;
  }
  if (s.packagesLink) {
    main += `<section class="section soft"><div class="wrap"><div class="center"><span class="kicker">${esc(C.packages.kicker)}</span><h2>Donanım dahil, aylık abonelik</h2></div>
  <div style="margin-top:32px">${planCards(true)}</div></div></section>`;
  }
  if (s.features) {
    main += `<section class="section"><div class="wrap"><div class="split${i % 2 ? " flip" : ""}">
  <div><span class="kicker">${esc(s.name)}</span><h2>${esc(s.featuresTitle)}</h2>${features(s.features)}</div>
  <div class="figure${s.slug === "uyari-altyapisi" || s.slug === "termal-sensor" ? " plain" : ""}">${picture(s.image, s.name, "")}</div>
</div></div></section>`;
  } else if (!s.intro && !s.blocks) {
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
  if (s.banner && !s.hub) {
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

function packagesPage() {
  const P = C.packages;
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["Paketler"]], kicker: P.kicker, title: P.title, lead: P.lead })}
<section class="section soft"><div class="wrap">${planCards()}
  <p class="note center" style="margin-top:18px">Fiyatlara KDV dahil değildir. Paketler donanım dahil aylık abonelik olarak sunulur.</p></div></section>
<section class="section"><div class="wrap"><div class="center"><h2>${esc(P.whyTitle)}</h2></div>
  <div style="margin-top:32px">${cards(P.why.map((w) => ({ ...w, num: false })), "g3")}</div></div></section>
${quote(P.slogan)}
${cta()}`;
  return page({ path: "/paketler/", title: `Dijital Bekçi Paketleri · ${S.name}`, description: P.lead, body, image: "bekci-otopark.jpg" });
}

function integrationsPage() {
  const I = C.integrations;
  const topic = encodeURIComponent(I.check.topic);
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["Entegrasyonlar"]], kicker: I.kicker, title: I.title, lead: I.lead })}
<section class="section"><div class="wrap">
  <div class="center"><span class="kicker">${esc(I.partners.kicker)}</span><h2>${esc(I.partners.title)}</h2><p class="lead">${esc(I.partners.lead)}</p></div>
  <div style="margin-top:30px">${partnerRow()}</div>
</div></section>
<section class="section dark integ"><div class="wrap">
  <div class="center"><h2>Entegre teknolojiler ve markalar</h2><p class="lead">${esc(I.intro.text[0])}</p></div>
  <div style="margin-top:34px">${brandShowcase({ withText: true, marquee: false })}</div>
  <p class="scope">${esc(I.scope)}</p>
</div></section>
<section class="section dark"><div class="wrap">
  <div class="center"><h2>${esc(I.hub.title)}</h2><p class="lead">${esc(I.intro.text[1])}</p></div>
  ${hub(I.hub)}
  <p class="commons">${esc(I.hub.commons)}</p>
</div></section>
<section class="section"><div class="wrap">
  <div class="center"><span class="kicker">Entegrasyonun avantajları</span><h2>${esc(I.agnostic.title)}</h2><p class="lead">${esc(I.agnostic.text)}</p></div>
  <div style="margin-top:32px">${cards(I.agnostic.cards.map((c) => ({ ...c, num: false })), "g4")}</div>
</div></section>
<section class="section"><div class="wrap"><div class="cta">
  <div><h2>${esc(I.check.title)}</h2><p>${esc(I.check.text)}</p></div>
  <div class="cta-buttons"><a class="btn light" href="/iletisim/?konu=${topic}">${esc(I.check.cta)} ${icon("arrow")}</a>
  <p style="font-size:.85rem;margin:0">${esc(I.scope)}</p></div>
</div></div></section>
<section class="closing"><div class="wrap center">
  <span class="kicker">Digi-Guard</span>
  <p class="quote">${esc(I.closing.line)}</p>
  <ul class="points">${I.closing.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  <p class="disclaimer">${esc(I.disclaimer)}</p>
</div></section>`;
  return page({ path: "/entegrasyonlar/", title: `Entegrasyonlar · ${S.name}`, description: I.lead, body });
}

function overviewPage() {
  const O = C.overview;
  const url = `/${O.slug}/`;
  const ticks = (items, cls = "") => `<ul class="ticks ${cls}">${items.map((i) => `<li>${icon("check")}${esc(i)}</li>`).join("")}</ul>`;
  const layerNodes = O.hero.layers
    .map((l, i) => `<div class="layer l${i}"><div class="badge">${icon(l.icon)}</div><b>${esc(l.title)}</b><span>${esc(l.text)}</span></div>`)
    .join("");
  const body = `
<section class="ov-hero">
  <div class="bg" style="background-image:url('${img(O.hero.image)}')"></div>
  <div class="wrap ov-hero-grid">
    <div>
      <span class="kicker">${esc(O.brand)}</span>
      <h1>${esc(O.hero.title)}</h1>
      <p class="lead">${esc(O.hero.lead)}</p>
      <ul class="points">${O.hero.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      <div class="actions">
        <a class="btn light" href="/iletisim/?konu=${encodeURIComponent("Digi-Guard Enterprise")}">${esc(O.cta.primary)} ${icon("arrow")}</a>
        <a class="btn ghost" href="/cozumler/iot/">${esc(O.cta.secondary)}</a>
      </div>
    </div>
    <div class="layers" aria-label="Üç teknoloji, Digi-Guard platformuna bağlı">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="50" y1="54" x2="50" y2="12"/><line x1="50" y1="54" x2="14" y2="86"/><line x1="50" y1="54" x2="86" y2="86"/>
        <circle r="1.2"><animateMotion dur="2s" repeatCount="indefinite" path="M50,12 L50,54"/></circle>
        <circle r="1.2"><animateMotion dur="2.4s" repeatCount="indefinite" path="M14,86 L50,54"/></circle>
        <circle r="1.2"><animateMotion dur="2.2s" repeatCount="indefinite" path="M86,86 L50,54"/></circle>
      </svg>
      <div class="layer-core">${LOGO}<b>Digi-Guard</b><span>Akıllı platform</span></div>
      ${layerNodes}
    </div>
  </div>
</section>

<section class="section"><div class="wrap">
  <div class="center" style="max-width:860px;margin:0 auto">${O.intro.map((t) => `<p class="lead">${esc(t)}</p>`).join("")}</div>
  <h2 class="center" style="margin-top:46px">${esc(O.techs.title)}</h2>
  <div class="grid g3" style="margin-top:30px">${O.techs.items
    .map((t) => `<a class="card sol-card" href="${t.href}">${picture(t.image, t.name)}<div class="body"><h3>${esc(t.name)}</h3><p>${esc(t.text)}</p><span class="more">Çözümleri keşfet ${icon("arrow")}</span></div></a>`)
    .join("")}</div>
</div></section>

<section class="section soft"><div class="wrap">
  <span class="kicker">${esc(O.savings.kicker)}</span><h2>${esc(O.savings.title)}</h2><p class="lead">${esc(O.savings.lead)}</p>
  <div class="compare" role="table" aria-label="Geleneksel yöntem ve Digi-Guard karşılaştırması">
    <div class="compare-head" role="row"><span role="columnheader">Alan</span><span role="columnheader">Geleneksel yöntem</span><span role="columnheader">Digi-Guard akıllı yönetim</span></div>
    ${O.savings.rows
      .map((r) => `<div class="compare-row" role="row"><b role="cell">${esc(r.area)}</b><span role="cell" class="old">${esc(r.old)}</span><span role="cell" class="new">${icon("check")}${esc(r.new)}</span></div>`)
      .join("")}
  </div>
  <p class="note">${esc(O.savings.note)}</p>
  <div class="split" style="margin-top:36px;align-items:start">${ticks(O.savings.points)}<p class="claim">${esc(O.savings.line)}</p></div>
</div></section>

<section class="section"><div class="wrap"><div class="grid g2 duo">
  ${[O.proactive, O.fire]
    .map(
      (x) => `<article class="card duo-card">${picture(x.image, x.name)}<div class="body"><span class="kicker">${esc(x.name)}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>${ticks(x.points)}${
        x.note ? `<p class="legal-note">${esc(x.note)}</p>` : ""
      }<p class="claim small">${esc(x.line)}</p></div></article>`,
    )
    .join("")}
</div></div></section>

<section class="section soft"><div class="wrap">
  <div class="center"><span class="kicker">${esc(O.scenarios.kicker)}</span><h2>${esc(O.scenarios.title)}</h2><p class="lead">${esc(O.scenarios.lead)}</p></div>
  <div class="grid g2" style="margin-top:34px">${O.scenarios.items
    .map(
      (it) => `<article class="card scen">${picture(it.image, it.title)}<div class="body"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p>
    <ol class="mini-flow">${it.flow.map((f, i) => `<li><small>${esc(O.scenarios.steps[i])}</small>${esc(f)}</li>`).join("")}</ol></div></article>`,
    )
    .join("")}</div>
  <p class="center lead" style="margin-top:30px">${esc(O.scenarios.custom)}</p>
  <p class="claim center">${esc(O.scenarios.line)}</p>
</div></section>

<section class="section dark"><div class="wrap">
  <div class="center"><span class="kicker">${esc(O.response.kicker)}</span><h2>${esc(O.response.title)}</h2><p class="lead">${esc(O.response.lead)}</p></div>
  <ol class="chain on-dark">${O.response.steps.map((st) => `<li><div class="badge">${icon(st.icon)}</div><b>${esc(st.title)}</b></li>`).join("")}</ol>
  <ul class="channel-row">${O.response.channels.map((c) => `<li>${icon(c.icon)}<span>${esc(c.title)}</span></li>`).join("")}</ul>
  <div class="example on-dark"><b>Örnek senaryo</b><p>${esc(O.response.example)}</p></div>
  <p class="commons">${esc(O.response.line)}</p>
</div></section>

<section class="section green"><div class="wrap">
  <div class="center"><span class="kicker">${esc(O.green.kicker)}</span><h2>${esc(O.green.title)}</h2><p class="lead">${esc(O.green.lead)}</p></div>
  <div class="green-grid">${O.green.items.map((g) => `<div class="card"><div class="badge">${icon(g.icon)}</div><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p></div>`).join("")}</div>
  <p class="note center">${esc(O.green.note)}</p>
  <p class="claim center">${esc(O.green.line)}</p>
</div></section>

<section class="section"><div class="wrap">
  <div class="center"><span class="kicker">${esc(O.data.kicker)}</span><h2>${esc(O.data.title)}</h2><p class="lead">${esc(O.data.lead)}</p></div>
  <div class="dash" role="img" aria-label="Digi-Guard yönetim paneli örneği, temsili veriler">
    <div class="dash-top"><span>${LOGO} Digi-Guard yönetim paneli</span><span class="tag">Temsili veriler</span></div>
    <div class="dash-grid">${O.data.metrics
      .map(
        (m, i) => `<div class="metric"><div class="m-ico">${icon(m.icon)}</div><small>${esc(m.label)}</small><b>${esc(m.value)}</b>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><polyline points="${Array.from({ length: 12 }, (_, k) => `${(k * 100) / 11},${(12 + 9 * Math.sin(k * 0.9 + i)).toFixed(1)}`).join(" ")}"/></svg></div>`,
      )
      .join("")}</div>
  </div>
  <div class="split" style="margin-top:40px;align-items:start">
    <div><h3>${esc(O.data.reportsTitle)}</h3>${ticks(O.data.reports)}</div>
    <p class="claim">${esc(O.data.line)}</p>
  </div>
</div></section>

<section class="section"><div class="wrap"><div class="cta">
  <div><h2>${esc(O.cta.title)}</h2><p>${esc(O.cta.text)}</p></div>
  <div class="cta-buttons">
    <a class="btn light" href="/iletisim/?konu=${encodeURIComponent("Digi-Guard Enterprise")}">${esc(O.cta.primary)} ${icon("arrow")}</a>
    <a class="btn ghost" href="/cozumler/iot/">${esc(O.cta.secondary)}</a>
  </div>
</div></div></section>

<section class="closing"><div class="wrap center">
  <span class="kicker">${esc(O.brand)}</span>
  <p class="quote">${esc(O.closing.line)}</p>
  <ul class="points">${O.closing.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
</div></section>`;
  return page({ path: url, title: `${O.metaTitle} · ${S.name}`, description: O.description, body, image: O.hero.image });
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
  const options = [...C.packages.plans.map((p) => p.name), ...C.solutions.map((s) => s.name), C.integrations.check.topic]
    .map((n) => `<option>${esc(n)}</option>`)
    .join("");
  const body = `${pageHero({ crumbs: [["Ana sayfa", "/"], ["İletişim"]], kicker: "İletişim", title: c.title, lead: c.lead })}
<section class="section"><div class="wrap"><div class="split">
  <div>
    <h2>${esc(c.cta)}</h2>
    <form class="contact" id="contact-form" novalidate>
      <div class="row2"><label>Ad soyad *<input name="name" required maxlength="120" autocomplete="name"></label>
      <label>Firma *<input name="company" required maxlength="160" autocomplete="organization"></label></div>
      <div class="row2"><label>E-posta *<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
      <label>Telefon<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label></div>
      <label>İlgilendiğiniz çözüm<select name="topic"><option>Genel bilgi</option>${options}</select></label>
      <label>Mesajınız<textarea name="message" rows="5" maxlength="4000" placeholder="Tesisiniz, alanlarınız ve ihtiyacınız…"></textarea></label>
      <label class="hp" aria-hidden="true">Web siteniz<input name="website" tabindex="-1" autocomplete="off"></label>
      <label class="consent"><input type="checkbox" name="consent" required> <span>İletişim talebimin yanıtlanması için paylaştığım kişisel verilerin işlenmesini kabul ediyorum.</span></label>
      <button class="btn" type="submit">${esc(c.cta)} ${icon("arrow")}</button>
      <p class="form-status" role="status" aria-live="polite"></p>
      <p class="note">Bilgileriniz yalnızca talebinizi yanıtlamak için ${esc(S.email)} adresine iletilir.</p>
    </form>
    <script>
{const f=document.getElementById("contact-form"),st=f.querySelector(".form-status"),b=f.querySelector("button");
const started=Date.now();
const say=(t,ok)=>{st.textContent=t;st.className="form-status "+(ok?"ok":"err");};
f.addEventListener("submit",async e=>{e.preventDefault();
 if(!f.reportValidity())return;
 const d=Object.fromEntries(new FormData(f));d.consent=f.consent.checked;d.started=started;
 b.disabled=true;say("Gönderiliyor…",true);
 try{const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});
  const j=await r.json().catch(()=>({}));
  if(r.ok&&j.ok){f.reset();say("Teşekkürler, talebiniz bize ulaştı. En kısa sürede dönüş yapacağız.",true);}
  else{say(j.error||"Talebiniz iletilemedi. Lütfen ${S.phone} numarasından ya da ${S.email} adresinden ulaşın.",false);b.disabled=false;}
 }catch{say("Bağlantı kurulamadı. Lütfen ${S.phone} numarasından ya da ${S.email} adresinden ulaşın.",false);b.disabled=false;}
});}
    </script>
    <script>{const k=new URLSearchParams(location.search).get("konu");const s=document.querySelector("select[name=topic]");if(k&&s){[...s.options].forEach(o=>{if(o.text===k)s.value=k});}}</script>
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
  write("paketler", packagesPage()),
  write("entegrasyonlar", integrationsPage()),
  write(C.overview.slug, overviewPage()),
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
