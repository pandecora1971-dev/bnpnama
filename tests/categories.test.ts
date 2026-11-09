import { test } from "node:test";
import assert from "node:assert/strict";
import { categories, conditionalFields, categoryAliases, normalizeCategory } from "../lib/shared";
import { reportSchema } from "../lib/validation";
const base = { title: "কাল্পনিক পরীক্ষার অভিযোগ", description: "শুধু সফটওয়্যার পরীক্ষার জন্য কাল্পনিক বিবরণ, কোনো বাস্তব ব্যক্তি বা ঘটনার অভিযোগ নয়।", division: "ঢাকা", district: "ঢাকা", upazila: "সাভার", incidentDate: "2026-10-01", declaration: "1" };
test("all catalog categories accept their form fields and reject unrelated facts", () => {
 assert.equal(categories.length, 30);
 assert.equal(new Set(categories).size, 30);
 for (const category of categories) {
  const fields = conditionalFields[category];
  assert.ok(Array.isArray(fields), category);
  const facts = Object.fromEntries(fields.map(f => [f.key, f.type === "number" ? "2" : "কাল্পনিক প্রতিষ্ঠান"]));
  assert.equal(reportSchema.safeParse({ ...base, category, facts }).success, true, category);
  assert.equal(reportSchema.safeParse({ ...base, category, facts: { unknown_fact: "2" } }).success, false);
 }
});
test("legacy categories merge without losing or changing stored report facts", () => {
 for (const [old, current] of Object.entries(categoryAliases)) {
  const facts = Object.freeze({ victim_count: "3", loss_amount: "500" });
  const result = normalizeCategory(old, facts);
  assert.equal(result.category, current);
  assert.deepEqual(result.facts, facts);
  assert.equal(normalizeCategory(result.category, result.facts).category, current);
 }
 assert.equal(normalizeCategory("সাইবার অপরাধ", {}).category, "সাইবার অপরাধ");
});
