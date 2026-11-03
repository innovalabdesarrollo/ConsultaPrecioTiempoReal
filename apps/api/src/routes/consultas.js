import { Router } from 'express';
import { consultar } from '../consultaService.js';

export function consultasRouter(secret) {
	const router = Router();

	router.post('/', async (req, res) => {
		try {
			const { termino, tipoBusqueda, proveedorId } = req.body || {};
			const result = await consultar(termino, tipoBusqueda, secret, proveedorId);
			if (!result.ok) {
				return res.status(result.status || 400).json({
					error: result.error,
					consultaId: result.consultaId || null
				});
			}
			return res.json(result);
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Error interno al consultar' });
		}
	});

	return router;
}
