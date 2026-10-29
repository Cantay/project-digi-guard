// Digi-Guard contact form: POST /api/contact (JSON) → an e-mail to MAIL_TO over SMTP.
// The site's nginx forwards /api/ here. Settings from the environment (deploy .env):
//   SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS,
//   MAIL_FROM (the sender address, usually SMTP_USER), MAIL_TO (where requests go),
//   PORT (default 3000), TRUST_PROXY (1: take the visitor's IP from X-Real-IP).
// Nothing is stored: the request becomes one e-mail; the visitor's IP is used only
// for the rate limit, in memory.
import http from "node:http";
import nodemailer from "nodemailer";
import { check } from "./validate.mjs";

const env = (k, d = "") => (process.env[k] ?? d).trim();
const PORT = Number(env("PORT", "3000"));
const MAIL_TO = env("MAIL_TO", "kurumsal@digi-guard.com");
const MAIL_FROM = env("MAIL_FROM") || env("SMTP_USER");
const port = Number(env("SMTP_PORT", "587"));

const transport = nodemailer.createTransport({
  host: env("SMTP_HOST"),
  port,
  secure: port === 465,
  requireTLS: port === 587,
  auth: env("SMTP_USER") ? { user: env("SMTP_USER"), pass: env("SMTP_PASS") } : undefined,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

// Rate limit: LIMIT requests per WINDOW per IP.
const LIMIT = 5;
const WINDOW = 10 * 60 * 1000;
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW) hits.delete(k);
  }
  return list.length > LIMIT;
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req, max = 20_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const parts = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > max) {
        reject(new Error("too large"));
        req.destroy();
      } else parts.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true });
  }
  if (url.pathname !== "/api/contact") return send(res, 404, { error: "Bulunamadı." });
  if (req.method !== "POST") return send(res, 405, { error: "Yalnızca POST." });
  if (!String(req.headers["content-type"] ?? "").startsWith("application/json")) {
    return send(res, 415, { error: "JSON bekleniyor." });
  }
  const ip =
    (env("TRUST_PROXY") === "1" && String(req.headers["x-real-ip"] ?? "")) ||
    req.socket.remoteAddress ||
    "?";
  if (limited(ip)) {
    return send(res, 429, { error: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." });
  }
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: "İstek okunamadı." });
  }
  const result = check(data);
  if (result.spam) {
    // Bots get a success answer and nothing is sent.
    return send(res, 200, { ok: true });
  }
  if (result.error) return send(res, 400, { error: result.error });
  const f = result.form;
  const lines = [
    `Ad soyad: ${f.name}`,
    `Firma: ${f.company}`,
    `E-posta: ${f.email}`,
    `Telefon: ${f.phone || "-"}`,
    `İlgilenilen çözüm: ${f.topic}`,
    "",
    f.message || "(mesaj yok)",
    "",
    "--",
    `digi-guard.com iletişim formu · ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
    "Ziyaretçi kişisel verilerinin bu talep için işlenmesine onay verdi.",
  ];
  try {
    await transport.sendMail({
      from: { name: "Digi-Guard web sitesi", address: MAIL_FROM },
      to: MAIL_TO,
      replyTo: { name: f.name, address: f.email },
      subject: `Görüşme talebi · ${f.company} · ${f.topic}`,
      text: lines.join("\n"),
    });
    console.log(`${new Date().toISOString()} gönderildi: ${f.topic}`);
    return send(res, 200, { ok: true });
  } catch (e) {
    // The reason goes to the log, not to the visitor (no server details out).
    console.error(`${new Date().toISOString()} gönderilemedi: ${e.code ?? ""} ${e.message}`);
    return send(res, 502, { error: "Talebiniz şu an iletilemedi. Lütfen telefonla ya da e-postayla ulaşın." });
  }
});

if (!env("SMTP_HOST") || !MAIL_FROM) {
  console.error("SMTP_HOST ve SMTP_USER (ya da MAIL_FROM) ayarlanmalı.");
  process.exit(1);
}
server.listen(PORT, () => console.log(`iletişim formu ${PORT} portunda → ${MAIL_TO}`));
