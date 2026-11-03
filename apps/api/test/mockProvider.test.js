import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mockProvider } from '../src/providers/mock.js';

describe('mockProvider', () => {
	it('rechaza login sin credenciales', async () => {
		const r = await mockProvider.login({});
		assert.equal(r.ok, false);
	});

	it('rechaza login inválido', async () => {
		const r = await mockProvider.login({ usuario: 'x', password: 'y' });
		assert.equal(r.ok, false);
	});

	it('login demo y busca por código', async () => {
		const login = await mockProvider.login({ usuario: 'demo', password: 'demo' });
		assert.equal(login.ok, true);
		assert.ok(login.token);

		const search = await mockProvider.search('SKU-1001', 'codigo');
		assert.equal(search.ok, true);
		assert.equal(search.productos.length, 1);
		assert.equal(search.productos[0].codigoProducto, 'SKU-1001');
		assert.equal(typeof search.productos[0].precio, 'number');
		assert.equal(typeof search.productos[0].disponible, 'boolean');
	});

	it('palabra clave ambigua devuelve varios', async () => {
		await mockProvider.login({ usuario: 'demo', password: 'demo' });
		const search = await mockProvider.search('tornillo', 'palabra_clave');
		assert.equal(search.ok, true);
		assert.ok(search.productos.length >= 2);
	});

	it('no encontrado devuelve lista vacía', async () => {
		await mockProvider.login({ usuario: 'demo', password: 'demo' });
		const search = await mockProvider.search('xyz-no-existe-999', 'palabra_clave');
		assert.equal(search.ok, true);
		assert.equal(search.productos.length, 0);
	});
});
