const CATALOGO = [
	{
		codigoProducto: 'SKU-1001',
		nombre: 'Tornillo hexagonal M8x40',
		descripcion: 'Acero inoxidable A2',
		precio: 2.45,
		moneda: 'MXN',
		disponible: true,
		unidad: 'pza',
		tiempoEntrega: '24h'
	},
	{
		codigoProducto: 'SKU-1002',
		nombre: 'Tornillo hexagonal M8x50',
		descripcion: 'Acero inoxidable A2',
		precio: 2.8,
		moneda: 'MXN',
		disponible: true,
		unidad: 'pza',
		tiempoEntrega: '24h'
	},
	{
		codigoProducto: 'SKU-2001',
		nombre: 'Cable THW 12 AWG',
		descripcion: 'Rollo 100 m',
		precio: 1890.0,
		moneda: 'MXN',
		disponible: true,
		unidad: 'rollo',
		tiempoEntrega: '48h'
	},
	{
		codigoProducto: 'SKU-2002',
		nombre: 'Cable THW 10 AWG',
		descripcion: 'Rollo 100 m',
		precio: 2450.0,
		moneda: 'MXN',
		disponible: false,
		unidad: 'rollo',
		tiempoEntrega: '5 días'
	},
	{
		codigoProducto: 'SKU-3001',
		nombre: 'Interruptor termomagnético 2P 30A',
		descripcion: 'Curva C',
		precio: 312.5,
		moneda: 'MXN',
		disponible: true,
		unidad: 'pza',
		tiempoEntrega: '24h'
	}
];

let sesion = { token: null, expiraEn: null };

export const mockProvider = {
	id: 'mock',

	async login(creds) {
		const user = creds?.usuario || '';
		const pass = creds?.password || '';
		if (!user || !pass) {
			return { ok: false, error: 'Credenciales incompletas para proveedor mock' };
		}
		if (user === 'demo' && pass === 'demo') {
			sesion = {
				token: `mock-token-${Date.now()}`,
				expiraEn: new Date(Date.now() + 30 * 60 * 1000)
			};
			return { ok: true, token: sesion.token, expiraEn: sesion.expiraEn };
		}
		return { ok: false, error: 'Credenciales inválidas (usa demo/demo en proveedor mock)' };
	},

	async ensureSession(creds, stored) {
		const now = Date.now();
		const exp = stored?.tokenExpiraEn ? new Date(stored.tokenExpiraEn).getTime() : 0;
		if (stored?.tokenSesion && exp > now + 60_000) {
			sesion = { token: stored.tokenSesion, expiraEn: new Date(exp) };
			return { ok: true, renewed: false, token: sesion.token, expiraEn: sesion.expiraEn };
		}
		const login = await this.login(creds);
		if (!login.ok) return login;
		return { ok: true, renewed: true, token: login.token, expiraEn: login.expiraEn };
	},

	async search(termino, tipo) {
		if (!sesion.token) {
			return { ok: false, error: 'Sesión no autenticada con el proveedor' };
		}
		const q = String(termino || '').trim().toLowerCase();
		if (!q) return { ok: false, error: 'Término vacío' };

		let items = CATALOGO;
		if (tipo === 'codigo') {
			items = CATALOGO.filter((p) => p.codigoProducto.toLowerCase() === q);
		} else if (tipo === 'nombre') {
			items = CATALOGO.filter((p) => p.nombre.toLowerCase().includes(q));
		} else {
			items = CATALOGO.filter(
				(p) =>
					p.codigoProducto.toLowerCase().includes(q) ||
					p.nombre.toLowerCase().includes(q) ||
					(p.descripcion || '').toLowerCase().includes(q)
			);
		}

		return {
			ok: true,
			productos: items.map((p) => ({ ...p }))
		};
	},

	async testConnection(creds) {
		return this.login(creds);
	}
};
