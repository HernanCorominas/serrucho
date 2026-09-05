import { test, expect } from "@playwright/test";

test.describe("Serrucho MVP End-to-End Flow", () => {
  test("complete smoke test: landing -> calculator -> dashboard -> create -> participants -> expenses -> balance -> debt simplification -> close -> mark paid -> public receipt", async ({
    page,
  }) => {
    test.setTimeout(120000);

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

    // 3. Navigate directly to Dashboard with ?new=true to open the create modal
    await page.goto("/dashboard?new=true");
    await page.waitForLoadState("domcontentloaded");

    // 4. Fill in serrucho details in 4-step wizard modal
    const uniqueName = `Playa 2026 Smoke ${Date.now()}`;

    // Step 1: Name & Description — wait for dialog to open after useEffect fires
    await page.locator("#step1_name").waitFor({ state: "visible", timeout: 20000 });
    await page.locator("#step1_name").fill(uniqueName);
    await page.locator("#step1_desc").fill("Viaje de amigos a la playa de Las Terrenas");
    await page.getByRole("button", { name: /Siguiente/i }).click();

    // Step 2: Owner / Creator info
    await page.locator("#step2_creator_name").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#step2_creator_name").fill("Juan QA");
    await page.locator("#step2_creator_email").fill("juan.qa@example.com");
    await page.getByRole("button", { name: /Siguiente/i }).click();

    // Step 3: Add initial participants
    const pInput = page.locator('input[placeholder*="Nombre del amigo"]');
    await pInput.waitFor({ state: "visible", timeout: 15000 });
    await pInput.fill("Pedro Rosario");
    await page.locator('button:has-text("Agregar")').click();
    await expect(page.getByText("Pedro Rosario")).toBeVisible({ timeout: 5000 });

    await pInput.fill("María Santos");
    await page.locator('button:has-text("Agregar")').click();
    await expect(page.getByText("María Santos")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /Revisar Resumen/i }).click();

    // Step 4: Confirm and submit
    const submitBtn = page.getByRole("button", { name: /Confirmar y Crear Serrucho/i });
    await submitBtn.waitFor({ state: "visible", timeout: 15000 });

    // Set up the response interceptor BEFORE clicking
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/serruchos") && resp.request().method() === "POST",
      { timeout: 30000 }
    );

    await submitBtn.click();

    // Wait for the API response
    const response = await responsePromise;
    if (![200, 201].includes(response.status())) {
      console.log("POST /api/serruchos FAILED with status:", response.status());
      console.log("Response text:", await response.text());
    }
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    const serruchoId = body.id;
    expect(serruchoId).toBeTruthy();

    // 5. Should navigate into the new serrucho workspace
    // Next.js router.push does client-side navigation — wait for URL to update
    await page.waitForURL(`**/dashboard/${serruchoId}`, { timeout: 30000 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(uniqueName, { timeout: 20000 });

    // 6. Add Additional Participant from workspace page
    const addParticipant = async (name: string, email: string, phone: string) => {
      await page.getByRole("button", { name: "+ Integrante" }).first().click();
      await page.locator("#part_name").waitFor({ state: "visible", timeout: 10000 });
      await page.locator("#part_name").fill(name);
      await page.locator("#part_email").fill(email);
      await page.locator("#part_phone").fill(phone);
      await page.getByRole("button", { name: "Agregar Participante", exact: true }).click();
      await page.locator("#part_name").waitFor({ state: "hidden", timeout: 15000 });
    };

    await addParticipant("Carlos QA", "carlos.qa@example.com", "8095550104");

    // 7. Add Expense 1: Villa (RD$ 15,000) paid by Juan split equally
    await page.getByRole("button", { name: "+ Añadir Gasto" }).first().click();
    await page.locator("#exp_desc").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#exp_desc").fill("Alquiler de Villa");
    await page.locator("#exp_amount").fill("15000");
    await page.getByRole("button", { name: "Guardar Gasto", exact: true }).click();
    await page.locator("#exp_desc").waitFor({ state: "hidden", timeout: 15000 });

    // 8. Add Expense 2: Supermercado (RD$ 6,000) paid by Pedro split equally
    await page.getByRole("button", { name: "+ Añadir Gasto" }).first().click();
    await page.locator("#exp_desc").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#exp_desc").fill("Supermercado y Carnes");
    await page.locator("#exp_amount").fill("6000");
    await page.locator("#exp_payer").selectOption({ label: "Pedro Rosario" });
    await page.getByRole("button", { name: "Guardar Gasto", exact: true }).click();
    await page.locator("#exp_desc").waitFor({ state: "hidden", timeout: 15000 });

    // 9. Verify Balances Tab & Debt Simplification
    await page.getByRole("button", { name: /Balances/i }).click();
    await expect(page.getByText(/Total del Serrucho/i)).toBeVisible();
    await expect(page.getByText(/21,000.00/i).first()).toBeVisible();
    await expect(page.getByText(/Menos Transferencias/i)).toBeVisible();

    // 10. Close Serrucho Wizard
    await page.getByRole("button", { name: "Liquidar" }).first().click();

    // Fill in payment info
    await page.locator("#close_instructions").waitFor({ state: "visible", timeout: 10000 });
    await page
      .locator("#close_instructions")
      .fill("Transferir por Banco BHD a la cuenta 1234567890 o tPago al 809-555-0102");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Cerrar Serrucho Definitivamente", exact: true }).click();

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
    await expect(page.getByText(/Comprobante de Liquidación/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Estado de Cuenta/i).first()).toBeVisible({ timeout: 20000 });
  });
});
