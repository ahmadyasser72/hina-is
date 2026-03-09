import { useComputed, useSignal, useSignalEffect } from "@preact/signals";
import * as devalue from "devalue";

import { IMAGE_FORMAT } from "~/lib/compressor/constants";

export const CHARACTER_SORTER_STATE_KEY = "hina-is-sorter-state";

type Character = Record<"name" | "slug" | "card", string>;
type RankResult = { rank: number; character: Character };
type CompareResult = "left" | "right" | "tie";

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

interface CharacterDisplayProps {
	character: Character;
	side: "left" | "right";
	cardType: string;
}

const CharacterDisplay = ({
	character,
	side,
	cardType,
}: CharacterDisplayProps) => (
	<div class="bg-character" data-character={character.slug}>
		<img
			class="w-full"
			src={`/assets/cards/${character.card}-full-${cardType}.${IMAGE_FORMAT}`}
			alt={`${character.name} card`}
			key={`${character.slug}-${cardType}`}
		/>

		<div
			class={`rounded-field bg-character/80 text-character-content max-sm:btn-sm absolute bottom-1.5 flex items-center gap-2 px-4 py-1 text-sm ${side === "left" ? "left-1.5 pl-1" : "right-1.5 flex-row-reverse pr-1 text-end"}`}
		>
			<img
				class="rounded-field bg-character-content/67 size-10"
				src={`/assets/cards/${character.card}-icon-${cardType}.${IMAGE_FORMAT}`}
				alt={`${character.name} icon`}
				key={`${character.slug}-icon-${cardType}`}
			/>

			<div class="flex flex-col -space-y-0.5 text-xs font-medium">
				{character.name.split(" ").map((name) => (
					<span>{name}</span>
				))}
			</div>
		</div>
	</div>
);

interface SortCharacterProps {
	a: Character;
	b: Character;
	onLeft: () => void;
	onRight: () => void;
	onTie: () => void;
	onUndo: () => void;
	canUndo: boolean;
	cardType: string;
}

const SortCharacter = ({
	a,
	b,
	onLeft,
	onRight,
	onTie,
	onUndo,
	canUndo,
	cardType,
}: SortCharacterProps) => (
	<>
		<figure class="diff sm:rounded-box aspect-4/3 max-sm:w-full sm:h-80">
			<div class="diff-item-1">
				<CharacterDisplay cardType={cardType} character={a} side="left" />
			</div>
			<div class="diff-item-2">
				<CharacterDisplay cardType={cardType} character={b} side="right" />
			</div>

			<div class="diff-resizer" key={`${a.slug}|${b.slug}`}></div>
		</figure>

		<div class="mt-2 flex items-center justify-between max-sm:mx-2">
			<button
				class="btn btn-character btn-square"
				data-character={a.slug}
				onClick={onLeft}
			>
				<iconify-icon
					class="size-4"
					icon="lucide:arrow-left"
					width="none"
				></iconify-icon>
			</button>

			<div class="join w-36">
				<button class="btn btn-warning btn-sm join-item flex-1" onClick={onTie}>
					Tie
					<iconify-icon
						class="size-3"
						icon="lucide:arrow-left-right"
						width="none"
					></iconify-icon>
				</button>
				<button
					class="btn btn-error btn-sm join-item flex-1"
					disabled={!canUndo}
					onClick={onUndo}
				>
					Undo
					<iconify-icon
						class="size-3"
						icon="lucide:undo"
						width="none"
					></iconify-icon>
				</button>
			</div>

			<button
				class="btn btn-character btn-square"
				data-character={b.slug}
				onClick={onRight}
			>
				<iconify-icon
					class="size-4"
					icon="lucide:arrow-right"
					width="none"
				></iconify-icon>
			</button>
		</div>
	</>
);

interface CharacterSorterProps {
	characters: Character[];
}

