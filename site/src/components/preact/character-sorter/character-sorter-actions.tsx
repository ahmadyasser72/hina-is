import { useSignalEffect } from "@preact/signals";
import { useSignalRef } from "@preact/signals/utils";
import { actions } from "astro:actions";
import clsx from "clsx";
import { useDeepSignal } from "deepsignal";
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
	const output = useDeepSignal({
		blob: null as Blob | null,

		loading: null as "capture" | "upload" | null,
		get loadingText() {
			if (output.loading === "capture") return "Capturing...";
			else if (output.loading === "upload") return "Processing...";
			else return null;
		},

		capture: async (event: Event) => {
			if (!resultElement.current || output.loading) return;

			event.preventDefault();
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
				document
					.querySelector<HTMLElement>("#popover-capture")!
					.togglePopover();
			}
		},
		upload: async () => {
			if (state.slug || !output.blob) return;

			try {
				output.loading = "upload";

				const data = await actions.characterSorter.createShareLink.orThrow({
					done: state.done,
					rankings: state.rankings,
					step: state.step,
				});

				state.slug = data.slug;
			} catch (error) {
				console.error("Failed to process data:", error);
				alert("Failed to process data.");
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
			if (!state.slug || !output.blob) return;
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
			const alternatives = [
				`My favorite is ${top}`,
				`I love ${top}`,
				`${top} is the best`,
				`Team ${top}`,
				`My heart belongs to ${top}`,
			];

			const text =
				alternatives[Math.floor(Math.random() * alternatives.length)];
			const data = {
				title: document.title,
				text: `${text}! Rank your own favorites on hina-is.`,
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
						class="btn btn-xs tooltip tooltip-bottom join-item btn-neutral peer-checked:btn-accent flex-1"
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
						<span class="capitalize">{state.cardType}</span>
					</label>

					{state.done && (
						<button
							class={clsx(
								"btn btn-xs btn-secondary join-item flex-1",
								output.loading && "tooltip-open",
								(!output.blob || output.loading) && "tooltip tooltip-bottom",
							)}
							data-tip={output.loadingText ?? "Capture ranking results"}
							onClick={output.capture}
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
				class="dropdown dropdown-end mt-1 overflow-visible"
				id="popover-capture"
				popover
				style="position-anchor: --anchor-capture"
			>
				<div class="join join-vertical bg-base-100 rounded-field w-24">
					<button class="btn btn-sm join-item btn-info" onClick={output.save}>
						<iconify-icon
							class="size-4"
							icon="lucide:save"
							width="none"
						></iconify-icon>
						Save
					</button>

					<button
						class="btn btn-sm join-item btn-success"
						onClick={output.share}
					>
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
