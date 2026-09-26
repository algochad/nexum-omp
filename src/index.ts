/**
 * Nexum (Dialagram) provider extension for omp.
 *
 * Registers `nexum` as a first-class provider backed by the Dialagram router
 * (OpenAI-compatible wire at https://dialagram.me/router/v1):
 *
 * - `/login nexum` prompts for an API key, validates it against /v1/models,
 *   and stores it in the auth store. Run it once per key: every stored
 *   credential participates in omp's multi-account selection/rotation.
 * - `NEXUM_API_KEY` env var works as a key fallback.
 * - Model list is discovered live from GET /v1/models (24 h model cache,
 *   refreshed with `omp models refresh`).
 */
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const PROVIDER_ID = "nexum";
const BASE_URL = "https://dialagram.me/router/v1";
const DEFAULT_MAX_TOKENS = 16000;

interface RouterModelEntry {
	id?: unknown;
	display_name?: unknown;
	owned_by?: unknown;
	context_window?: unknown;
	context_length?: unknown;
	max_input_tokens?: unknown;
	max_output_tokens?: unknown;
	limit?: { context?: unknown; output?: unknown };
}

/** Coerce an unknown router field to a positive finite number. */
function positiveNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/** Coerce an unknown router field to a non-empty trimmed string. */
function nonEmptyString(value: unknown): string | undefined {
	const text = typeof value === "string" ? value.trim() : "";
	return text.length > 0 ? text : undefined;
}

async function fetchRouterModels(apiKey: string): Promise<RouterModelEntry[]> {
	const response = await fetch(`${BASE_URL}/models`, {
		headers: { Authorization: `Bearer ${apiKey}` },
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) {
		throw new Error(`Dialagram router rejected the request (HTTP ${response.status})`);
	}
	const payload = (await response.json()) as { data?: unknown };
	if (!Array.isArray(payload.data)) {
		throw new Error("Dialagram router returned an unexpected /v1/models payload");
	}
	return payload.data.filter((entry): entry is RouterModelEntry => entry !== null && typeof entry === "object");
}

export default function nexumProvider(pi: ExtensionAPI): void {
	pi.registerProvider(PROVIDER_ID, {
		baseUrl: BASE_URL,
		api: "openai-completions",
		// Env-var fallback for the auth cascade. The credential store resolves
		// this name to $NEXUM_API_KEY per request; /login credentials apply when
		// it is unset. NOTE: `envKeys` inside `oauth` is silently dropped for
		// extension-registered providers, so the fallback must live here.
		apiKey: "NEXUM_API_KEY",
		authHeader: true,
		oauth: {
			name: "Nexum (Dialagram)",
			async login(callbacks) {
				callbacks.onProgress?.("Paste a Nexum/Dialagram API key (dgr_…)");
				const raw = await callbacks.onPrompt({
					message: "Nexum API key",
					placeholder: "dgr_live_…",
					secret: true,
				});
				const apiKey = raw.trim();
				if (!apiKey) throw new Error("No API key provided");
				callbacks.onProgress?.("Validating key against the Dialagram router…");
				await fetchRouterModels(apiKey);
				callbacks.onProgress?.("Key accepted");
				return apiKey;
			},
		},
		// Static fallback so `omp models nexum` lists the known catalog even
		// when the router is unreachable or the key is invalid; live discovery
		// replaces/augments these on successful fetch.
		models: [
			{
				id: "meta-muse-spark-1.3",
				name: "Meta Muse Spark 1.3",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 1048576,
				maxTokens: 16000,
			},
			{
				id: "meta-muse-spark-1.2",
				name: "Meta Muse Spark 1.2",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 1048576,
				maxTokens: 16000,
			},
			{
				id: "qwen-3.8-max",
				name: "Qwen 3.8 Max",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 500000,
				maxTokens: 16000,
			},
			{
				id: "qwen-3.8-omni-flash",
				name: "Qwen 3.8 Omni Flash",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 500000,
				maxTokens: 16000,
			},
		],
		async fetchDynamicModels(apiKey) {
			if (!apiKey) return [];
			const entries = await fetchRouterModels(apiKey);
			return entries.flatMap(entry => {
				const id = nonEmptyString(entry.id);
				if (!id) return [];
				const name = nonEmptyString(entry.display_name) ?? id;
				const contextWindow =
					positiveNumber(entry.context_window) ??
					positiveNumber(entry.limit?.context) ??
					positiveNumber(entry.context_length) ??
					200_000;
				const maxTokens =
					positiveNumber(entry.max_output_tokens) ?? positiveNumber(entry.limit?.output) ?? DEFAULT_MAX_TOKENS;
				return [
					{
						id,
						name,
						reasoning: true,
						input: ["text", "image"] as const,
						cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
						contextWindow,
						maxTokens,
					},
				];
			});
		},
	});
}
