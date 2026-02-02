import { stamps } from "@hina-is/bestdori/data";

import { Redis } from "@upstash/redis";
import type { APIRoute } from "astro";
import {
	UPSTASH_REDIS_REST_TOKEN,
	UPSTASH_REDIS_REST_URL,
} from "astro:env/server";
import { createResponse } from "better-sse";

export interface StampPayload {
	id: string;
	voiced: boolean;
	sender: string;
}

const redis = new Redis({
	url: UPSTASH_REDIS_REST_URL,
	token: UPSTASH_REDIS_REST_TOKEN,
});

export const GET: APIRoute = async ({ request, locals }) => {
	return createResponse(request, async (session) => {
		const channel = redis.subscribe<StampPayload>("default");
		channel.on("message", ({ message }) => {
			if (message.sender !== locals.clientId)
				session.push(message, "send-stamp");
		});
	});
};

export const POST: APIRoute = async ({ request, locals }) => {
	const payload = await request.formData();

	const id = payload.get("id");
	const stamp = stamps.find((it) => it.id === id);
	if (!stamp) return new Response(null, { status: 404 });

	const data = {
		id: stamp.id,
		voiced: !!stamp.voice,
		sender: locals.clientId,
	} satisfies StampPayload;
	await redis.publish("default", data);

	return new Response(null, { status: 204 });
};
