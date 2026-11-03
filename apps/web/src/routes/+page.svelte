<script lang="ts">
	import { onMount } from 'svelte';
	import {
		apiFetch,
		type ConsultaResponse,
		type HealthResponse,
		type ProveedorLite,
		type Resultado
	} from '#lib/api';

	let termino = $state('');
	let tipoBusqueda = $state<'auto' | 'codigo' | 'nombre' | 'palabra_clave'>('auto');
	let proveedorId = $state('');
	let proveedores = $state<ProveedorLite[]>([]);
	let loading = $state(false);
	let error = $state('');
	let mensaje = $state('');
	let resultados = $state<Resultado[]>([]);
	let meta = $state<{
		consultaId?: string;
		tipo?: string;
		proveedorNombre?: string;
		desdeCache?: boolean;
	}>({});

	let health = $state<HealthResponse | null>(null);
	let healthError = $state('');

	onMount(async () => {
		try {
			const [h, list] = await Promise.all([
				apiFetch<HealthResponse>('/api/health'),
				apiFetch<{ items: ProveedorLite[] }>('/api/proveedores')
			]);
			health = h;
			proveedores = list.items || [];
			const pred = proveedores.find((p) => p.activo) || proveedores[0];
			if (pred) proveedorId = pred.id;
		} catch {
			healthError = 'No se pudo contactar la API. Revisa que el backend esté en el PORT del .env.';
		}
	});

	function money(precio: number | null, moneda: string | null) {
		if (precio == null) return '—';
		try {
			return new Intl.NumberFormat('es-MX', {
				style: 'currency',
				currency: moneda || 'MXN'
			}).format(precio);
		} catch {
			return `${precio} ${moneda || 'MXN'}`;
		}
	}

	async function buscar(e: Event) {
		e.preventDefault();
		error = '';
		mensaje = '';
		resultados = [];
		loading = true;
		try {
			const body: { termino: string; tipoBusqueda?: string; proveedorId?: string } = {
				termino: termino.trim()
			};
			if (tipoBusqueda !== 'auto') body.tipoBusqueda = tipoBusqueda;
			if (proveedorId) body.proveedorId = proveedorId;
			const data = await apiFetch<ConsultaResponse>('/api/consultas', {
				method: 'POST',
				body: JSON.stringify(body)
			});
			resultados = data.resultados || [];
			mensaje = data.mensaje || '';
			meta = {
				consultaId: data.consultaId,
				tipo: data.tipoBusqueda,
				proveedorNombre: data.proveedorNombre,
				desdeCache: Boolean(data.desdeCache)
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al consultar';
		} finally {
			loading = false;
		}
	}
</script>

<section class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Precio en tiempo real</h1>
		<p class="mt-1 text-sm text-[var(--muted)] sm:text-base">
			Elige el proveedor y busca por código, nombre o palabra clave.
		</p>
	</div>

	{#if healthError}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
			{healthError}
		</p>
	{:else if health}
		<p class="rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2.5 text-xs text-[var(--muted)]">
			API ok · {health.proveedores ?? proveedores.length} proveedor(es)
			{#if health.proveedor}
				· pred. <span class="font-medium text-[var(--ink)]">{health.proveedor.nombre || health.proveedor.tipo}</span>
				·
				{#if !health.proveedor.configurado}
					<span class="text-[var(--danger)]">sin credenciales</span>
					— <a href="/admin" class="underline">/admin</a>
				{:else if health.proveedor.operativo === false}
					<span class="text-[var(--danger)]">no operativo</span>
				{:else}
					<span class="text-[var(--accent)]">listo</span>
				{/if}
			{/if}
		</p>
	{/if}

	<form
		onsubmit={buscar}
		class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm sm:p-5"
	>
		{#if proveedores.length > 0}
			<label class="block text-sm font-medium" for="proveedor">Proveedor</label>
			<select
				id="proveedor"
				bind:value={proveedorId}
				class="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-[var(--accent)] focus:ring-2"
			>
				{#each proveedores as p (p.id)}
					<option value={p.id}>
						{p.nombre}{p.activo ? ' (predeterminado)' : ''}{p.configurado ? '' : ' — incompleto'}
					</option>
				{/each}
			</select>
		{:else}
			<p class="mb-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs">
				Aún no hay proveedores. Configúralos en <a href="/admin" class="underline">/admin</a> (solo
				nombre + URL + credenciales).
			</p>
		{/if}

		<label class="mt-3 block text-sm font-medium" for="termino">Producto</label>
		<input
			id="termino"
			bind:value={termino}
			placeholder="Ej. SKU-1001 o tornillo"
			autocomplete="off"
			class="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-[var(--accent)] focus:ring-2"
			required
			minlength="2"
		/>

		<div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="flex-1">
				<label class="block text-sm font-medium" for="tipo">Tipo de búsqueda</label>
				<select
					id="tipo"
					bind:value={tipoBusqueda}
					class="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-[var(--accent)] focus:ring-2"
				>
					<option value="auto">Automático</option>
					<option value="codigo">Código</option>
					<option value="nombre">Nombre</option>
					<option value="palabra_clave">Palabra clave</option>
				</select>
			</div>
			<button
				type="submit"
				disabled={loading || termino.trim().length < 2}
				class="rounded-xl bg-[var(--accent)] px-5 py-3 text-base font-medium text-white disabled:opacity-50"
			>
				{loading ? 'Consultando…' : 'Consultar'}
			</button>
		</div>
	</form>

	{#if error}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
			{error}
		</p>
	{/if}

	{#if mensaje && !error}
		<p class="rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] px-4 py-3 text-sm">
			{mensaje}
		</p>
	{/if}

	{#if resultados.length > 0}
		<div class="space-y-3">
			<p class="text-xs text-[var(--muted)]">
				{resultados.length} resultado{resultados.length === 1 ? '' : 's'}
				{#if meta.proveedorNombre}· {meta.proveedorNombre}{/if}
				{#if meta.tipo}· tipo: {meta.tipo}{/if}
				{#if meta.desdeCache}· caché{/if}
			</p>
			<ul class="space-y-3">
				{#each resultados as r (r.id)}
					<li class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div>
								<p class="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
									{r.codigoProducto}
								</p>
								<h2 class="mt-0.5 text-lg font-semibold">{r.nombre}</h2>
								{#if r.descripcion}
									<p class="mt-1 text-sm text-[var(--muted)]">{r.descripcion}</p>
								{/if}
							</div>
							<span
								class="rounded-full px-2.5 py-1 text-xs font-medium {r.disponible
									? 'bg-[var(--accent-soft)] text-[var(--accent)]'
									: 'bg-red-50 text-[var(--danger)]'}"
							>
								{r.disponible ? 'Disponible' : 'No disponible'}
							</span>
						</div>
						<div class="mt-4 flex flex-wrap items-end justify-between gap-2">
							<p class="text-2xl font-semibold tabular-nums">
								{money(r.precio, r.moneda)}
							</p>
							<p class="text-xs text-[var(--muted)]">
								{#if r.unidad}Unidad: {r.unidad} · {/if}
								{#if r.tiempoEntrega}Entrega: {r.tiempoEntrega}{/if}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
