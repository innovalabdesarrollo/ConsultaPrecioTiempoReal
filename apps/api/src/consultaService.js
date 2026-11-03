import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { withProviderSession } from './configService.js';

function inferTipo(termino, tipo) {
	if (tipo && ['codigo', 'nombre', 'palabra_clave'].includes(tipo)) return tipo;
	const t = String(termino).trim();
	if (/^[A-Z0-9]+-[A-Z0-9]+$/i.test(t) || /^SKU[-_]?\d+$/i.test(t)) return 'codigo';
	if (t.split(/\s+/).length >= 2) return 'nombre';
	return 'palabra_clave';
}

/** 0 = desactivado. Default 60s. Configurable con CACHE_TTL_SECONDS en .env */
function cacheTtlSec() {
	const n = Number(process.env.CACHE_TTL_SECONDS);
	if (!Number.isFinite(n) || n < 0) return 60;
	return Math.floor(n);
}

async function upsertProducto(p) {
	const db = getDb();
	const now = new Date();
	const existing = await db.collection('productos').findOne({ codigoProducto: p.codigoProducto });
	const id = existing?.id || randomUUID();
	const doc = {
		id,
		codigoProducto: p.codigoProducto,
		nombre: p.nombre,
		descripcion: p.descripcion || '',
		precio: p.precio ?? null,
		moneda: p.moneda || 'MXN',
		disponible: Boolean(p.disponible),
		consultadoEn: now
	};
	await db.collection('productos').updateOne(
		{ codigoProducto: p.codigoProducto },
		{ $set: doc },
		{ upsert: true }
	);
	return doc;
}

async function leerCache(db, q, tipo, proveedorId) {
	const ttl = cacheTtlSec();
	if (ttl <= 0) return null;

	const since = new Date(Date.now() - ttl * 1000);
	const filter = {
		terminoBusqueda: q,
		tipoBusqueda: tipo,
		estado: 'completada',
		desdeCache: { $ne: true },
		cacheSnapshot: { $exists: true },
		solicitadaEn: { $gte: since }
	};
	if (proveedorId) filter.proveedorId = proveedorId;
	else filter.$or = [{ proveedorId: null }, { proveedorId: { $exists: false } }];

	return db.collection('consultas').findOne(filter, { sort: { solicitadaEn: -1 } });
}

export async function consultar(termino, tipoBusqueda, secret, proveedorId) {
	const q = String(termino || '').trim();
	if (q.length < 2) {
		return { ok: false, status: 400, error: 'Ingresa al menos 2 caracteres' };
	}

	const tipo = inferTipo(q, tipoBusqueda);
	const db = getDb();
	const consultaId = randomUUID();
	const solicitadaEn = new Date();
	const pid = proveedorId || null;

	const cached = await leerCache(db, q, tipo, pid);
	if (cached?.cacheSnapshot) {
		const snap = cached.cacheSnapshot;
		await db.collection('consultas').insertOne({
			id: consultaId,
			terminoBusqueda: q,
			tipoBusqueda: tipo,
			proveedorId: snap.proveedorId || pid,
			estado: 'completada',
			desdeCache: true,
			solicitadaEn,
			completadaEn: new Date(),
			mensajeError: null,
			cacheDe: cached.id
		});
		return {
			ok: true,
			consultaId,
			tipoBusqueda: tipo,
			proveedorId: snap.proveedorId,
			proveedorNombre: snap.proveedorNombre,
			encontrados: snap.encontrados,
			mensaje: snap.mensaje || undefined,
			resultados: snap.resultados || [],
			desdeCache: true,
			cacheTtlSeconds: cacheTtlSec()
		};
	}

	await db.collection('consultas').insertOne({
		id: consultaId,
		terminoBusqueda: q,
		tipoBusqueda: tipo,
		proveedorId: pid,
		estado: 'pendiente',
		desdeCache: false,
		solicitadaEn,
		completadaEn: null,
		mensajeError: null
	});

	const ready = await withProviderSession(secret, pid);
	if (!ready.ok) {
		await db.collection('consultas').updateOne(
			{ id: consultaId },
			{
				$set: {
					estado: 'fallida',
					completadaEn: new Date(),
					mensajeError: ready.error
				}
			}
		);
		return {
			ok: false,
			status: ready.code === 'NO_OPERATIVO' ? 503 : 502,
			error: ready.error,
			consultaId
		};
	}

	const search = await ready.provider.search(q, tipo, ready.config);
	const completadaEn = new Date();

	if (!search.ok) {
		await db.collection('consultas').updateOne(
			{ id: consultaId },
			{
				$set: {
					estado: 'fallida',
					completadaEn,
					mensajeError: search.error
				}
			}
		);
		return { ok: false, status: 502, error: search.error, consultaId };
	}

	const productos = search.productos || [];
	if (productos.length === 0) {
		const payload = {
			ok: true,
			consultaId,
			tipoBusqueda: tipo,
			proveedorId: ready.config.id,
			proveedorNombre: ready.config.nombre,
			encontrados: 0,
			mensaje: 'No se encontró el producto con ese criterio',
			resultados: [],
			desdeCache: false
		};
		await db.collection('consultas').updateOne(
			{ id: consultaId },
			{
				$set: {
					estado: 'completada',
					completadaEn,
					mensajeError: null,
					proveedorId: ready.config.id,
					cacheSnapshot: {
						proveedorId: ready.config.id,
						proveedorNombre: ready.config.nombre,
						encontrados: 0,
						mensaje: payload.mensaje,
						resultados: []
					}
				}
			}
		);
		await db.collection('resultados').insertOne({
			id: randomUUID(),
			consultaId,
			productoId: null,
			precio: null,
			moneda: null,
			disponible: null,
			detalleRespuesta: 'Producto no encontrado',
			obtenidoEn: completadaEn
		});
		return payload;
	}

	const resultados = [];
	for (const p of productos) {
		const prod = await upsertProducto(p);
		const resultado = {
			id: randomUUID(),
			consultaId,
			productoId: prod.id,
			precio: prod.precio,
			moneda: prod.moneda,
			disponible: prod.disponible,
			detalleRespuesta: JSON.stringify({
				unidad: p.unidad || null,
				tiempoEntrega: p.tiempoEntrega || null,
				descripcion: p.descripcion || null
			}),
			obtenidoEn: completadaEn
		};
		await db.collection('resultados').insertOne(resultado);
		resultados.push({
			...resultado,
			codigoProducto: prod.codigoProducto,
			nombre: prod.nombre,
			descripcion: prod.descripcion,
			unidad: p.unidad || null,
			tiempoEntrega: p.tiempoEntrega || null
		});
	}

	await db.collection('consultas').updateOne(
		{ id: consultaId },
		{
			$set: {
				estado: 'completada',
				completadaEn,
				mensajeError: null,
				proveedorId: ready.config.id,
				cacheSnapshot: {
					proveedorId: ready.config.id,
					proveedorNombre: ready.config.nombre,
					encontrados: resultados.length,
					resultados
				}
			}
		}
	);

	return {
		ok: true,
		consultaId,
		tipoBusqueda: tipo,
		proveedorId: ready.config.id,
		proveedorNombre: ready.config.nombre,
		encontrados: resultados.length,
		resultados,
		desdeCache: false
	};
}
