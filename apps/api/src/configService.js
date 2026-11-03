import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { decrypt, encrypt, maskSecret } from './crypto.js';
import { getProvider } from './providers/index.js';

const COL = 'proveedores';
const LEGACY_ACTIVA = 'activa';
const LEGACY_PREV = 'anterior';

export function publicConfig(doc) {
	if (!doc) return null;
	return {
		id: doc.id,
		nombre: doc.nombre || 'Proveedor',
		activo: Boolean(doc.activo),
		version: doc.version || 1,
		tipoProveedor: doc.tipoProveedor || 'mock',
		baseUrl: doc.baseUrl || '',
		usuario: doc.usuario || '',
		passwordMasked: doc.passwordEnc ? maskSecret('********') : '',
		tienePassword: Boolean(doc.passwordEnc),
		tieneSesion: Boolean(doc.tokenSesionEnc),
		tokenExpiraEn: doc.tokenExpiraEn || null,
		operativo: doc.operativo !== false,
		actualizadoEn: doc.actualizadoEn || null
	};
}

export function publicProveedorLite(doc) {
	return {
		id: doc.id,
		nombre: doc.nombre || 'Proveedor',
		activo: Boolean(doc.activo),
		tipoProveedor: doc.tipoProveedor || 'mock',
		operativo: doc.operativo !== false,
		configurado: Boolean(doc.passwordEnc && doc.usuario)
	};
}

async function audit(accion, detalle, version, proveedorId) {
	const db = getDb();
	await db.collection('auditConfig').insertOne({
		id: randomUUID(),
		accion,
		detalle,
		version: version || 1,
		proveedorId: proveedorId || null,
		creadoEn: new Date()
	});
}

/** Migra el documento legacy `_id: activa` a la colección multi-proveedor. */
export async function migrateLegacyIfNeeded() {
	const db = getDb();
	const count = await db.collection(COL).countDocuments({});
	if (count > 0) return { migrated: false };

	const legacy = await db.collection('configProveedor').findOne({ _id: LEGACY_ACTIVA });
	if (!legacy?.usuario || !legacy?.passwordEnc) return { migrated: false };

	const id = randomUUID();
	const doc = {
		id,
		nombre: 'Proveedor principal',
		activo: true,
		version: legacy.version || 1,
		tipoProveedor: legacy.tipoProveedor || 'mock',
		baseUrl: legacy.baseUrl || '',
		usuario: legacy.usuario,
		passwordEnc: legacy.passwordEnc,
		tokenSesionEnc: legacy.tokenSesionEnc || '',
		tokenExpiraEn: legacy.tokenExpiraEn || null,
		operativo: legacy.operativo !== false,
		actualizadoEn: legacy.actualizadoEn || new Date(),
		anterior: null
	};
	await db.collection(COL).insertOne(doc);
	await audit('migrar', 'Config legacy migrada a multi-proveedor', doc.version, id);
	return { migrated: true, id };
}

export async function listProveedores() {
	await migrateLegacyIfNeeded();
	const db = getDb();
	const items = await db.collection(COL).find({}).sort({ nombre: 1 }).toArray();
	return items.map(publicConfig);
}

export async function listProveedoresPublicos() {
	await migrateLegacyIfNeeded();
	const db = getDb();
	const items = await db
		.collection(COL)
		.find({ operativo: { $ne: false } })
		.sort({ nombre: 1 })
		.toArray();
	return items.map(publicProveedorLite);
}

export async function getProveedorById(id) {
	await migrateLegacyIfNeeded();
	const db = getDb();
	if (id) {
		const doc = await db.collection(COL).findOne({ id });
		if (!doc) throw Object.assign(new Error('Proveedor no encontrado'), { status: 404 });
		return doc;
	}
	const activo = await db.collection(COL).findOne({ activo: true });
	if (activo) return activo;
	const first = await db.collection(COL).findOne({});
	return first || null;
}

/** Compat: config activa. */
export async function getRawConfig() {
	return (await getProveedorById(null)) || null;
}

function resolveCreds(doc, secret, overridePassword) {
	let password = '';
	if (overridePassword !== undefined && overridePassword !== '') {
		password = overridePassword;
	} else if (doc.passwordEnc) {
		password = decrypt(doc.passwordEnc, secret);
	}
	return { usuario: doc.usuario || '', password };
}

