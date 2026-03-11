import { useContext } from "preact/hooks";

import { CharacterIcon } from "./character-icon";
import { CharacterSorterState } from "./state";

export const RankingResult = () => {
	const { rankings } = useContext(CharacterSorterState)!;

	return (
		<div class="px-8 max-sm:px-6">
			<ol class="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-5">
				{rankings.map(({ rank, character }) => (
					<li
						class="indicator indicator-center group w-full max-md:col-span-2 max-md:first:col-start-2"
						key={character.slug}
					>
						<div class="badge badge-sm indicator-item group-nth-[-n+5]:badge-lg badge-accent px-2">
							#{rank}
						</div>

						<div
							class="bg-character rounded-box flex w-full items-center gap-2 p-2 px-4 group-nth-[-n+5]:flex-col group-nth-[-n+5]:justify-center group-nth-[-n+5]:pt-5"
							data-character={character.slug}
						>
							<CharacterIcon
								class="group-nth-[-n+5]:size-24"
								character={character}
							/>

							<span class="text-character-content text-xs font-medium group-nth-[-n+5]:text-center">
								{character.name}
							</span>
						</div>
					</li>
				))}
			</ol>
		</div>
	);
};
