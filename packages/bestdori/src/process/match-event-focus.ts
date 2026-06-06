import path from "node:path";

import { ApiError, GoogleGenAI } from "@google/genai";
import { retry } from "es-toolkit";

import { bestdori } from "..";
import type { asset } from "../assets";
import { optimizeForVisionAPI } from "../preprocess/vision";
import { getOutputFile } from "../utilities";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MATCH_EVENT_FOCUS_PROMPT = await Bun.file(
	path.join(import.meta.dir, "match-event-focus.md"),
).text();

export interface EventPayload {
	banner: ReturnType<typeof asset>;
	cards: ReturnType<typeof asset>[];
}

const getCardTrimPathname = (pathname: string) =>
	pathname.replace(/card_normal\.png$/, "trim_normal.png");

const VERSION = "20260606";

export const matchEventFocus = async (
	eventPayloads: EventPayload[],
): Promise<Record<string, string>> => {
	if (eventPayloads.length === 0 || eventPayloads.length > 3) {
		throw new Error("Payload must contain 1 to 3 event items");
	}

	const inputs = await Promise.all(
		eventPayloads.map(async ({ banner, cards }) => {
			const { file, hash } = await bestdori(banner.pathname, !banner.redownload);
			const name = path.basename(banner.pathname) + "." + hash;
			const outputFile = await getOutputFile({
				script: "match-event-focus",
				version: VERSION,
				name,
				extension: "json",
			});

			const alreadyExists = (await outputFile.exists()) && outputFile.size > 0;
			if (alreadyExists) {
				return { outputFile, alreadyExists: true };
			}

			const bannerBuffer = Buffer.from(await file.arrayBuffer());
			const cardBuffers = await Promise.all(
				cards.map(async (card) => {
					const { file } = await bestdori(
						getCardTrimPathname(card.pathname),
						!card.redownload,
					);
					return { pathname: card.pathname, buffer: Buffer.from(await file.arrayBuffer()) };
				}),
			);

			return { outputFile, alreadyExists: false, banner: { pathname: banner.pathname, buffer: bannerBuffer }, cards: cardBuffers };
		}),
	);

	await Promise.all(
		inputs
			.filter((input): input is Extract<typeof inputs[number], { alreadyExists: false }> => !input.alreadyExists)
			.map(async ({ banner, cards, outputFile }) => {
				const bannerImage = await optimizeForVisionAPI(banner.pathname, banner.buffer);
				const bannerBlob = await bannerImage.blob();
				const bannerData = Buffer.from(await bannerBlob.arrayBuffer()).toBase64();

				const cardImages = await Promise.all(
					cards.map(async ({ pathname, buffer }) => {
						const image = await optimizeForVisionAPI(pathname, buffer);
						const blob = await image.blob();
						return { pathname, data: Buffer.from(await blob.arrayBuffer()).toBase64() };
					}),
				);

				const response = await retry(
					() =>
						ai.models.generateContent({
							model: "gemini-3.1-flash-lite",
							contents: {
								parts: [
									{ inlineData: { mimeType: "image/jpeg", data: bannerData }, text: `banner: ${banner.pathname}` },
									...cardImages.map(({ pathname, data }) => ({
										inlineData: { mimeType: "image/jpeg", data },
										text: `card: ${pathname}`,
									})),
									{ text: MATCH_EVENT_FOCUS_PROMPT },
								],
							},
						}),
					{
						delay: (attempts) =>
							Math.min(Math.random() * 1000 * 2 ** attempts, 15000),
						retries: 30,
						shouldRetry: (error) =>
							error instanceof ApiError &&
							(error.status === 429 || error.status === 503),
					},
				);

				if (!response.text) {
					throw new Error("Empty response from Gemini API");
				}
				const result = JSON.parse(response.text);
				await outputFile.write(JSON.stringify(result));
			}),
	);

	return Promise.all(
		inputs.map(({ outputFile }) => Bun.file(outputFile.name!).text().then(JSON.parse)),
	).then((results) => Object.assign({}, ...results));
};