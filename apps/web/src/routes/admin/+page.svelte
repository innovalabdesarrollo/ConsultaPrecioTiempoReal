<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch, type AdminConfig } from '#lib/api';

	const TOKEN_KEY = 'cpt_admin_token';

	let token = $state('');
	let unlocked = $state(false);
	let loading = $state(false);
	let saving = $state(false);
	let error = $state('');
	let okMsg = $state('');
	let items = $state<AdminConfig[]>([]);
	let selectedId = $state<string | 'nuevo'>('nuevo');
	let audit = $state<{ accion: string; detalle: string; version: number; creadoEn: string }[]>(
		[]
	);

	let form = $state({
		nombre: '',
		tipoProveedor: 'http' as 'mock' | 'http',
		baseUrl: '',
		usuario: '',
		password: '',
		operativo: true,
		activar: false
	});

	const selected = $derived(items.find((p) => p.id === selectedId) || null);

	function persistToken() {
		localStorage.setItem(TOKEN_KEY, token);
	}

	function blankForm(activar = false) {
		form = {
			nombre: '',
			tipoProveedor: 'http',
			baseUrl: '',
			usuario: '',
			password: '',
			operativo: true,
			activar
		};
	}

	function fillForm(p: AdminConfig) {
		form = {
			nombre: p.nombre,
			tipoProveedor: p.tipoProveedor,
			baseUrl: p.baseUrl || '',
			usuario: p.usuario || '',
			password: '',
			operativo: p.operativo,
			activar: false
		};
	}

	onMount(() => {
		token = localStorage.getItem(TOKEN_KEY) || '';
	});

	async function loadAll() {
		// Lee el input por si el valor aún no sincronizó bind:value (p. ej. automatización)
		const inputEl = document.getElementById('token');
		if (inputEl instanceof HTMLInputElement && inputEl.value) {
			token = inputEl.value;
		}
		loading = true;
		error = '';
		okMsg = '';
		try {
			persistToken();
			const [list, aud] = await Promise.all([
				apiFetch<{ items: AdminConfig[] }>('/api/admin/proveedores', { adminToken: token }),
				apiFetch<{ items: typeof audit }>('/api/admin/auditoria', { adminToken: token })
			]);

			items = list.items || [];
			audit = aud.items || [];
			unlocked = true;
			if (items.length === 0) {
				selectedId = 'nuevo';
				blankForm(true);
			} else if (selectedId !== 'nuevo' && !items.some((p) => p.id === selectedId)) {
				const activo = items.find((p) => p.activo) || items[0];
				selectedId = activo.id;
				fillForm(activo);
			} else if (selectedId !== 'nuevo') {
				const cur = items.find((p) => p.id === selectedId);
				if (cur) fillForm(cur);
			}
		} catch (err) {
			unlocked = false;
			error = err instanceof Error ? err.message : 'No autorizado';
		} finally {
			loading = false;
		}
	}

	function selectItem(id: string | 'nuevo') {
		selectedId = id;
		error = '';
		okMsg = '';
		if (id === 'nuevo') blankForm(items.length === 0);
		else {
			const p = items.find((x) => x.id === id);
			if (p) fillForm(p);
		}
	}

	async function guardar() {
		saving = true;
		error = '';
		okMsg = '';
		try {
			const body: Record<string, unknown> = {
				nombre: form.nombre.trim(),
				tipoProveedor: form.tipoProveedor,
				baseUrl: form.baseUrl,
				usuario: form.usuario,
				operativo: form.operativo
			};
			if (form.password) body.password = form.password;
			if (selectedId === 'nuevo') {
				body.activar = form.activar || items.length === 0;
				const created = await apiFetch<AdminConfig>('/api/admin/proveedores', {
					method: 'POST',
					adminToken: token,
					body: JSON.stringify(body)
				});
				okMsg = `Proveedor "${created.nombre}" creado`;
				selectedId = created.id;
			} else {
				await apiFetch<AdminConfig>(`/api/admin/proveedores/${selectedId}`, {
					method: 'PUT',
					adminToken: token,
					body: JSON.stringify(body)
				});
				okMsg = 'Proveedor guardado';
			}
			form.password = '';
			await loadAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al guardar';
		} finally {
			saving = false;
		}
	}

	async function probar() {
		if (selectedId === 'nuevo') {
			error = 'Guarda el proveedor antes de probar';
			return;
		}
		saving = true;
		error = '';
		okMsg = '';
		try {
			const body: Record<string, unknown> = {
				tipoProveedor: form.tipoProveedor,
				baseUrl: form.baseUrl,
				usuario: form.usuario
			};
			if (form.password) body.password = form.password;
			await apiFetch(`/api/admin/proveedores/${selectedId}/probar`, {
				method: 'POST',
				adminToken: token,
				body: JSON.stringify(body)
			});
			await loadAll();
			okMsg = 'Conexión exitosa';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Prueba fallida';
		} finally {
			saving = false;
		}
	}

	async function activar() {
		if (selectedId === 'nuevo') return;
		saving = true;
		error = '';
		okMsg = '';
		try {
			await apiFetch(`/api/admin/proveedores/${selectedId}/activar`, {
				method: 'POST',
				adminToken: token
			});
			okMsg = 'Proveedor marcado como predeterminado';
			await loadAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'No se pudo activar';
		} finally {
			saving = false;
		}
	}

	async function eliminar() {
		if (selectedId === 'nuevo') return;
		if (!confirm('¿Eliminar este proveedor?')) return;
		saving = true;
		error = '';
		okMsg = '';
		try {
			await apiFetch(`/api/admin/proveedores/${selectedId}`, {
				method: 'DELETE',
				adminToken: token
			});
			okMsg = 'Proveedor eliminado';
			selectedId = 'nuevo';
			await loadAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'No se pudo eliminar';
		} finally {
			saving = false;
		}
	}

	async function revertir() {
		if (selectedId === 'nuevo') return;
		if (!confirm('¿Revertir a la versión anterior de este proveedor?')) return;
		saving = true;
		error = '';
		okMsg = '';
		try {
			await apiFetch(`/api/admin/proveedores/${selectedId}/revertir`, {
				method: 'POST',
				adminToken: token
			});
			okMsg = 'Configuración revertida';
			await loadAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'No se pudo revertir';
		} finally {
			saving = false;
		}
	}
