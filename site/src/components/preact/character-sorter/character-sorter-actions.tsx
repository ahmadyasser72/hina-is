import { useSignal, useSignalEffect } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import clsx from "clsx";
import { useContext } from "preact/hooks";

import { CharacterSorterState } from "./state";

interface CharacterSorterActionsProps {
	resultElement: ReturnType<typeof useSignalRef<HTMLDivElement | null>>;
}

export const CharacterSorterActions = ({
	resultElement,
}: CharacterSorterActionsProps) => {
	const state = useContext(CharacterSorterState)!;

	const filename = "sort-result.webp";
	const isCapturing = useSignal<boolean>(false);
	const output = useSignal<Blob>();
	useSignalEffect(() => {
		state.cardType;
		output.value = undefined;
	});

	const capture = async (event: Event) => {
		if (!resultElement.current || isCapturing.value) return;

		event.preventDefault();
		try {
			if (output.value) return;

			isCapturing.value = true;

			const { snapdom } = await import("@zumer/snapdom");
			const styles = window.getComputedStyle(document.documentElement);
			output.value = await snapdom.toBlob(resultElement.current, {
				backgroundColor: styles.backgroundColor,
				embedFonts: true,

				scale: 1.67,
				quality: 67,
				type: "webp",

				plugins: [
					{
						name: "remove-tooltips",
						afterClone: ({ clone }) => {
							const tooltips = clone!.querySelectorAll(
								".tooltip > [data-snapdom-pseudo]",
							);
							tooltips.forEach((tooltip) => tooltip.remove());
						},
					},
				],
			});
		} catch (error) {
			console.error("Failed to capture results:", error);
			alert("Failed to capture results.");
		} finally {
			isCapturing.value = false;
			document.querySelector<HTMLElement>("#popover-capture")!.togglePopover();
		}
	};

	const save = () => {
		if (!output.value) return;

		const url = URL.createObjectURL(output.value);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	const share = async () => {
		if (!output.value) return;
		else if (!navigator.share || !navigator.canShare) {
			alert("Sharing is not supported in this browser.");
			return;
		}

		const file = new File([output.value], filename, {
			type: output.value.type,
		});
		const url = new URL("/page/character-sorter", window.location.origin).href;

		const top = state.rankings
			.filter(({ rank }) => rank === 1)
			.map(({ character }) => character.name)
			.join(", ");
		const alternatives = [
			`My favorite is ${top}`,
			`I love ${top}`,
			`${top} is the best`,
			`Team ${top}`,
			`My heart belongs to ${top}`,
		];

		const text = alternatives[Math.floor(Math.random() * alternatives.length)];
		const data = {
			title: document.title,
			text: `${text}! Rank your own favorites on hina-is.`,
			url,
		} satisfies ShareData;

		const canShareImage = navigator.canShare({ files: [file] });
		const payload = canShareImage ? { ...data, files: [file] } : data;
		await navigator.share(payload);
	};

	return (
		<>
			<div
				class={clsx(
					"z-20 grid place-items-center",
					!state.done && "absolute inset-x-0 top-1.5",
				)}
			>
				<div class={clsx("join", state.done ? "w-72" : "w-64")}>
					<button class="btn btn-xs btn-primary join-item pointer-events-none flex-1">
						{state.done
							? `Sorted in ${state.step}x`
							: `Sort #${state.step + 1} (${state.progress}%)`}
					</button>

					<input
						class="peer hidden"
						id="toggle_card_type"
						name="toggle_card_type"
						type="checkbox"
						checked={state.cardType === "trained"}
						onChange={state.toggleCardType}
					/>
					<label
						class="btn btn-xs tooltip tooltip-bottom join-item btn-neutral peer-checked:btn-accent flex-1 capitalize"
						data-tip="Toggle card type"
						for="toggle_card_type"
					>
						<iconify-icon
							class="size-3"
							icon={
								state.cardType === "trained"
									? "lucide:sparkles"
									: "lucide:image"
							}
							width="none"
						></iconify-icon>
						{state.cardType}
					</label>

					{state.done && (
						<button
							class={clsx(
								"btn btn-xs btn-secondary join-item flex-1",
								isCapturing.value && "tooltip-open",
								!output.value && "tooltip tooltip-bottom",
							)}
							data-tip={
								isCapturing.value ? "Capturing..." : "Capture ranking results"
							}
							onClick={capture}
							popoverTarget="popover-capture"
							style="anchor-name: --anchor-capture"
						>
							<iconify-icon
								class="size-3"
								icon="lucide:camera"
								width="none"
							></iconify-icon>
							Capture
						</button>
					)}
				</div>
			</div>

			<div
				class="dropdown dropdown-end mt-1 overflow-hidden"
				id="popover-capture"
				popover
				style="position-anchor: --anchor-capture"
			>
				<div class="join join-vertical w-24">
					<button class="btn btn-sm join-item btn-info" onClick={save}>
						<iconify-icon
							class="size-4"
							icon="lucide:save"
							width="none"
						></iconify-icon>
						Save
					</button>

					<button class="btn btn-sm join-item btn-success" onClick={share}>
						<iconify-icon
							class="size-4"
							icon="lucide:share"
							width="none"
						></iconify-icon>
						Share
					</button>
				</div>
			</div>
		</>
	);
};
