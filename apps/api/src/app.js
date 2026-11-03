import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import { ensureBootstrapFromEnv } from './bootstrapConfig.js';
import { getRawConfig, listProveedoresPublicos, publicConfig } from './configService.js';
import { connectDb } from './db.js';
import { adminAuth } from './middleware/adminAuth.js';
import { adminRouter } from './routes/admin.js';
import { consultasRouter } from './routes/consultas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, 'apps/api/.env') });

let readyPromise;

export function getEnv() {
	return {
		PORT: Number(process.env.PORT),
		MONGODB_URI: process.env.MONGODB_URI,
		CREDENTIALS_SECRET: process.env.CREDENTIALS_SECRET,
		ADMIN_TOKEN: process.env.ADMIN_TOKEN,
		IS_VERCEL: Boolean(process.env.VERCEL)
	};
}

export function assertEnv({ requirePort = false } = {}) {
	const { MONGODB_URI, CREDENTIALS_SECRET, ADMIN_TOKEN, PORT, IS_VERCEL } = getEnv();
	const missing = [];
	if (!MONGODB_URI) missing.push('MONGODB_URI');
	if (!CREDENTIALS_SECRET || CREDENTIALS_SECRET.length < 16) {
		missing.push('CREDENTIALS_SECRET (>=16 chars)');
	}
	if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 8) missing.push('ADMIN_TOKEN (>=8 chars)');
	if (requirePort && !IS_VERCEL && (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535)) {
		missing.push('PORT (entero 1–65535 en .env)');
	}
	if (missing.length) {
		const msg = `Faltan variables de entorno: ${missing.join(', ')}`;
		const err = new Error(msg);
		err.status = 500;
		throw err;
	}
}

function buildApp() {
	const { CREDENTIALS_SECRET, ADMIN_TOKEN, PORT, IS_VERCEL } = getEnv();
	assertEnv({ requirePort: !IS_VERCEL });

	const app = express();
	app.use(cors({ origin: true }));
	app.use(express.json({ limit: '100kb' }));

	app.get('/api/health', async (_req, res) => {
		try {
			const raw = await getRawConfig();
			const cfg = publicConfig(raw);
			const lista = await listProveedoresPublicos();
			res.json({
				ok: true,
				service: 'consulta-precio-api',
				port: PORT || null,
				vercel: IS_VERCEL,
				proveedores: lista.length,
				proveedor: cfg
					? {
							id: cfg.id,
							nombre: cfg.nombre,
							tipo: cfg.tipoProveedor,
							configurado: cfg.tienePassword && Boolean(cfg.usuario),
							operativo: cfg.operativo
						}
					: null
			});
		} catch {
			res.json({ ok: true, service: 'consulta-precio-api', port: PORT || null });
		}
	});

	app.get('/api/proveedores', async (_req, res) => {
		try {
			res.json({ items: await listProveedoresPublicos() });
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'No se pudo listar proveedores' });
		}
	});

	app.use('/api/consultas', consultasRouter(CREDENTIALS_SECRET));
	app.use('/api/admin', adminAuth(ADMIN_TOKEN), adminRouter(CREDENTIALS_SECRET));

	app.use((err, _req, res, _next) => {
		console.error(err);
		res.status(500).json({ error: 'Error interno' });
	});

	return app;
}

/** App Express + DB lista (local y Vercel). */
export async function getApp() {
	if (!readyPromise) {
		readyPromise = (async () => {
			const { MONGODB_URI, CREDENTIALS_SECRET } = getEnv();
			assertEnv({ requirePort: !getEnv().IS_VERCEL });
			await connectDb(MONGODB_URI);
			await ensureBootstrapFromEnv(CREDENTIALS_SECRET);
			return buildApp();
		})();
	}
	return readyPromise;
}
