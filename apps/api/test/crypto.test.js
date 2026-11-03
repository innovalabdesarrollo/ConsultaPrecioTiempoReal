import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decrypt, encrypt, maskSecret } from '../src/crypto.js';

describe('crypto', () => {
	it('cifra y descifra roundtrip', () => {
		const secret = 'test-secret-16chars!!';
		const plain = 'clave-proveedor-123';
		const enc = encrypt(plain, secret);
		assert.notEqual(enc, plain);
		assert.match(enc, /^[^:]+:[^:]+:[^:]+$/);
		assert.equal(decrypt(enc, secret), plain);
	});

	it('falla con secreto incorrecto', () => {
		const enc = encrypt('hola', 'secreto-correcto-xx');
		assert.throws(() => decrypt(enc, 'secreto-incorrecto-yy'));
	});

	it('maskSecret oculta el valor', () => {
		assert.equal(maskSecret(''), '');
		assert.equal(maskSecret('ab'), '****');
		assert.match(maskSecret('password123'), /\*\*.*23$/);
	});
});
