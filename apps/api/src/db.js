import { MongoClient } from 'mongodb';

let client;
let db;

export async function connectDb(uri) {
	if (db) return db;
	client = new MongoClient(uri);
	await client.connect();
	db = client.db();
	await Promise.all([
		db.collection('consultas').createIndex({ solicitadaEn: -1 }),
		db.collection('consultas').createIndex({
			terminoBusqueda: 1,
			tipoBusqueda: 1,
			proveedorId: 1,
			estado: 1,
			solicitadaEn: -1
		}),

		db.collection('productos').createIndex({ codigoProducto: 1 }, { unique: true }),
		db.collection('resultados').createIndex({ consultaId: 1 }),
		db.collection('auditConfig').createIndex({ creadoEn: -1 }),
		db.collection('proveedores').createIndex({ id: 1 }, { unique: true }),
		db.collection('proveedores').createIndex({ activo: 1 })
	]);

	return db;
}

export function getDb() {
	if (!db) throw new Error('DB no conectada');
	return db;
}

export async function closeDb() {
	if (client) await client.close();
	client = undefined;
	db = undefined;
}
