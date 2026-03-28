import * as data from "./data";
import type { ObjectValue } from "./data";

export type AssetType = keyof Pick<
	typeof data,
	"attributes" | "bands" | "characters" | "cards" | "events" | "stamps"
>;
export type DataForAsset<T extends AssetType> = ObjectValue<(typeof data)[T]>;

const latestStamps = new Set(
	data.recentNews.events.map(({ stamp }) => stamp.id),
);

const asset = (pathname: string, identifier: string, redownload = false) => ({
	pathname,
	identifier,
	redownload,
});
const regionAsset = (
	pathname: string,
	releasedAt: { en: number | null },
	identifier: string,
	redownload = false,
) =>
	asset(
		["/assets", releasedAt.en ? "en" : "jp", pathname].join("/"),
		identifier,
		redownload,
	);

export const getAsset = <T extends AssetType>(
	type: T,
	entry: DataForAsset<T>,
): Record<string, ReturnType<typeof asset>> => {
	const { id, slug } = entry;

	switch (type) {
		case "attributes": {
			return { [slug]: asset(`/res/icon/${slug}.svg`, "icon") };
		}

		case "bands": {
			const { color } = entry as DataForAsset<"bands">;
			if (color) return { [slug]: asset(`/res/icon/band_${id}.svg`, "icon") };
			break;
		}

		case "characters": {
			return { [slug]: asset(`/res/icon/chara_icon_${id}.png`, "icon") };
		}

		case "cards": {
			const chunkId = Math.floor(Number(id) / 50)
				.toString()
				.padStart(5, "0");
			const {
				gachaText,
				gachaType,
				releasedAt,
				resourceSetName,
				trainingState,
			} = entry as DataForAsset<"cards">;

			const normal = {
				[`${slug}-icon-normal`]: regionAsset(
					`thumb/chara/card${chunkId}_rip/${resourceSetName}_normal.png`,
					releasedAt,
					"icon_untrained",
				),
				[`${slug}-full-normal`]: regionAsset(
					`characters/resourceset/${resourceSetName}_rip/card_normal.png`,
					releasedAt,
					"full_untrained",
				),
			};
			const trained = {
				[`${slug}-icon-trained`]: regionAsset(
					`thumb/chara/card${chunkId}_rip/${resourceSetName}_after_training.png`,
					releasedAt,
					"icon_trained",
				),
				[`${slug}-full-trained`]: regionAsset(
					`characters/resourceset/${resourceSetName}_rip/card_after_training.png`,
					releasedAt,
					"full_trained",
				),
			};
			const voice = gachaText &&
				gachaType && {
					[`${slug}-voice`]: regionAsset(
						`/sound/voice/gacha/${gachaType}_rip/${resourceSetName}.mp3`,
						releasedAt,
						"gacha_voiceline",
					),
				};

			if (trainingState === "both") return { ...normal, ...trained, ...voice };
			else if (trainingState === "no-trained") return { ...normal, ...voice };
			else return { ...trained, ...voice };
		}

		case "events": {
			const {
				startAt,
				assetBundleName,
				bannerAssetBundleName,
				bgmAssetBundleName,
				bgmFileName,
			} = entry as DataForAsset<"events">;

			let bgmAsset: string;
			if (bgmFileName.startsWith("bgm") && bgmFileName.endsWith("_chorus")) {
				const chunkId =
					10 * Math.ceil(Number(bgmFileName.match(/\d+/)![0]) / 10);
				bgmAsset = `musicscore/musicscore${chunkId}_rip/${bgmFileName}.mp3`;
			} else {
				bgmAsset = `${bgmAssetBundleName}_rip/${bgmFileName}.mp3`;
			}

			return {
				[`${slug}-banner`]: regionAsset(
					`homebanner_rip/${bannerAssetBundleName}.png`,
					startAt,
					"banner",
				),
				[`${slug}-background`]: regionAsset(
					`event/${assetBundleName}/topscreen_rip/bg_eventtop.png`,
					startAt,
					"background",
				),
				[`${slug}-bgm`]: regionAsset(bgmAsset, startAt, "bgm"),
			};
		}

		case "stamps": {
			const { region, voiced } = entry as DataForAsset<"stamps">;
			return {
				[`${slug}-image`]: asset(
					`/assets/${region}/stamp/01_rip/${id}.png`,
					"image",
					latestStamps.has(id),
				),
				...(voiced && {
					[`${slug}-voice`]: asset(
						`/assets/${region}/sound/voice_stamp_rip/${id}.mp3`,
						"audio",
					),
				}),
			};
		}
	}

	return {};
};
