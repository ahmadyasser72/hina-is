import path from "node:path";

import { ApiError, GoogleGenAI } from "@google/genai";
import { retry } from "es-toolkit";

import { bestdori } from "..";
import type { asset } from "../assets";
import { getOutputFile } from "../utilities";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DO_OCR_PROMPT = await Bun.file(
	path.join(import.meta.dir, "stamp-ocr.txt"),
).text();

const formatOcrResult = (text: string) => {
	if (!text.includes("|")) return text;
	const [japanese, romaji, translate] = text.split("|");
	return { japanese, romaji, translate };
};

export const doStampOcr = async (items: ReturnType<typeof asset>[]) => {
	const inputs = await Promise.all(
		items.map(async ({ pathname, redownload }) => {
			const { file, hash } = await bestdori(pathname, !redownload);

			const name = path.basename(file.name!);
			const outputFile = await getOutputFile({
				script: "stamp-ocr",
				version: "20260418",
				name: [name.replace(path.extname(name), ""), hash].join("."),
				extension: "txt",
			});

			const alreadyExists = (await outputFile.exists()) && outputFile.size > 0;

			return {
				file,
				outputFile,
				alreadyExists,
				redownload,
			};
		}),
	);

	const images = await Promise.all(
		inputs
			.filter(({ alreadyExists, redownload }) => !alreadyExists || redownload)
			.map(async ({ file, outputFile }) => {
				const buffer = Buffer.from(await file.arrayBuffer());
				return {
					outputFile,
					inlineData: { mimeType: file.type, data: buffer.toBase64() },
				};
			}),
	);

	if (images.length > 0) {
		const response = await retry(
			() =>
				ai.models.generateContent({
					model: "gemini-3.1-flash-lite-preview", // 15 rpm limit on free tier
					contents: {
						parts: [
							...images.map(({ inlineData }) => ({ inlineData })),
							{ text: DO_OCR_PROMPT },
						],
					},
				}),
			{
				delay: (attempts) =>
					Math.min(Math.random() * 1000 * 2 ** attempts, 15000),
				retries: 10,
				shouldRetry: (error) =>
					error instanceof ApiError &&
					(error.status === 429 || // too many request
						error.status === 503), // unavailable (server overload)
			},
		);

		const lines = (response.text ?? "").split("\n");
		await Promise.all(
			images.map(async ({ outputFile }, index) => {
				const output = (lines[index] ?? "").trim().replace(/\s+/g, " ");
				await outputFile.write(output);
			}),
		);
	}

	return Promise.all(
		inputs.map(({ outputFile }) =>
			Bun.file(outputFile.name!).text().then(formatOcrResult),
		),
	);
};
