import { SITE_NAME } from "astro:env/client";

import { useSignalEffect } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import { actions } from "astro:actions";
import clsx from "clsx";
import { useDeepSignal } from "deepsignal";
import { sample } from "es-toolkit";
import { useContext } from "preact/hooks";

import { Icon } from "../icon";
import { CharacterSorterState } from "./state";

interface CharacterSorterActionsProps {
	resultElement: ReturnType<typeof useSignalRef<HTMLDivElement | null>>;
}

export const CharacterSorterActions = ({
	resultElement,
}: CharacterSorterActionsProps) => {
	const state = useContext(CharacterSorterState)!;

	const filename = "sort-result.webp";
	const output = useDeepSignal({
		blob: null as Blob | null,

		loading: null as "capture" | "upload" | null,
		get loadingText() {
			if (output.loading === "capture") return "Capturing...";
			else if (output.loading === "upload") return "Processing...";
			else return null;
		},

		capture: async (event: Event) => {
			event.preventDefault();
			if (!resultElement.current || output.loading) return;

			try {
				if (output.blob) return;

				output.loading = "capture";

				const { snapdom } = await import("@zumer/snapdom");
				const styles = window.getComputedStyle(document.documentElement);
				output.blob = await snapdom.toBlob(resultElement.current, {
					backgroundColor: styles.backgroundColor,
					embedFonts: true,

					scale: 1.67,
					quality: 67,
					type: "webp",

					exclude: [".dropdown"],
					excludeMode: "remove",
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
				output.loading = null;

				await output.upload();

				const { target } = event as Event & { target: HTMLButtonElement };
				const popover = target.popoverTargetElement as HTMLElement;
				popover.togglePopover();
			}
		},
		upload: async () => {
			if (state.slug !== null || !output.blob || output.loading) return;

			try {
				output.loading = "upload";

				const data = await actions.characterSorter.createShareLink.orThrow({
					done: state.done,
					rankings: state.rankings,
					step: state.step,
				});

				state.slug = data.slug;
			} catch (error) {
				console.error(error);
				state.slug = "";
			} finally {
				output.loading = null;
			}
		},

		save: () => {
			if (!output.blob) return;

			const url = URL.createObjectURL(output.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		},
		share: async () => {
			if (state.slug === null || !output.blob) return;
			else if (!navigator.share || !navigator.canShare) {
				alert("Sharing is not supported in this browser.");
				return;
			}

			const { blob } = output;
			const files = [new File([blob], filename, { type: blob.type })];

			const top = state.rankings
				.filter(({ rank }) => rank === 1)
				.map(({ character }) => character.name)
				.join(", ");
			const choices = [
				`My favorite is ${top}`,
				`I love ${top}`,
				`${top} is the best`,
				`Team ${top}`,
				`My heart belongs to ${top}`,
			];

			const text = sample(choices);
			const data = {
				title: document.title,
				text: `${text}! Rank your own favorites on ${SITE_NAME}.`,
				url: new URL(
					`/page/character-sorter/${state.slug}`,
					window.location.origin,
				).href,
			} satisfies ShareData;

			const payload = navigator.canShare({ files }) ? { ...data, files } : data;
			await navigator.share(payload);
		},
	});

	useSignalEffect(() => {
		state.cardType;
		output.blob = null;
	});

	return (
		<>
			<div
				class={clsx(
					"z-20 grid place-items-center",
					!state.done && "absolute inset-x-0 top-1.5",
				)}
			>
				<div class={clsx("join", state.done ? "w-72" : "w-64")}>
					<button class="btn pointer-events-none join-item flex-1 btn-xs btn-primary">
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
						class="tooltip btn tooltip-bottom join-item flex-1 btn-xs btn-neutral peer-checked:btn-accent"
						data-tip="Toggle card type"
						for="toggle_card_type"
					>
						<Icon
							class="size-3"
							name={
								state.cardType === "trained"
									? "lucide--sparkles"
									: "lucide--image"
							}
						></Icon>
						<span class="capitalize">{state.cardType}</span>
					</label>

					{state.done && (
						<button
							class={clsx(
								"btn join-item flex-1 btn-xs btn-secondary",
								output.loading && "tooltip-open",
								(!output.blob || output.loading) && "tooltip tooltip-bottom",
							)}
							data-tip={output.loadingText ?? "Capture ranking results"}
							data-umami-event="character-sorter-capture"
							data-umami-event-step={state.step}
							data-umami-event-top={state.rankings
								.slice(0, 10)
								.map(({ character }) => character.name)
								.join(", ")}
							onClick={output.capture}
							popoverTarget="popover-capture"
							style="anchor-name: --anchor-capture"
						>
							<Icon class="size-3" name="lucide--camera"></Icon>
							Capture
						</button>
					)}
				</div>
			</div>

			<div
				class="dropdown dropdown-end mt-1 overflow-visible"
				id="popover-capture"
				popover
				style="position-anchor: --anchor-capture"
			>
				<div class="join join-vertical w-24 rounded-field bg-base-100">
					<button
						class="btn join-item btn-sm btn-info"
						data-umami-event="character-sorter-capture-save"
						onClick={output.save}
					>
						<Icon name="lucide--save"></Icon>
						Save
					</button>

					<button
						class="btn join-item btn-sm btn-success"
						data-umami-event="character-sorter-capture-share"
						onClick={output.share}
					>
						<Icon name="lucide--share"></Icon>
						Share
					</button>
				</div>
			</div>
		</>
	);
};
