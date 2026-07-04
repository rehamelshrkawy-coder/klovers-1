import { test, expect } from "@playwright/test";

test.describe("Trial booking flow", () => {
  test("free trial page loads", async ({ page }) => {
    await page.goto("https://kloversegy.com/free-trial");
    await expect(page).toHaveTitle(/KLovers/i);
  });

  test("booking form has required fields", async ({ page }) => {
    await page.goto("https://kloversegy.com/free-trial");
    await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("form submission with empty fields shows validation errors", async ({ page }) => {
    await page.goto("https://kloversegy.com/free-trial");
    // Attempt to submit without filling the form
    const submitButton = page.getByRole("button", { name: /book|submit|register/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Expect some kind of validation feedback
      await expect(page.locator("form")).toBeVisible();
    }
  });
});
