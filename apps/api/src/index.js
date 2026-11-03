import { getApp, getEnv } from './app.js';

const { PORT } = getEnv();
const app = await getApp();

const server = app.listen(PORT, () => {
	console.log(`API en http://localhost:${PORT}`);
});

server.on('error', (err) => {
	if (err && err.code === 'EADDRINUSE') {
		console.error(
			`Puerto ${PORT} en uso (otra app). No se tocó ese proceso. Cambia PORT en apps/api/.env.`
		);
		process.exit(1);
	}
	console.error(err);
	process.exit(1);
});
