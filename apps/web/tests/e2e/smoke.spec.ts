import { test, expect } from "@playwright/test";

test.describe("Serrucho MVP End-to-End Flow", () => {
  test("complete smoke test: landing -> calculator -> dashboard -> create -> participants -> expenses -> balance -> debt simplification -> close -> mark paid -> public receipt", async ({
    page,
  }) => {
    test.setTimeout(90000);

    // 1. Visit landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/Serrucho/i);
    await expect(page.locator("h1")).toBeVisible();

    // 2. Test Quick Split Calculator
    await page.goto("/calculadora");
    await expect(page.getByText(/Calculadora de Cuenta Dominicana/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/18% ITBIS/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/10% Ley/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Le toca a cada uno/i).first()).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Dashboard & Click "Nuevo Serrucho"
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Nuevo Serrucho/i }).first().click();

    // 4. Fill in serrucho details in modal
    const uniqueName = `Playa 2026 Smoke ${Date.now()}`;
    await page.locator("#name").fill(uniqueName);
    await page.locator("#description").fill("Viaje de amigos a la playa de Las Terrenas");
    await page.locator('button[type="submit"]:has-text("Crear Serrucho")').click();

    // 5. Should navigate into the new serrucho workspace
    await page.waitForURL(/\/dashboard\/.+/, { timeout: 20000 });
    await expect(page.locator("h1")).toContainText(uniqueName, { timeout: 20000 });

    // 6. Add Participants
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

    // 7. Add Expense 1: Villa (RD$ 15,000) paid by Juan split equally
    await page.getByRole("button", { name: /\+ Gasto/i }).click();
    await page.locator("#exp_desc").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#exp_desc").fill("Alquiler de Villa");
    await page.locator("#exp_amount").fill("15000");
    await page.locator('button[type="submit"]:has-text("Guardar Gasto")').click();
    await page.locator("#exp_desc").waitFor({ state: "hidden", timeout: 15000 });

    // 8. Add Expense 2: Supermercado (RD$ 6,000) paid by Pedro split equally
    await page.getByRole("button", { name: /\+ Gasto/i }).click();
    await page.locator("#exp_desc").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#exp_desc").fill("Supermercado y Carnes");
    await page.locator("#exp_amount").fill("6000");
    await page.locator("#exp_payer").selectOption({ label: "Pedro Rosario" });
    await page.locator('button[type="submit"]:has-text("Guardar Gasto")').click();
    await page.locator("#exp_desc").waitFor({ state: "hidden", timeout: 15000 });

    // 9. Verify Balances Tab & Debt Simplification
    await page.getByRole("button", { name: /Balances/i }).click();
    await expect(page.getByText(/Total del Serrucho/i)).toBeVisible();
    await expect(page.getByText(/21,000.00/i).first()).toBeVisible();
    await expect(page.getByText(/Menos Transferencias/i)).toBeVisible();

    // 10. Close Serrucho Wizard
    await page.getByRole("button", { name: /Cerrar Serrucho/i }).first().click();

    // Fill in payment info
    await page.locator("#close_instructions").waitFor({ state: "visible", timeout: 10000 });
    await page
      .locator("#close_instructions")
      .fill("Transferir por Banco BHD a la cuenta 1234567890 o tPago al 809-555-0102");
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button[type="submit"]:has-text("Cerrar Serrucho Definitivamente")').click();

    // 11. Verify Closed State View, Debt Simplification & Snapshots
    await expect(page.getByText(/Serrucho Cerrado y Congelado/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Menos Transferencias/i)).toBeVisible();

    // 12. Test "Marcar Pagado" toggle on first debtor
    const markPaidBtn = page.getByRole("button", { name: /Marcar Pagado/i }).first();
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await expect(page.getByText(/Transferencia Recibida/i).first()).toBeVisible();
    }

    // 13. Click on "Ver Comprobante" for the first participant to open public receipt
    const viewButtons = page.getByRole("link", { name: /Ver Comprobante/i });
    await expect(viewButtons.first()).toBeVisible({ timeout: 15000 });
    const firstStateUrl = await viewButtons.first().getAttribute("href");
    expect(firstStateUrl).toContain("/s/");

    await page.goto(firstStateUrl!);
    await expect(page.getByText(/Estado de Cuenta Individual/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Resumen Financiero/i)).toBeVisible({ timeout: 20000 });
  });
});
