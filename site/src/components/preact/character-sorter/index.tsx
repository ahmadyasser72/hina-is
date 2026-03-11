import { useSignalRef } from "@preact/signals/utils";
import clsx from "clsx";

import { CharacterCompare } from "./character-compare";
import { CharacterSorterActions } from "./character-sorter-actions";
import { RankingResult } from "./ranking-result";
import { CharacterSorterState, createState, type Character } from "./state";

interface CharacterSorterProps {
	characters: Character[];
}

export const CharacterSorter = ({ characters }: CharacterSorterProps) => {
	const state = createState(characters);
	const resultElement = useSignalRef<HTMLDivElement | null>(null);

	return (
		<CharacterSorterState.Provider value={state}>
			<div
				class={clsx(
					"relative mx-auto grid",
					state.done ? "w-full max-w-4xl gap-6 py-4" : "max-sm:w-full",
				)}
				ref={resultElement}
			>
				<CharacterSorterActions resultElement={resultElement} />

				{state.done ? <RankingResult /> : <CharacterCompare />}
			</div>
		</CharacterSorterState.Provider>
	);
};