function validateInput(next) {
	if (!next.nombre?.trim()) {
		throw Object.assign(new Error('Nombre del proveedor requerido'), { status: 400 });
	}
	if (!['mock', 'http'].includes(next.tipoProveedor)) {
		throw Object.assign(new Error('tipoProveedor inválido (mock|http)'), { status: 400 });
	}
	if (next.tipoProveedor === 'http' && !next.baseUrl) {
		throw Object.assign(new Error('baseUrl requerida para proveedor http'), { status: 400 });
	}
	if (!next.usuario) {
		throw Object.assign(new Error('usuario requerido'), { status: 400 });
	}
}

export async function saveProveedor(input, secret) {
	const db = getDb();
	await migrateLegacyIfNeeded();

	const isNew = !input.id;
	const actual = isNew ? null : await getProveedorById(input.id);
	if (!isNew && !actual) {
		throw Object.assign(new Error('Proveedor no encontrado'), { status: 404 });
	}

	const count = await db.collection(COL).countDocuments({});
	const makeActivo = isNew ? count === 0 || Boolean(input.activar) : Boolean(actual.activo);

	const next = {
		id: isNew ? randomUUID() : actual.id,
		nombre: input.nombre !== undefined ? String(input.nombre).trim() : actual.nombre,
		activo: makeActivo,
		version: (actual?.version || 0) + 1,
		tipoProveedor: input.tipoProveedor || actual?.tipoProveedor || 'http',
		baseUrl: input.baseUrl !== undefined ? String(input.baseUrl).trim() : actual?.baseUrl || '',
		usuario: input.usuario !== undefined ? String(input.usuario).trim() : actual?.usuario || '',
		passwordEnc: actual?.passwordEnc || '',
		tokenSesionEnc: actual?.tokenSesionEnc || '',
		tokenExpiraEn: actual?.tokenExpiraEn || null,
		operativo:
			input.operativo !== undefined ? Boolean(input.operativo) : actual?.operativo !== false,
		actualizadoEn: new Date(),
		anterior: actual
			? {
					nombre: actual.nombre,
					tipoProveedor: actual.tipoProveedor,
					baseUrl: actual.baseUrl,
					usuario: actual.usuario,
					passwordEnc: actual.passwordEnc,
					tokenSesionEnc: actual.tokenSesionEnc,
					tokenExpiraEn: actual.tokenExpiraEn,
					operativo: actual.operativo,
					version: actual.version
				}
			: null
	};

	if (input.password !== undefined && input.password !== '') {
		next.passwordEnc = encrypt(input.password, secret);
		next.tokenSesionEnc = '';
		next.tokenExpiraEn = null;
	}

	validateInput(next);

	if (next.activo) {
		await db.collection(COL).updateMany({ id: { $ne: next.id } }, { $set: { activo: false } });
	}

	await db.collection(COL).replaceOne({ id: next.id }, next, { upsert: true });
	await audit(isNew ? 'crear' : 'guardar', `${next.nombre} v${next.version}`, next.version, next.id);
	return publicConfig(next);
}

/** Compat con PUT /config (actualiza el activo). */
export async function saveConfig(input, secret) {
	const activo = await getProveedorById(null);
	return saveProveedor(
		{
			id: activo?.id,
			nombre: input.nombre || activo?.nombre || 'Proveedor principal',
			...input
		},
		secret
	);
}

export async function activarProveedor(id) {
	const db = getDb();
	const doc = await getProveedorById(id);
	await db.collection(COL).updateMany({}, { $set: { activo: false } });
	await db.collection(COL).updateOne(
		{ id: doc.id },
		{ $set: { activo: true, actualizadoEn: new Date() } }
	);
	await audit('activar', `Activo: ${doc.nombre}`, doc.version, doc.id);
	return publicConfig({ ...doc, activo: true });
}

export async function deleteProveedor(id) {
	const db = getDb();
	const doc = await getProveedorById(id);
	const count = await db.collection(COL).countDocuments({});
	if (count <= 1) {
		throw Object.assign(new Error('Debe quedar al menos un proveedor'), { status: 400 });
	}
	await db.collection(COL).deleteOne({ id: doc.id });
	if (doc.activo) {
		const otro = await db.collection(COL).findOne({});
		if (otro) {
			await db.collection(COL).updateOne({ id: otro.id }, { $set: { activo: true } });
		}
	}
	await audit('eliminar', `Eliminado: ${doc.nombre}`, doc.version, doc.id);
	return { ok: true };
}

