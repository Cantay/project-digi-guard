// Checks a contact form submission. Returns { form } (clean values), { error } (what
// to tell the visitor) or { spam: true } (a bot: answered as success, not sent).

const MIN_FILL_MS = 2500; // humans take longer than this to fill the form
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** One line: no line breaks (they would end up in e-mail headers), trimmed, capped. */
const line = (v, max) =>
  String(v ?? "")
    .replace(/[\r\n\t\u2028\u2029]+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

const text = (v, max) =>
  String(v ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

const EMAIL = /^[^\s@<>()",;:]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/i;

export function check(d, now = Date.now()) {
  if (!d || typeof d !== "object") return { error: "Form okunamadı." };
  // Honeypot: hidden from people, filled by bots.
  if (line(d.website, 200)) return { spam: true };
  const started = Number(d.started);
  if (!Number.isFinite(started) || now - started < MIN_FILL_MS || now - started > MAX_AGE_MS) {
    return { spam: true };
  }
  const form = {
    name: line(d.name, 120),
    company: line(d.company, 160),
    email: line(d.email, 254).toLowerCase(),
    phone: line(d.phone, 40),
    topic: line(d.topic, 120) || "Genel bilgi",
    message: text(d.message, 4000),
  };
  if (form.name.length < 2) return { error: "Lütfen adınızı ve soyadınızı yazın." };
  if (form.company.length < 2) return { error: "Lütfen firma adını yazın." };
  if (!EMAIL.test(form.email)) return { error: "Lütfen geçerli bir e-posta adresi yazın." };
  if (form.phone && !/^[+0-9 ()\-]{7,40}$/.test(form.phone)) {
    return { error: "Telefon numarası geçersiz görünüyor." };
  }
  if (d.consent !== true) return { error: "Devam etmek için kişisel veri onayını işaretleyin." };
  // Messages that are mostly links are spam.
  if ((form.message.match(/https?:\/\//g) ?? []).length > 3) return { spam: true };
  return { form };
}
