/**
 * Serverless Express en Vercel (mismo dominio que SvelteKit).
 * Variables: MONGODB_URI, CREDENTIALS_SECRET, ADMIN_TOKEN (en el dashboard).
 */
import { getApp } from '@cpt/api/app.js';

export default await getApp();
