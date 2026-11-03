import { mockProvider } from './mock.js';
import { httpProvider } from './http.js';

const providers = {
	mock: mockProvider,
	http: httpProvider
};

export function getProvider(tipo) {
	const p = providers[tipo || 'mock'];
	if (!p) throw new Error(`Tipo de proveedor desconocido: ${tipo}`);
	return p;
}
