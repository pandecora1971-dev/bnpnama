import { test } from "node:test";
import assert from "node:assert/strict";
import { trustedHostnames, trustedHosts } from "../lib/origins";
import { sameOrigin } from "../lib/security";
import { sourceLinksProblem } from "../lib/source-links";

function withOrigin(origin: string | undefined, run: () => void) {
  const previous = process.env.PUBLIC_ORIGIN;
  if (origin === undefined) delete process.env.PUBLIC_ORIGIN;
  else process.env.PUBLIC_ORIGIN = origin;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = previous;
  }
}

test("trusts both the bare and www form of the public origin", () => {
  for (const configured of ["https://reports.example", "https://www.reports.example"])
    withOrigin(configured, () => {
      assert.ok(trustedHostnames().has("reports.example"));
      assert.ok(trustedHostnames().has("www.reports.example"));
      assert.ok(!trustedHostnames().has("evil.example"));
    });
});

test("keeps the port of a configured origin for Origin header checks", () => {
  withOrigin("http://reports.example:8080", () => {
    assert.ok(trustedHosts().has("reports.example:8080"));
    assert.ok(trustedHostnames().has("reports.example"));
  });
});

test("accepts the www twin of the public origin but not other Vercel apps", () => {
  withOrigin("https://reports.example", () => {
    const from = (origin: string) =>
      sameOrigin(new Request("https://internal.vercel.app/api", { headers: { origin, host: "internal.vercel.app" } }));
    assert.equal(from("https://www.reports.example"), true);
    assert.equal(from("https://attacker.vercel.app"), false);
  });
});

test("explains which source link is wrong before anything is sent", () => {
  assert.equal(sourceLinksProblem(["https://example.com/a"]), "");
  assert.match(sourceLinksProblem(["https://localhost/x"]), /localhost/);
  assert.notEqual(sourceLinksProblem(Array(6).fill("https://example.com")), "");
});
