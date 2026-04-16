import path from "node:path";

import { ApiError, GoogleGenAI } from "@google/genai";
import { retry } from "es-toolkit";

import { bestdori } from "..";
import type { asset } from "../assets";
import { getOutputFile } from "../utilities";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DO_OCR_PROMPT = `Extract text from the image.

Rules:
- If the text is Japanese, convert to romaji then translate them and output all original, romaji, and translated separated by ;".
- If the text is English, keep it as-is.
- There can only be 1 language, if both Japanese and English exists skip Japanese.
- Remove unusual space like in "I' m".
- Treat separated text as one, read from right to left.
- Output ONLY the final text.
- No explanations, no labels.

If nothing is readable, return empty string.`;

const formatOcrResult = (text: string) => {
	if (!text.includes(";")) return text;
	const [japanese, romaji, translate] = text.split(";");
	return { japanese, romaji, translate };
};

export const doStampOcr = async ({
	pathname,
	redownload,
}: ReturnType<typeof asset>) => {
	const { file, hash } = await bestdori(pathname, !redownload);
	const buffer = Buffer.from(await file.arrayBuffer());

	const name = path.basename(file.name!);
	const outputFile = await getOutputFile({
		script: import.meta.filename,
		version: "20260416",
		name: [name.replace(path.extname(name), ""), hash].join("."),
		extension: "txt",
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists && !redownload)
		return outputFile.text().then(formatOcrResult);

	const { text } = await retry(
		() =>
			ai.models.generateContent({
				model: "gemini-3.1-flash-lite-preview", // 15 rpm limit on free tier
				contents: {
					parts: [
						{
							inlineData: {
								mimeType: file.type,
								data: buffer.toBase64(),
							},
						},
						{ text: DO_OCR_PROMPT },
					],
				},
			}),
		{
			delay: 10_000,
			retries: 3,
			shouldRetry: (error) =>
				error instanceof ApiError &&
				(error.status === 429 || // too many request
					error.status === 503), // unavailable (server overload)
		},
	);

	const output = text!.trim().replace(/\s+/g, " ");
	await outputFile.write(output);
	return formatOcrResult(output);
};
