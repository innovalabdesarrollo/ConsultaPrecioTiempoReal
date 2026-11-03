<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Consulta de precio</title>
</svelte:head>

<div class="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-8">
	<header class="mb-6 flex items-center justify-between gap-3">
		<a href="/" class="text-lg font-semibold tracking-tight text-[var(--ink)] no-underline">
			Consulta de precio
		</a>
		<nav class="flex gap-3 text-sm">
			<a href="/" class="text-[var(--muted)] no-underline hover:text-[var(--accent)]">Buscar</a>
			<a href="/admin" class="text-[var(--muted)] no-underline hover:text-[var(--accent)]"
				>Admin</a
			>
		</nav>
	</header>

	<main class="flex-1">{@render children()}</main>

	<footer class="mt-10 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
		MVP local · Innovalab
	</footer>
</div>
