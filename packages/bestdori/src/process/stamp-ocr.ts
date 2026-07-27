import { openAsBlob } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ApiError, GoogleGenAI } from "@google/genai";
import { retry } from "es-toolkit";

import { bestdori, exists } from "..";
import type { asset } from "../assets";
import { getOutputFile } from "../utilities";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const STAMP_OCR_PROMPT = (
	await readFile(path.join(import.meta.dirname, "stamp-ocr.md"))
).toString();
const EMPTY = "[[EMPTY]]";

const formatOcrResult = (text: string) => {
	if (!text.includes("|")) return text === EMPTY ? "" : text;

	const parts = text.split("|");
	if (!parts.every(Boolean)) return "";

	const [japanese, romaji, translate] = parts;
	return { japanese, romaji, translate };
};

export const doStampOcr = async (items: ReturnType<typeof asset>[]) => {
	const inputs = await Promise.all(
		items.map(async ({ pathname, redownload }) => {
			const { file, hash } = await bestdori(pathname, !redownload);

			const name = path.basename(file);
			const outputPath = await getOutputFile({
				script: "stamp-ocr",
				version: "20260508",
				name: [name.replace(path.extname(name), ""), hash].join("."),
				extension: "txt",
			});

			const alreadyExists = await exists(outputPath, true);

			return {
				file,
				outputPath,
				alreadyExists,
				redownload,
			};
		}),
	);

	const images = await Promise.all(
		inputs
			.filter(({ alreadyExists, redownload }) => !alreadyExists || redownload)
			.map(async ({ file, outputPath }) => {
				const blob = await openAsBlob(file);
				const buffer = Buffer.from(await blob.arrayBuffer());
				return {
					outputPath,
					inlineData: { mimeType: blob.type, data: buffer.toString("base64") },
				};
			}),
	);

	if (images.length > 0) {
		const response = await retry(
			() =>
				ai.models.generateContent({
					model: "gemini-3.1-flash-lite",
					contents: {
						parts: [
							...images.map(({ inlineData }) => ({ inlineData })),
							{ text: STAMP_OCR_PROMPT },
						],
					},
				}),
			{
				delay: (attempts) =>
					Math.min(Math.random() * 1000 * 2 ** attempts, 15000),
				retries: 30,
				shouldRetry: (error) =>
					error instanceof ApiError &&
					(error.status === 429 || // too many request
						error.status === 503), // unavailable (server overload)
			},
		);

		const lines = (response.text ?? "").split("\n");
		await Promise.all(
			images.map(async ({ outputPath }, index) => {
				const trimmed = (lines[index] ?? "").trim().replace(/\s+/g, " ");
				await writeFile(outputPath, trimmed);
			}),
		);
	}

	return Promise.all(
		inputs.map(({ outputPath }) =>
			readFile(outputPath)
				.then((buffer) => buffer.toString())
				.then(formatOcrResult),
		),
	);
};