export async function revertConfig(proveedorId) {
	const doc = await getProveedorById(proveedorId || null);
	if (!doc?.anterior) {
		throw Object.assign(new Error('No hay configuración anterior para revertir'), { status: 404 });
	}
	const restored = {
		...doc,
		...doc.anterior,
		id: doc.id,
		activo: doc.activo,
		version: (doc.version || 1) + 1,
		actualizadoEn: new Date(),
		anterior: null
	};
	const db = getDb();
	await db.collection(COL).replaceOne({ id: doc.id }, restored);
	await audit('revertir', `Revertido ${restored.nombre} v${restored.version}`, restored.version, doc.id);
	return publicConfig(restored);
}

export async function testConfig(secret, overrides = {}) {
	const doc = await getProveedorById(overrides.proveedorId || overrides.id || null);
	if (!doc) {
		return { ok: false, error: 'No hay proveedor configurado' };
	}
	const merged = {
		...doc,
		tipoProveedor: overrides.tipoProveedor || doc.tipoProveedor,
		baseUrl: overrides.baseUrl !== undefined ? overrides.baseUrl : doc.baseUrl,
		usuario: overrides.usuario !== undefined ? overrides.usuario : doc.usuario
	};
	const creds = resolveCreds(merged, secret, overrides.password);
	if (overrides.usuario) creds.usuario = overrides.usuario;

	const provider = getProvider(merged.tipoProveedor);
	const result = await provider.testConnection(creds, merged);

	if (result.ok && result.token) {
		const db = getDb();
		await db.collection(COL).updateOne(
			{ id: doc.id },
			{
				$set: {
					tokenSesionEnc: encrypt(result.token, secret),
					tokenExpiraEn: result.expiraEn || null,
					actualizadoEn: new Date()
				}
			}
		);
		await audit('probar', 'Conexión exitosa; sesión actualizada', doc.version || 1, doc.id);
	} else {
		await audit('probar', `Fallo: ${result.error || 'desconocido'}`, doc.version || 1, doc.id);
	}

	return result;
}

export async function withProviderSession(secret, proveedorId) {
	const doc = await getProveedorById(proveedorId || null);
	if (!doc) {
		return { ok: false, error: 'Proveedor no configurado', code: 'SIN_CONFIG' };
	}
	if (doc.operativo === false) {
		return {
			ok: false,
			error: `Proveedor "${doc.nombre}" no operativo.`,
			code: 'NO_OPERATIVO'
		};
	}
	if (!doc.passwordEnc || !doc.usuario) {
		return { ok: false, error: 'Proveedor sin credenciales', code: 'SIN_CONFIG' };
	}

	const creds = resolveCreds(doc, secret);
	let tokenSesion = '';
	try {
		tokenSesion = doc.tokenSesionEnc ? decrypt(doc.tokenSesionEnc, secret) : '';
	} catch {
		tokenSesion = '';
	}

	const provider = getProvider(doc.tipoProveedor);
	const session = await provider.ensureSession(
		creds,
		{ tokenSesion, tokenExpiraEn: doc.tokenExpiraEn },
		doc
	);

	if (!session.ok) return session;

	if (session.renewed && session.token) {
		const db = getDb();
		await db.collection(COL).updateOne(
			{ id: doc.id },
			{
				$set: {
					tokenSesionEnc: encrypt(session.token, secret),
					tokenExpiraEn: session.expiraEn || null
				}
			}
		);
	}

	return { ok: true, provider, config: doc, session };
}

export async function listAudit(limit = 30) {
	const db = getDb();
	return db.collection('auditConfig').find({}).sort({ creadoEn: -1 }).limit(limit).toArray();
}

/** Usado por bootstrap: ¿ya hay algún proveedor usable? */
export async function hasConfiguredProveedor() {
	await migrateLegacyIfNeeded();
	const db = getDb();
	const n = await db.collection(COL).countDocuments({
		usuario: { $exists: true, $ne: '' },
		passwordEnc: { $exists: true, $ne: '' }
	});
	return n > 0;
}

export async function insertBootstrappedProveedor(doc) {
	const db = getDb();
	await db.collection(COL).insertOne(doc);
	await audit('bootstrap', `Config inicial ${doc.nombre} (${doc.tipoProveedor})`, 1, doc.id);
}
