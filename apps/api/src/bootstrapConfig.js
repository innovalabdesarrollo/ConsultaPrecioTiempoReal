import { randomUUID } from 'node:crypto';
import { encrypt } from './crypto.js';
import { hasConfiguredProveedor, insertBootstrappedProveedor } from './configService.js';

/**
 * Si aún no hay proveedores, crea el primero desde PROVIDER_* del .env.
 * No sobrescribe proveedores ya guardados.
 */
export async function ensureBootstrapFromEnv(secret) {
	if (await hasConfiguredProveedor()) {
		return { seeded: false, reason: 'ya_configurado' };
	}

	const tipo = (process.env.PROVIDER_TIPO || 'mock').trim().toLowerCase();
	const baseUrl = (process.env.PROVIDER_BASE_URL || '').trim();
	const nombre =
		(process.env.PROVIDER_NOMBRE || '').trim() ||
		(tipo === 'mock' ? 'Demo local' : 'Proveedor principal');
	const usuario = (process.env.PROVIDER_USUARIO || '').trim() || (tipo === 'mock' ? 'demo' : '');
	const password =
		(process.env.PROVIDER_PASSWORD || '').trim() || (tipo === 'mock' ? 'demo' : '');

	if (!['mock', 'http'].includes(tipo)) {
		console.warn(`[bootstrap] PROVIDER_TIPO inválido (${tipo}); se omite`);
		return { seeded: false, reason: 'tipo_invalido' };
	}
	if (tipo === 'http' && !baseUrl) {
		console.warn('[bootstrap] PROVIDER_BASE_URL requerida para tipo http; se omite');
		return { seeded: false, reason: 'sin_base_url' };
	}
	if (!usuario || !password) {
		console.warn('[bootstrap] Faltan PROVIDER_USUARIO / PROVIDER_PASSWORD; se omite');
		return { seeded: false, reason: 'sin_creds' };
	}

	const id = randomUUID();
	const doc = {
		id,
		nombre,
		activo: true,
		version: 1,
		tipoProveedor: tipo,
		baseUrl: tipo === 'http' ? baseUrl : '',
		usuario,
		passwordEnc: encrypt(password, secret),
		tokenSesionEnc: '',
		tokenExpiraEn: null,
		operativo: true,
		actualizadoEn: new Date(),
		anterior: null,
		origenBootstrap: 'env'
	};

	await insertBootstrappedProveedor(doc);
	console.log(
		`[bootstrap] Proveedor "${nombre}" listo (tipo=${tipo}). Agrega más en /admin solo con nombre + URL + credenciales.`
	);
	return { seeded: true, tipo, id };
}
