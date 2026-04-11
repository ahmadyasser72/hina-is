import { useSignalEffect } from "@preact/signals";
import { useDeepSignal, type DeepSignal } from "deepsignal";
import * as devalue from "devalue";
import { pick } from "es-toolkit";
import { createContext } from "preact";

export const CHARACTER_SORTER_STATE_KEY = "hina-is-sorter-state";

export type CardType = "normal" | "trained";
export type CompareResult = "left" | "right" | "tie";
export type Character = Record<"name" | "slug" | "card", string>;

interface RankResult {
	rank: number;
	character: Character;
}

interface SortState {
	result: Character[];
	left: Character[];
	right: Character[];
	merged: Character[];
	ties: Set<string>;
	leftIdx: number;
	rightIdx: number;
	size: number;
	start: number;
}

export interface ResultData {
	slug: string;
	step: number;
	done: boolean;
	rankings: RankResult[];
}

const tieKey = (() => {
	const collator = new Intl.Collator(undefined, {
		numeric: true,
		sensitivity: "base",
	});

	return (a: string, b: string) =>
		collator.compare(a, b) < 0 ? `${a}|${b}` : `${b}|${a}`;
})();

const worstCaseComparisons = (n: number) => {
	if (n <= 1) return 0;

	const log2 = Math.ceil(Math.log2(n));
	return n * log2 - (1 << log2) + 1;
};

const getDsu = (slugs: string[], ties: Set<string>) => {
	const parents = new Map<string, string>();
	for (const slug of slugs) parents.set(slug, slug);

	const find = (i: string): string => {
		const p = parents.get(i);
		if (p === i || p === undefined) return i;
		const root = find(p);
		parents.set(i, root);
		return root;
	};

	const union = (i: string, j: string) => {
		const rootI = find(i);
		const rootJ = find(j);
		if (rootI !== rootJ) {
			parents.set(rootI, rootJ);
			return true;
		}
		return false;
	};

	for (const tie of ties) {
		const [a, b] = tie.split("|");
		union(a, b);
	}

	return { find, union };
};

const initNextMerge = (state: SortState): SortState => {
	const n = state.result.length;
	while (state.size < n) {
		while (state.start < n) {
			const mid = Math.min(state.start + state.size, n);
			const end = Math.min(state.start + state.size * 2, n);
			if (mid < end) {
				state.left = state.result.slice(state.start, mid);
				state.right = state.result.slice(mid, end);
				state.merged = [];
				state.leftIdx = 0;
				state.rightIdx = 0;
				if (state.left.length > 0 && state.right.length > 0) return state;
			}

			state.start += state.size * 2;
		}

		state.size *= 2;
		state.start = 0;
	}

	state.left = [];
	state.right = [];
	return state;
};

const applyComparison = (state: SortState, result: CompareResult) => {
	const left = state.left[state.leftIdx];
	const right = state.right[state.rightIdx];

	if (result === "left" || result === "tie") {
		state.merged.push(left);
		state.leftIdx++;

		if (result === "tie") {
			state.ties.add(tieKey(left.slug, right.slug));
			state.merged.push(right);
			state.rightIdx++;
		}
	} else if (result === "right") {
		state.merged.push(right);
		state.rightIdx++;
	}

	while (
		state.leftIdx < state.left.length &&
		state.rightIdx >= state.right.length
	) {
		state.merged.push(state.left[state.leftIdx++]);
	}

	while (
		state.rightIdx < state.right.length &&
		state.leftIdx >= state.left.length
	) {
		state.merged.push(state.right[state.rightIdx++]);
	}

	if (
		state.leftIdx >= state.left.length &&
		state.rightIdx >= state.right.length
	) {
		for (let i = 0; i < state.merged.length; i++) {
			state.result[state.start + i] = state.merged[i];
		}

		state.start += state.size * 2;
		return initNextMerge(state);
	}

	return state;
};

