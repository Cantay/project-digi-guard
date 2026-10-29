import { test } from "node:test";
import assert from "node:assert/strict";
import { check } from "./validate.mjs";

const now = 1_800_000_000_000;
const good = {
  name: "Ayşe Demir",
  company: "Atlas Yapı",
  email: "ayse@atlas.example",
  phone: "+90 532 000 00 00",
  topic: "Digi-Guard Plus",
  message: "Merhaba,\nfiyat almak istiyoruz.",
  consent: true,
  started: now - 30_000,
  website: "",
};

test("a filled form passes, cleaned", () => {
  const r = check(good, now);
  assert.equal(r.form.email, "ayse@atlas.example");
  assert.equal(r.form.message, "Merhaba,\nfiyat almak istiyoruz.");
});

test("header injection is flattened", () => {
  const r = check({ ...good, company: "X\r\nBcc: a@b.c", name: "A\nB" }, now);
  assert.equal(r.form.company, "X Bcc: a@b.c");
  assert.equal(r.form.name, "A B");
});

test("bots: honeypot, too fast, many links", () => {
  assert.deepEqual(check({ ...good, website: "http://spam" }, now), { spam: true });
  assert.deepEqual(check({ ...good, started: now - 500 }, now), { spam: true });
  assert.deepEqual(check({ ...good, started: undefined }, now), { spam: true });
  assert.deepEqual(check({ ...good, message: "http://a http://b http://c http://d" }, now), { spam: true });
});

test("people get a reason", () => {
  assert.ok(check({ ...good, email: "ayse" }, now).error);
  assert.ok(check({ ...good, consent: false }, now).error);
  assert.ok(check({ ...good, name: "" }, now).error);
  assert.ok(check({ ...good, phone: "abc" }, now).error);
});
