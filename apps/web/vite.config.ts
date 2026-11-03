import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, 'apps/api/.env') });

const webPort = Number(process.env.WEB_PORT || 5173);
const apiPort = Number(process.env.PORT || 3001);

export default defineConfig(({ command }) => {
	if (command === 'serve') {
		if (!Number.isInteger(apiPort) || apiPort < 1) {
			throw new Error('Define PORT en apps/api/.env (puerto del backend local)');
		}
	}

	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter({
					runtime: 'nodejs24.x'
				})

			})
		],
		server: {
			port: webPort,
			strictPort: true,
			proxy: {
				'/api': {
					target: `http://127.0.0.1:${apiPort}`,
					changeOrigin: true
				}
			}
		}
	};
});
