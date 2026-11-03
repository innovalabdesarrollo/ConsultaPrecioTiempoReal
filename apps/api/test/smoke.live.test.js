/**
 * Smoke contra API local si está arriba. Si no hay servidor, se omite (no falla el suite).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const PORT = Number(process.env.PORT || 3001);
const BASE = `http://127.0.0.1:${PORT}`;

async function apiUp() {
	try {
		const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
		if (!res.ok) return false;
		const j = await res.json();
		return j.service === 'consulta-precio-api';
	} catch {
		return false;
	}
}

describe('smoke live API', async () => {
	const up = await apiUp();

	it('health + proveedores + consulta (si API vive)', async (t) => {
		if (!up) {
			t.skip('API no está en el PORT del .env — omitido');
			return;
		}

		const health = await (await fetch(`${BASE}/api/health`)).json();
		assert.equal(health.ok, true);
		assert.ok(health.proveedores >= 1);

		const prov = await (await fetch(`${BASE}/api/proveedores`)).json();
		assert.ok(Array.isArray(prov.items));
		assert.ok(prov.items.length >= 1);
		const id = (prov.items.find((p) => p.activo) || prov.items[0]).id;

		const res = await fetch(`${BASE}/api/consultas`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ termino: 'SKU-1001', tipoBusqueda: 'codigo', proveedorId: id })
		});
		const data = await res.json();
		assert.equal(res.status, 200);
		assert.equal(data.ok, true);
		assert.equal(data.encontrados, 1);
		assert.equal(data.resultados[0].codigoProducto, 'SKU-1001');
	});
});
