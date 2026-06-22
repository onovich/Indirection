import { expect, test } from "@playwright/test";

test("serves the browser E2E fixture", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Indirection E2E Fixture");
  await expect(page.getByTestId("status")).toHaveText("ready");

  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { __indirectionE2E?: unknown }).__indirectionE2E)
    )
    .toEqual({
      fixture: "minimal-browser-harness",
      status: "ready"
    });
});
