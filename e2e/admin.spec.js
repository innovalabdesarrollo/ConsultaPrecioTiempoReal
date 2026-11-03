import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), 'apps/api/.env') });

async function loginAdmin(page) {
	const adminToken = process.env.ADMIN_TOKEN;
	test.skip(!adminToken, 'ADMIN_TOKEN no definido en apps/api/.env');
	expect(adminToken.length).toBeGreaterThan(7);

	await page.addInitScript(() => {
		localStorage.removeItem('cpt_admin_token');
	});

	await page.goto('/admin', { waitUntil: 'networkidle' });
	await expect(page.getByRole('heading', { name: /proveedores/i })).toBeVisible();
	await expect(page.locator('#token')).toBeVisible();
	// Esperar hidratación Svelte (handlers onsubmit)
	await page.waitForTimeout(400);

	const respPromise = page.waitForResponse(
		(r) => r.url().includes('/api/admin/proveedores') && r.request().method() === 'GET',
		{ timeout: 15_000 }
	);

	await page.evaluate((tok) => {
		const input = document.getElementById('token');
		const form = input?.closest('form');
		if (!input || !form) throw new Error('formulario admin no encontrado');
		input.value = tok;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		form.requestSubmit();
	}, adminToken);

	const resp = await respPromise;
	expect(resp.status()).toBe(200);
}

test.describe('Admin proveedores', () => {
	test('entra con token y lista proveedores', async ({ page }) => {
		await loginAdmin(page);
		await expect(page.getByRole('button', { name: /Nuevo/i })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole('button', { name: /Proveedor principal/i })).toBeVisible();
		await expect(page.getByPlaceholder(/nombre para identificarlo/i)).toBeVisible();
	});

	test('puede probar conexión del proveedor seleccionado', async ({ page }) => {
		await loginAdmin(page);
		await page.getByRole('button', { name: /Proveedor principal/i }).click();
		const probarPromise = page.waitForResponse((r) => r.url().includes('/probar'), {
			timeout: 15_000
		});
		await page.getByRole('button', { name: /^Probar$/i }).click();
		expect((await probarPromise).ok()).toBeTruthy();
		await expect(page.getByText('Conexión exitosa', { exact: true })).toBeVisible({
			timeout: 10_000
		});


	});
});
