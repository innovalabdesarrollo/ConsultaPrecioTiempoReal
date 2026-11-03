import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(root, 'apps/api/.env') });

const webPort = Number(process.env.WEB_PORT || 5173);

export default defineConfig({
	testDir: 'e2e',
	timeout: 30_000,
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL: `http://127.0.0.1:${webPort}`,
		trace: 'on-first-retry',
		...devices['Desktop Chrome']
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

