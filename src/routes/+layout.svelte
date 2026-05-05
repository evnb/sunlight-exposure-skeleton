<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './+layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8">
	{@render children()}
</main>