</script>

<section class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Proveedores</h1>
		<p class="mt-1 text-sm text-[var(--muted)]">
			Agrega cada proveedor con <strong>nombre + URL de API + usuario + contraseña</strong>.
			Puedes tener varios; al consultar eliges cuál usar. Sin Playwright: solo API HTTP (o demo
			mock).
		</p>
	</div>

	{#if !unlocked}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				const fd = new FormData(/** @type {HTMLFormElement} */ (e.currentTarget));
				const fromForm = String(fd.get('token') || '').trim();
				if (fromForm) token = fromForm;
				loadAll();
			}}
			class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5"
		>
			<label class="block text-sm font-medium" for="token">Token de administrador</label>
			<input
				id="token"
				name="token"
				type="password"
				bind:value={token}
				class="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-3 outline-none ring-[var(--accent)] focus:ring-2"
				required
			/>
			<button
				type="submit"
				class="mt-3 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white"
				disabled={loading}
			>
				{loading ? 'Entrando…' : 'Entrar'}
			</button>
		</form>

	{:else}
		<div class="flex flex-wrap gap-2">
			{#each items as p (p.id)}
				<button
					type="button"
					onclick={() => selectItem(p.id)}
					class="rounded-full border px-3 py-1.5 text-sm {selectedId === p.id
						? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
						: 'border-[var(--line)] bg-white text-[var(--muted)]'}"
				>
					{p.nombre}{p.activo ? ' · pred.' : ''}
				</button>
			{/each}
			<button
				type="button"
				onclick={() => selectItem('nuevo')}
				class="rounded-full border border-dashed border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)]"
			>
				+ Nuevo
			</button>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				guardar();
			}}
			class="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5"
		>
			{#if selected}
				<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
					<span>v{selected.version} · {selected.tieneSesion ? 'sesión activa' : 'sin sesión'}</span>
					{#if selected.activo}
						<span class="text-[var(--accent)]">Predeterminado</span>
					{/if}
				</div>
			{/if}

			<label class="block text-sm font-medium">
				Nombre (ej. “Proveedor A”, “Distribuidora X”)
				<input
					bind:value={form.nombre}
					required
					class="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-3"
					placeholder="Nombre para identificarlo"
				/>
			</label>

			<label class="block text-sm font-medium">
				Tipo
				<select
					bind:value={form.tipoProveedor}
					class="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-3"
				>
					<option value="http">HTTP API (producción)</option>
					<option value="mock">Mock (demo local)</option>
				</select>
			</label>

			{#if form.tipoProveedor === 'http'}
				<p class="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs">
					Solo necesitas la URL base de la API y las credenciales que te dé el proveedor.
				</p>
				<label class="block text-sm font-medium">
					Base URL
					<input
						bind:value={form.baseUrl}
						placeholder="https://api.proveedor.com"
						class="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-3"
					/>
				</label>
			{:else}
				<p class="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs">
					Demo: usuario <strong>demo</strong> / password <strong>demo</strong>.
				</p>
			{/if}

			<label class="block text-sm font-medium">
				Usuario
				<input
					bind:value={form.usuario}
					required
					class="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-3"
				/>
			</label>

			<label class="block text-sm font-medium">
				Contraseña / API key
				{selected?.tienePassword ? '(vacío = no cambiar)' : ''}
				<input
					type="password"
					bind:value={form.password}
					autocomplete="new-password"
					class="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-3"
					placeholder={selected?.tienePassword ? '••••••••' : ''}
				/>
			</label>

			<label class="flex items-center gap-2 text-sm font-medium">
				<input type="checkbox" bind:checked={form.operativo} class="size-4" />
				Operativo (permite consultas)
			</label>

			{#if selectedId === 'nuevo' && items.length > 0}
				<label class="flex items-center gap-2 text-sm font-medium">
					<input type="checkbox" bind:checked={form.activar} class="size-4" />
					Marcar como predeterminado
				</label>
			{/if}

			<div class="flex flex-wrap gap-2 pt-1">
				<button
					type="submit"
					disabled={saving}
					class="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
				>
					{selectedId === 'nuevo' ? 'Crear' : 'Guardar'}
				</button>
				{#if selectedId !== 'nuevo'}
					<button
						type="button"
						onclick={probar}
						disabled={saving}
						class="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-medium disabled:opacity-50"
					>
						Probar
					</button>
					{#if !selected?.activo}
						<button
							type="button"
							onclick={activar}
							disabled={saving}
							class="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-medium disabled:opacity-50"
						>
							Usar por defecto
						</button>
					{/if}
					<button
						type="button"
						onclick={revertir}
						disabled={saving}
						class="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-medium disabled:opacity-50"
					>
						Revertir
					</button>
					<button
						type="button"
						onclick={eliminar}
						disabled={saving}
						class="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-medium text-[var(--danger)] disabled:opacity-50"
					>
						Eliminar
					</button>
				{/if}
			</div>
		</form>

		<div class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5">
			<h2 class="text-sm font-semibold">Auditoría</h2>
			{#if audit.length === 0}
				<p class="mt-2 text-sm text-[var(--muted)]">Sin eventos aún.</p>
			{:else}
				<ul class="mt-3 space-y-2 text-sm">
					{#each audit as a, i (i)}
						<li class="border-b border-[var(--line)] pb-2 last:border-0">
							<span class="font-medium">{a.accion}</span>
							<span class="text-[var(--muted)]"> · v{a.version}</span>
							<p class="text-xs text-[var(--muted)]">{a.detalle}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	{#if error}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
			{error}
		</p>
	{/if}
	{#if okMsg}
		<p class="rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] px-4 py-3 text-sm">
			{okMsg}
		</p>
	{/if}
</section>
