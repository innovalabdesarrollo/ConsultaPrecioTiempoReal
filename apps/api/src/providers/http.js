/**
 * Adaptador HTTP genérico.
 * Espera endpoints configurables:
 *  POST {baseUrl}/auth  { usuario, password } -> { token, expiraEn? }
 *  GET  {baseUrl}/productos?q=&tipo= -> { productos: [...] }
 */

let tokenMem = null;
let expMem = null;

async function parseJson(res) {
	const text = await res.text();
	try {
		return text ? JSON.parse(text) : {};
	} catch {
		return { raw: text };
	}
}

export const httpProvider = {
	id: 'http',

	async login(creds, config) {
		const baseUrl = (config?.baseUrl || '').replace(/\/$/, '');
		if (!baseUrl) return { ok: false, error: 'baseUrl no configurada' };
		if (!creds?.usuario || !creds?.password) {
			return { ok: false, error: 'Credenciales incompletas' };
		}

		try {
			const res = await fetch(`${baseUrl}/auth`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', accept: 'application/json' },
				body: JSON.stringify({ usuario: creds.usuario, password: creds.password })
			});
			const data = await parseJson(res);
			if (!res.ok || !data.token) {
				return {
					ok: false,
					error: data.error || data.message || `Auth falló (${res.status})`
				};
			}
			tokenMem = data.token;
			expMem = data.expiraEn
				? new Date(data.expiraEn)
				: new Date(Date.now() + 30 * 60 * 1000);
			return { ok: true, token: tokenMem, expiraEn: expMem };
		} catch (err) {
			return { ok: false, error: `Proveedor no disponible: ${err.message}` };
		}
	},

	async ensureSession(creds, stored, config) {
		const now = Date.now();
		const exp = stored?.tokenExpiraEn ? new Date(stored.tokenExpiraEn).getTime() : 0;
		if (stored?.tokenSesion && exp > now + 60_000) {
			tokenMem = stored.tokenSesion;
			expMem = new Date(exp);
			return { ok: true, renewed: false, token: tokenMem, expiraEn: expMem };
		}
		const login = await this.login(creds, config);
		if (!login.ok) return login;
		return { ok: true, renewed: true, token: login.token, expiraEn: login.expiraEn };
	},

	async search(termino, tipo, config) {
		const baseUrl = (config?.baseUrl || '').replace(/\/$/, '');
		if (!baseUrl) return { ok: false, error: 'baseUrl no configurada' };
		if (!tokenMem) return { ok: false, error: 'Sesión no autenticada con el proveedor' };

		try {
			const url = new URL(`${baseUrl}/productos`);
			url.searchParams.set('q', termino);
			if (tipo) url.searchParams.set('tipo', tipo);

			const res = await fetch(url, {
				headers: {
					accept: 'application/json',
					authorization: `Bearer ${tokenMem}`
				}
			});
			const data = await parseJson(res);
			if (!res.ok) {
				return {
					ok: false,
					error: data.error || data.message || `Consulta falló (${res.status})`
				};
			}
			const productos = Array.isArray(data.productos) ? data.productos : [];
			return { ok: true, productos };
		} catch (err) {
			return { ok: false, error: `Proveedor no disponible: ${err.message}` };
		}
	},

	async testConnection(creds, config) {
		return this.login(creds, config);
	}
};
