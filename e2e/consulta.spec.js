import { expect, test } from '@playwright/test';

test.describe('Consulta de precio', () => {
	test('home carga y muestra proveedores', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /precio en tiempo real/i })).toBeVisible();
		await expect(page.locator('#proveedor')).toBeVisible();
		await expect(page.locator('#proveedor option')).not.toHaveCount(0);
	});

	test('busca por código SKU-1001 y muestra precio', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#proveedor option')).not.toHaveCount(0);

		const value = await page
			.locator('#proveedor option')
			.filter({ hasText: 'Proveedor principal' })
			.first()
			.getAttribute('value');
		await page.locator('#proveedor').selectOption(value);

		await page.locator('#tipo').selectOption('codigo');
		await page.locator('#termino').fill('SKU-1001');

		const respPromise = page.waitForResponse(
			(r) => r.url().includes('/api/consultas') && r.request().method() === 'POST'
		);
		await page.getByRole('button', { name: /consultar/i }).click();
		const resp = await respPromise;
		expect(resp.ok()).toBeTruthy();

		await expect(page.getByRole('heading', { name: /Tornillo hexagonal M8x40/i })).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByText(/2\.45/)).toBeVisible();
		await expect(page.getByText(/^Disponible$/i).first()).toBeVisible();
	});

	test('palabra clave tornillo trae varios resultados', async ({ page }) => {
		await page.goto('/');
		await page.locator('#tipo').selectOption('palabra_clave');
		await page.locator('#termino').fill('tornillo');
		await page.getByRole('button', { name: /consultar/i }).click();

		await expect(page.getByText(/2 resultados/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole('heading', { name: /Tornillo hexagonal/i }).first()).toBeVisible();
	});

	test('producto inexistente muestra mensaje', async ({ page }) => {
		await page.goto('/');
		await page.locator('#termino').fill('xyz-no-existe-999');
		await page.getByRole('button', { name: /consultar/i }).click();

		await expect(page.getByText(/no se encontró el producto/i)).toBeVisible({ timeout: 15_000 });
	});
});
