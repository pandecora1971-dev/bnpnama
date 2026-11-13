import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { deleteReport, ReviewError } from "../lib/reports";
import { objectStore } from "../lib/r2";
import { revision } from "../lib/db";
import { random } from "../lib/security";
import { admin, finish, resetData, seedReport } from "./support/db";

process.env.SESSION_SECRET = randomBytes(32).toString("hex");
const owner = { id: "owner", username: "superadmin", role: "superadmin" as const };
const moderator = { id: "mod-1", username: "synthetic-mod", role: "moderator" as const };
beforeEach(resetData);
after(finish);

async function count(table: string, id: string) {
  const { rows } = await admin.query(`SELECT count(*)::int AS n FROM bnpnama.${table} WHERE report_id=$1`, [id]);
  return rows[0].n as number;
}

test("only the super admin can delete a report", async () => {
  const id = await seedReport();
  await assert.rejects(deleteReport(moderator, id), (e) => e instanceof ReviewError && e.status === 403);
  const { rowCount } = await admin.query("SELECT 1 FROM bnpnama.reports WHERE id=$1", [id]);
  assert.equal(rowCount, 1);
});

test("deleting removes the report, its linked rows and evidence files, and is audited", async () => {
  const id = await seedReport({ status: "published" });
  await admin.query("INSERT INTO bnpnama.source_links(report_id,position,url) VALUES($1,0,'https://example.com/news')", [id]);
  await admin.query("INSERT INTO bnpnama.accused(report_id,position,name,information) VALUES($1,0,'কাল্পনিক নাম','')", [id]);
  const key = `evidence/${random()}`;
  await objectStore().put(key, "fictional test bytes", "text/plain");
  await admin.query(
    "INSERT INTO bnpnama.evidence(id,report_id,mime,size_bytes,object_key,created_at) VALUES($1,$2,'image/png',20,$3,now())",
    [random(), id, key],
  );
  const before = await revision();

  await deleteReport(owner, id);

  const { rowCount } = await admin.query("SELECT 1 FROM bnpnama.reports WHERE id=$1", [id]);
  assert.equal(rowCount, 0);
  for (const table of ["source_links", "accused", "evidence"]) assert.equal(await count(table, id), 0, table);
  assert.equal(await objectStore().head(key), null, "evidence object removed from storage");
  const audit = await admin.query("SELECT actor_name, detail FROM bnpnama.audit_log WHERE action='report.delete' AND target=$1", [id]);
  assert.equal(audit.rowCount, 1);
  assert.equal(audit.rows[0].actor_name, "superadmin");
  assert.equal(JSON.parse(audit.rows[0].detail).evidence, 1);
  assert.ok((await revision()) > before, "public caches are invalidated for a published report");
});

test("deleting a report that is already gone reports 404", async () => {
  await assert.rejects(deleteReport(owner, "missing"), (e) => e instanceof ReviewError && e.status === 404);
});
