import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';

function keyFromSecret(secret) {
	return scryptSync(secret, 'cpt-credenciales-v1', 32);
}

/** Cifra texto con AES-256-GCM. Retorna "iv:tag:ciphertext" en base64. */
export function encrypt(plain, secret) {
	if (!plain) return '';
	const key = keyFromSecret(secret);
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, key, iv);
	const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decrypt(payload, secret) {
	if (!payload) return '';
	const [ivB64, tagB64, dataB64] = String(payload).split(':');
	if (!ivB64 || !tagB64 || !dataB64) throw new Error('Credencial cifrada inválida');
	const key = keyFromSecret(secret);
	const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
	decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
	const dec = Buffer.concat([
		decipher.update(Buffer.from(dataB64, 'base64')),
		decipher.final()
	]);
	return dec.toString('utf8');
}

export function maskSecret(value) {
	if (!value) return '';
	const s = String(value);
	if (s.length <= 4) return '****';
	return `${'*'.repeat(Math.min(8, s.length - 2))}${s.slice(-2)}`;
}
