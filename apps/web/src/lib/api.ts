const API_BASE = '';

export async function apiFetch<T>(
	path: string,
	options: RequestInit & { adminToken?: string } = {}
): Promise<T> {
	const { adminToken, headers, ...rest } = options;
	const h = new Headers(headers);
	if (adminToken) h.set('x-admin-token', adminToken);
	if (rest.body && !h.has('content-type')) h.set('content-type', 'application/json');

	const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error((data as { error?: string }).error || `Error ${res.status}`);
	}
	return data as T;
}

export type Resultado = {
	id: string;
	codigoProducto: string;
	nombre: string;
	descripcion?: string;
	precio: number | null;
	moneda: string | null;
	disponible: boolean | null;
	unidad?: string | null;
	tiempoEntrega?: string | null;
};

export type ConsultaResponse = {
	ok: boolean;
	consultaId: string;
	tipoBusqueda: string;
	proveedorId?: string;
	proveedorNombre?: string;
	encontrados: number;
	mensaje?: string;
	resultados: Resultado[];
	desdeCache?: boolean;
	cacheTtlSeconds?: number;
};


export type AdminConfig = {
	id: string;
	nombre: string;
	activo: boolean;
	version: number;
	tipoProveedor: 'mock' | 'http';
	baseUrl: string;
	usuario: string;
	passwordMasked: string;
	tienePassword: boolean;
	tieneSesion: boolean;
	tokenExpiraEn: string | null;
	operativo: boolean;
	actualizadoEn: string | null;
};

export type ProveedorLite = {
	id: string;
	nombre: string;
	activo: boolean;
	tipoProveedor: string;
	operativo: boolean;
	configurado: boolean;
};

export type HealthResponse = {
	ok: boolean;
	service?: string;
	port?: number;
	proveedores?: number;
	proveedor?: {
		id?: string;
		nombre?: string;
		tipo?: string;
		configurado?: boolean;
		operativo?: boolean;
	} | null;
};
