const c = [
	() => import("../../../src/routes/$layout.svelte"),
	() => import("../components/error.svelte"),
	() => import("../../../src/routes/index.svelte"),
	() => import("../../../src/routes/dudes/weshake/index.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/dudes/weshake/index.svelte
	[/^\/dudes\/weshake\/?$/, [c[0], c[3]], [c[1]]]
];

export const fallback = [c[0](), c[1]()];