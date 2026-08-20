import { test, expect } from "@playwright/test";

test.describe("Serrucho MVP End-to-End Flow", () => {
  test("complete smoke test: landing -> dashboard -> create -> participants -> expenses -> balance -> close -> public receipt", async ({
    page,
  }) => {
    test.setTimeout(60000);

    // 1. Visit landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/Serrucho/i);
    await expect(page.locator("h1")).toBeVisible();

    // 2. Click "Crear un Serrucho Gratis" on landing page
    await page.getByRole("button", { name: /Crear un Serrucho Gratis/i }).click();

    // 3. Fill in serrucho details in modal
    const uniqueName = `Playa 2026 Smoke ${Date.now()}`;
    await page.locator("#name").fill(uniqueName);
    await page.locator("#description").fill("Viaje de amigos a la playa de Las Terrenas");
    await page.locator('button[type="submit"]:has-text("Crear Serrucho")').click();

    // 4. Should navigate into the new serrucho workspace
    await page.waitForURL(/\/dashboard\/.+/, { timeout: 20000 });
    await expect(page.locator("h1")).toContainText(uniqueName, { timeout: 20000 });

    // 5. Add Participants
    const addParticipant = async (name: string, email: string, phone: string) => {
      await page.getByRole("button", { name: /\+ Participante/i }).click();
      await page.locator("#part_name").waitFor({ state: "visible", timeout: 10000 });
      await page.locator("#part_name").fill(name);
      await page.locator("#part_email").fill(email);
      await page.locator("#part_phone").fill(phone);
      await page.locator('button[type="submit"]:has-text("Agregar Participante")').click();
      await page.locator("#part_name").waitFor({ state: "hidden", timeout: 15000 });
    };

    await addParticipant("Juan Pérez", "juan.perez@example.com", "8095550102");
    await addParticipant("Pedro Rosario", "pedro.rosario@example.com", "8095550103");
    await addParticipant("María Santos", "maria.santos@example.com", "8095550104");

    // 6. Add Expense 1: Villa (RD$ 15,000) paid by Juan split equally
    await page.getByRole("button", { name: /\+ Gasto/i }).click();
    await page.locator("#exp_desc").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#exp_desc").fill("Alquiler de Villa");
    await page.locator("#exp_amount").fill("15000");
    await page.locator('button[type="submit"]:has-text("Guardar Gasto")').click();
    await page.locator("#exp_desc").waitFor({ state: "hidden", timeout: 15000 });

    // 7. Add Expense 2: Supermercado (RD$ 6,000) paid by Pedro split equally
    await page.getByRole("button", { name: /\+ Gasto/i }).click();
    await page.locator("#exp_desc").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#exp_desc").fill("Supermercado y Carnes");
    await page.locator("#exp_amount").fill("6000");
    await page.locator("#exp_payer").selectOption({ label: "Pedro Rosario" });
    await page.locator('button[type="submit"]:has-text("Guardar Gasto")').click();
    await page.locator("#exp_desc").waitFor({ state: "hidden", timeout: 15000 });

    // 8. Verify Balances Tab
    await page.getByRole("button", { name: /Balances/i }).click();
    await expect(page.getByText(/Total del Serrucho/i)).toBeVisible();
    await expect(page.getByText(/21,000.00/i)).toBeVisible();

    // 9. Close Serrucho Wizard
    await page.getByRole("button", { name: /Cerrar Serrucho/i }).first().click();

    // Fill in payment info
    await page.locator("#close_instructions").waitFor({ state: "visible", timeout: 10000 });
    await page
      .locator("#close_instructions")
      .fill("Transferir por Banco BHD a la cuenta 1234567890 o tPago al 809-555-0102");
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button[type="submit"]:has-text("Cerrar Serrucho Definitivamente")').click();

    // 10. Verify Closed State View & Immutable Snapshots
    await expect(page.getByText(/Serrucho Cerrado y Congelado/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Cuentas Inmutables/i).first()).toBeVisible();

    // 11. Click on "Ver Estado" for the first participant to open public receipt
    const viewStateButtons = page.getByRole("link", { name: /Ver Estado/i });
    const firstStateUrl = await viewStateButtons.first().getAttribute("href");
    expect(firstStateUrl).toContain("/s/");

    await page.goto(firstStateUrl!);
    await expect(page.getByText(/Estado de Cuenta Individual/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Banco BHD/i)).toBeVisible({ timeout: 20000 });
  });
});
