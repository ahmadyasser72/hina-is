import { IMAGE_FORMAT } from "@hina-is/bestdori/constants";

import clsx from "clsx";
import { useContext } from "preact/hooks";

import { CharacterSorterState, type Character } from "./state";

interface CharacterIconProps {
	character: Character;
	class?: string;
}

export const CharacterIcon = ({
	character,
	class: className,
}: CharacterIconProps) => {
	const { cardType } = useContext(CharacterSorterState)!;

	return (
		<img
			class={clsx("size-10 rounded-field bg-white/67", className)}
			src={`/assets/cards/${character.card}-icon-${cardType}.${IMAGE_FORMAT}`}
			alt={`${character.name} icon`}
			key={`${character.slug}-icon-${cardType}`}
		/>
	);
};