export const createState = (
	characters: Character[],
	override: ResultData | null,
) => {
	interface PersistedState {
		slug: string | null;
		cardType: CardType;
		step: number;
		history: SortState[];
		current: SortState;
	}

	let persisted: PersistedState | null = null;
	if (characters.length === 0 && !override) {
		const data = localStorage.getItem(CHARACTER_SORTER_STATE_KEY);
		if (data) {
			persisted = devalue.parse(data);
			if (persisted && !persisted.slug) persisted.slug = null;
		}
	}

	const items = persisted?.current.result ?? characters;
	const state = useDeepSignal({
		slug: override?.slug ?? persisted?.slug ?? null,

		cardType: persisted?.cardType ?? "normal",
		toggleCardType: () => {
			state.cardType = state.cardType === "normal" ? "trained" : "normal";
		},

		items: [...items],

		get max() {
			return worstCaseComparisons(items.length);
		},
		step: override?.step ?? persisted?.step ?? 0,
		get progress() {
			if (state.max <= 0) return 100;

			return Math.min(100, Math.round((state.step / state.max) * 100));
		},

		history: persisted?.history ?? [],
		current:
			persisted?.current ??
			initNextMerge({
				result: [...items],
				left: [],
				right: [],
				merged: [],
				ties: new Set(),
				leftIdx: 0,
				rightIdx: 0,
				size: 1,
				start: 0,
			}),

		get dsu() {
			return getDsu(
				state.items.map(({ slug }) => slug),
				state.current.ties,
			);
		},
		get numGroups() {
			const roots = new Set<string>();
			for (const { slug } of items) {
				roots.add(state.dsu.find(slug));
			}

			return roots.size;
		},

		get done() {
			return (
				override?.done ??
				((state.current.left.length === 0 &&
					state.current.right.length === 0) ||
					(state.items.length > 0 && state.numGroups === 1))
			);
		},
		get pair() {
			if (state.done) return null;

			return {
				left: state.current.left[state.current.leftIdx],
				right: state.current.right[state.current.rightIdx],
			};
		},
		get rankings() {
			if (override) return override.rankings;
			else if (!state.done) return [];

			const results: RankResult[] = [];
			const { result } = state.current;
			const { find } = state.dsu;

			let rank = 1;
			for (let i = 0; i < result.length; i++) {
				if (i > 0 && find(result[i - 1].slug) !== find(result[i].slug)) {
					rank = i + 1;
				}

				results.push({ rank, character: result[i] });
			}

			return results;
		},

		choose: (result: CompareResult) => {
			let current = state.current;
			state.history.push({
				...current,
				ties: new Set(current.ties),
				result: [...current.result],
				merged: [...current.merged],
				left: [...current.left],
			});

			current = applyComparison({ ...current }, result);

			const { find } = getDsu(
				items.map(({ slug }) => slug),
				current.ties,
			);

			while (current.left.length > 0 && current.right.length > 0) {
				const a = current.left[current.leftIdx];
				const b = current.right[current.rightIdx];

				if (a && b && find(a.slug) === find(b.slug))
					current = applyComparison({ ...current }, "tie");
				else break;
			}

			state.current = current;
			state.step++;
		},

		undo: () => {
			if (state.history.length === 0) return;

			state.current = state.history.pop()!;
			state.step--;
		},
		get canUndo() {
			return state.history.length > 0;
		},
	});

	if (!override) {
		useSignalEffect(() => {
			const data = devalue.stringify(
				pick(state, [
					"slug",
					"cardType",
					"step",
					"history",
					"current",
				]) satisfies PersistedState,
			);

			localStorage.setItem(CHARACTER_SORTER_STATE_KEY, data);
		});

		useSignalEffect(() => {
			if (state.slug) {
				history.replaceState(null, "", `/page/character-sorter/${state.slug}`);
			}
		});
	}

	// required to avoid:
	// error ts(2527): The inferred type of 'createState' references an inaccessible 'unique symbol' type. A type annotation is necessary.
	type UnwrapDeepSignal<T> = T extends DeepSignal<infer V> ? V : never;
	return state as UnwrapDeepSignal<typeof state>;
};

export type State = ReturnType<typeof createState>;
export const CharacterSorterState = createContext<State | null>(null);
