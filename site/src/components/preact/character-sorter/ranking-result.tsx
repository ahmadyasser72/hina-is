import clsx from "clsx";
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
						class="group indicator w-full indicator-center max-md:col-span-2 max-md:first:col-start-2"
						key={character.slug}
					>
						<div class="indicator-item badge px-2 badge-sm badge-accent group-nth-[-n+5]:badge-lg">
							#{rank}
						</div>

						<div
							class="flex w-full items-center gap-2 rounded-box bg-character p-2 px-4 group-nth-[-n+5]:flex-col group-nth-[-n+5]:justify-center group-nth-[-n+5]:pt-5"
							data-character={character.slug}
						>
							<CharacterIcon
								class="group-nth-[-n+5]:size-24"
								character={character}
							/>

							<span
								class={clsx(
									"font-medium text-character-content group-nth-[-n+5]:text-center group-nth-[n+6]:whitespace-pre",
									character.name.includes(" ") ? "text-xs" : "text-sm",
								)}
							>
								{character.name.split(" ").join("\n")}
							</span>
						</div>
					</li>
				))}
			</ol>
		</div>
	);
};
