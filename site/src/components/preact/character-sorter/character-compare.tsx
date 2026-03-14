import { IMAGE_FORMAT } from "@hina-is/bestdori/constants";

import { useSignalEffect } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import clsx from "clsx";
import { useContext } from "preact/hooks";

import { CharacterIcon } from "./character-icon";
import { CharacterSorterState, type Character } from "./state";

interface CharacterCompareImageProps {
	character: Character;
	side: "left" | "right";
}

const CharacterCompareImage = ({
	character,
	side,
}: CharacterCompareImageProps) => {
	const { cardType } = useContext(CharacterSorterState)!;

	return (
		<div class="bg-character" data-character={character.slug}>
			<img
				class="w-full"
				src={`/assets/cards/${character.card}-full-${cardType}.${IMAGE_FORMAT}`}
				alt={`${character.name} card`}
				key={`${character.slug}-${cardType}`}
			/>

			<div
				class={clsx(
					"rounded-field bg-character/80 text-character-content max-sm:btn-sm absolute bottom-1.5 flex items-center gap-2 px-4 py-1 text-sm",
					side === "left" && "left-1.5 pl-1",
					side === "right" && "right-1.5 flex-row-reverse pr-1 text-end",
				)}
			>
				<CharacterIcon character={character} />

				<div class="flex flex-col -space-y-0.5 text-xs font-medium">
					{character.name.split(" ").map((name) => (
						<span>{name}</span>
					))}
				</div>
			</div>
		</div>
	);
};

export const CharacterCompare = () => {
	const { pair, choose, undo, canUndo } = useContext(CharacterSorterState)!;
	const { left, right } = pair!;

	const containerElement = useSignalRef<HTMLElement | null>(null);
	const resizerElement = useSignalRef<HTMLDivElement | null>(null);
	useSignalEffect(() => {
		if (!containerElement.current || !resizerElement.current) return;

		let lastScrollX = 0;
		const container = containerElement.current;
		const resizer = resizerElement.current;
		const resizerStyle = getComputedStyle(resizer);
		const minScrollX = parseInt(resizerStyle.minWidth);
		const maxScrollX = parseInt(resizerStyle.maxWidth);

		const handleSwipe = (event: TouchEvent) => {
			lastScrollX = event.changedTouches[0].clientX;

			const handleTouchMove = (event: TouchEvent) => {
				const newScrollX = event.changedTouches[0].clientX;
				const delta = (newScrollX - lastScrollX) * 2;
				lastScrollX = newScrollX;

				resizer.style.width = `${resizer.clientWidth + delta}px`;
			};

			const target = event.target as HTMLElement;
			target.addEventListener("touchmove", handleTouchMove, { passive: true });
			target.addEventListener(
				"touchend",
				() => target.removeEventListener("touchmove", handleTouchMove),
				{ once: true },
			);
		};

		let expanding: ReturnType<typeof setTimeout>;
		const handleSideClick = (event: PointerEvent) => {
			if (event.target === resizer) return;

			const expandTo =
				event.layerX > container.clientWidth / 2 ? minScrollX : maxScrollX;

			clearTimeout(expanding);
			resizer.style.transition = "width 0.3s cubic-bezier(1, 0.25, 0.25, 1)";
			resizer.style.width = `${expandTo}px`;
			expanding = setTimeout(() => (resizer.style.transition = ""), 500);
		};

		container.addEventListener("touchstart", handleSwipe, { passive: true });
		container.addEventListener("click", handleSideClick);
		return () => {
			container!.removeEventListener("touchstart", handleSwipe);
			container!.removeEventListener("click", handleSideClick);
		};
	});

	return (
		<>
			<figure
				class="diff sm:rounded-box aspect-4/3 cursor-pointer max-sm:w-full sm:h-80"
				ref={containerElement}
			>
				<div class="diff-item-1">
					<CharacterCompareImage character={left} side="left" />
				</div>
				<div class="diff-item-2">
					<CharacterCompareImage character={right} side="right" />
				</div>

				<div
					class="diff-resizer"
					key={`${left.slug}|${right.slug}`}
					ref={resizerElement}
				></div>
			</figure>

			<div class="mt-2 flex items-center justify-between max-sm:mx-2">
				<button
					class="btn btn-character btn-square"
					data-character={left.slug}
					onClick={() => choose("left")}
				>
					<iconify-icon
						class="size-4"
						icon="lucide:arrow-left"
						width="none"
					></iconify-icon>
				</button>

				<div class="join w-36">
					<button
						class="btn btn-warning btn-sm join-item flex-1"
						onClick={() => choose("tie")}
					>
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
						onClick={undo}
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
					data-character={right.slug}
					onClick={() => choose("right")}
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
};
