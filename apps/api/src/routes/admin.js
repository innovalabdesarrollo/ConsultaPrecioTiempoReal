import { Router } from 'express';
import {
	activarProveedor,
	deleteProveedor,
	getRawConfig,
	listAudit,
	listProveedores,
	publicConfig,
	revertConfig,
	saveConfig,
	saveProveedor,
	testConfig
} from '../configService.js';

export function adminRouter(secret) {
	const router = Router();

	router.get('/proveedores', async (_req, res) => {
		try {
			res.json({ items: await listProveedores() });
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'No se pudo listar proveedores' });
		}
	});

	router.post('/proveedores', async (req, res) => {
		try {
			const saved = await saveProveedor(req.body || {}, secret);
			res.status(201).json(saved);
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al crear' });
		}
	});

	router.put('/proveedores/:id', async (req, res) => {
		try {
			const saved = await saveProveedor({ ...(req.body || {}), id: req.params.id }, secret);
			res.json(saved);
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al guardar' });
		}
	});

	router.post('/proveedores/:id/activar', async (req, res) => {
		try {
			res.json(await activarProveedor(req.params.id));
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al activar' });
		}
	});

	router.delete('/proveedores/:id', async (req, res) => {
		try {
			res.json(await deleteProveedor(req.params.id));
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al eliminar' });
		}
	});

	router.post('/proveedores/:id/probar', async (req, res) => {
		try {
			const result = await testConfig(secret, { ...(req.body || {}), proveedorId: req.params.id });
			if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
			res.json({ ok: true, expiraEn: result.expiraEn || null });
		} catch (err) {
			res.status(500).json({ ok: false, error: err.message || 'Error al probar' });
		}
	});

	router.post('/proveedores/:id/revertir', async (req, res) => {
		try {
			res.json(await revertConfig(req.params.id));
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al revertir' });
		}
	});

	// Compat rutas anteriores (operan sobre el proveedor activo)
	router.get('/config', async (_req, res) => {
		try {
			const doc = await getRawConfig();
			res.json(publicConfig(doc) || { configurado: false });
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'No se pudo leer la configuración' });
		}
	});

	router.put('/config', async (req, res) => {
		try {
			res.json(await saveConfig(req.body || {}, secret));
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al guardar' });
		}
	});

	router.post('/config/probar', async (req, res) => {
		try {
			const result = await testConfig(secret, req.body || {});
			if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
			res.json({ ok: true, expiraEn: result.expiraEn || null });
		} catch (err) {
			res.status(500).json({ ok: false, error: err.message || 'Error al probar' });
		}
	});

	router.post('/config/revertir', async (_req, res) => {
		try {
			res.json(await revertConfig(null));
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message || 'Error al revertir' });
		}
	});

	router.get('/auditoria', async (_req, res) => {
		try {
			res.json({ items: await listAudit(40) });
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'No se pudo leer auditoría' });
		}
	});

	return router;
}
