import clsx from "clsx";
import { useContext } from "preact/hooks";

import { IMAGE_FORMAT } from "~/lib/compressor/constants";
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
			class={clsx("rounded-field size-10 bg-white/67", className)}
			src={`/assets/cards/${character.card}-icon-${cardType}.${IMAGE_FORMAT}`}
			alt={`${character.name} icon`}
			key={`${character.slug}-icon-${cardType}`}
		/>
	);
};