export default function CharacterSorter({ characters }: CharacterSorterProps) {
	interface PersistedState {
		isTrained: boolean;
		sortCount: number;
		history: SortState[];
		sortState: SortState;
	}

	const persisted = ((): PersistedState | null => {
		try {
			const data = localStorage.getItem(CHARACTER_SORTER_STATE_KEY);
			if (data) return devalue.parse(data);
		} catch (e) {}

		return null;
	})();

	const isTrained = useSignal(persisted?.isTrained ?? false);
	const cardType = useComputed(() => (isTrained.value ? "trained" : "normal"));

	const max = worstCaseComparisons(characters.length);
	const sortCount = useSignal(persisted?.sortCount ?? 0);
	const history = useSignal<SortState[]>(persisted?.history ?? []);
	const sortState = useSignal<SortState>(
		persisted?.sortState ??
			initNextMerge({
				result: [...characters],
				left: [],
				right: [],
				merged: [],
				ties: new Set(),
				leftIdx: 0,
				rightIdx: 0,
				size: 1,
				start: 0,
			}),
	);

	useSignalEffect(() => {
		const data = devalue.stringify({
			isTrained: isTrained.value,
			sortCount: sortCount.value,
			history: history.value,
			sortState: sortState.value,
		} satisfies PersistedState);
		localStorage.setItem(CHARACTER_SORTER_STATE_KEY, data);
	});

	const done = useComputed(
		() =>
			sortState.value.left.length === 0 && sortState.value.right.length === 0,
	);
	const progress = useComputed(() =>
		max > 0 ? Math.min(100, Math.round((sortCount.value / max) * 100)) : 100,
	);
	const pair = useComputed(() =>
		done.value
			? null
			: {
					a: sortState.value.left[sortState.value.leftIdx],
					b: sortState.value.right[sortState.value.rightIdx],
				},
	);

	const rankings = useComputed(() => {
		if (!done.value) return [];

		const results: RankResult[] = [];
		const { result, ties } = sortState.value;

		const parents = new Map<string, string>();
		const find = (id: string): string => {
			if (!parents.has(id)) parents.set(id, id);
			const p = parents.get(id)!;
			if (p === id) return id;
			const root = find(p);
			parents.set(id, root);
			return root;
		};

		const union = (a: string, b: string) => {
			const rootA = find(a);
			const rootB = find(b);
			if (rootA !== rootB) parents.set(rootA, rootB);
		};

		for (const tie of ties) {
			const [a, b] = tie.split("|");
			union(a, b);
		}

		let rank = 1;
		for (let i = 0; i < result.length; i++) {
			if (i > 0 && find(result[i - 1].slug) !== find(result[i].slug)) {
				rank = i + 1;
			}

			results.push({ rank, character: result[i] });
		}

		return results;
	});

	const choose = (result: CompareResult) => {
		const state = sortState.value;
		history.value = [
			...history.value,
			{
				...state,
				ties: new Set(state.ties),
				result: [...state.result],
				merged: [...state.merged],
				left: [...state.left],
				right: [...state.right],
			},
		];

		sortState.value = applyComparison({ ...state }, result);
		sortCount.value++;
	};

	const undo = () => {
		if (history.value.length === 0) return;

		sortState.value = history.value.pop()!;
		history.value = [...history.value];
		sortCount.value--;
	};

	const reset = () => {
		if (!confirm("Are you sure you want to reset this sorting session?"))
			return;

		while (history.value.length > 0) undo();
	};

	return (
		<div
			class={`relative mx-auto flex-1 ${done.value ? "w-full max-w-4xl" : "max-sm:w-full"}`}
		>
			<div class="absolute inset-x-0 top-1.5 z-20 grid place-items-center">
				<div class="join w-48">
					<button class="btn btn-xs btn-info join-item pointer-events-none flex-1">
						{done.value
							? `Sorted in ${sortCount.value}x`
							: `Sort #${sortCount.value + 1} (${progress.value}%)`}
					</button>

					<input
						class="peer hidden"
						id="card_type"
						name="card_type"
						type="checkbox"
						checked={isTrained.value}
						onChange={() => (isTrained.value = !isTrained.value)}
					/>
					<label
						class="btn btn-xs tooltip tooltip-bottom join-item btn-neutral peer-checked:btn-accent flex-1 before:text-xs"
						data-tip="Toggle card type"
						for="card_type"
					>
						<iconify-icon
							class="size-3"
							icon={isTrained.value ? "lucide:sparkles" : "lucide:image"}
							width="none"
						></iconify-icon>
						{isTrained.value ? "Trained" : "Base"}
					</label>
				</div>
			</div>

			{done.value ? (
				<div class="mt-16 px-6 sm:px-8">
					<ol class="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-5">
						{rankings.value.map(({ rank, character }) => (
							<li
								class="indicator indicator-center group w-full max-md:col-span-2 max-md:first:col-start-2"
								key={character.slug}
							>
								<div class="badge badge-sm indicator-item md:group-nth-[-n+5]:badge-lg max-md:group-nth-[-n+3]:badge-lg badge-accent px-2">
									#{rank}
								</div>

								<div
									class="bg-character rounded-box flex w-full items-center gap-2 p-2 px-4 group-nth-[-n+3]:flex-col group-nth-[-n+3]:justify-center group-nth-[-n+3]:pt-5 md:group-nth-[-n+5]:flex-col md:group-nth-[-n+5]:justify-center md:group-nth-[-n+5]:pt-5"
									data-character={character.slug}
								>
									<img
										class="rounded-field bg-character-content/67 size-10 group-nth-[-n+3]:size-24 md:group-nth-[-n+5]:size-24"
										src={`/assets/cards/${character.card}-icon-${cardType.value}.${IMAGE_FORMAT}`}
										alt={`${character.name} icon`}
										key={`${character.slug}-icon-${cardType.value}`}
									/>

									<span class="text-character-content text-xs font-medium group-nth-[-n+3]:text-center md:group-nth-[-n+5]:text-center">
										{character.name}
									</span>
								</div>
							</li>
						))}
					</ol>
				</div>
			) : (
				<SortCharacter
					a={pair.value!.a}
					b={pair.value!.b}
					canUndo={history.value.length > 0}
					cardType={cardType.value}
					onLeft={() => choose("left")}
					onRight={() => choose("right")}
					onTie={() => choose("tie")}
					onUndo={undo}
				/>
			)}
		</div>
	);
}
