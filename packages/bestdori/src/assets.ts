import * as data from "./data";
import type { MapValue } from "./data";

export type AssetType = keyof typeof data;
export type DataForAsset<T extends AssetType> = MapValue<(typeof data)[T]>;

const getRegionAsset = (pathname: string, releasedAt: { en: Date | null }) =>
	["/assets", releasedAt.en ? "en" : "jp", pathname].join("/");

export const getAsset = <T extends AssetType>(
	type: T,
	entry: DataForAsset<T> & { id: string | number },
): Record<string, string | { path: string; invalidate: boolean }> => {
	const { id, slug } = entry;

	switch (type) {
		case "attributes": {
			const { name } = entry as DataForAsset<"attributes">;
			return { [slug]: `/res/icon/${name}.svg` };
		}

		case "bands": {
			const { color } = entry as DataForAsset<"bands">;
			if (color) return { [slug]: `/res/icon/band_${id}.svg` };
			break;
		}

		case "characters": {
			return { [slug]: `/res/icon/chara_icon_${id}.png` };
		}

		case "cards": {
			const chunkId = Math.floor((id as number) / 50)
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
				[`${slug}-icon-normal`]: getRegionAsset(
					`thumb/chara/card${chunkId}_rip/${resourceSetName}_normal.png`,
					releasedAt,
				),
				[`${slug}-full-normal`]: getRegionAsset(
					`characters/resourceset/${resourceSetName}_rip/card_normal.png`,
					releasedAt,
				),
			};
			const trained = {
				[`${slug}-icon-trained`]: getRegionAsset(
					`thumb/chara/card${chunkId}_rip/${resourceSetName}_after_training.png`,
					releasedAt,
				),
				[`${slug}-full-trained`]: getRegionAsset(
					`characters/resourceset/${resourceSetName}_rip/card_after_training.png`,
					releasedAt,
				),
			};
			const voice = gachaText &&
				gachaType && {
					[`${slug}-voice`]: getRegionAsset(
						`/sound/voice/gacha/${gachaType}_rip/${resourceSetName}.mp3`,
						releasedAt,
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
				[`${slug}-banner`]: getRegionAsset(
					`homebanner_rip/${bannerAssetBundleName}.png`,
					startAt,
				),
				[`${slug}-background`]: getRegionAsset(
					`event/${assetBundleName}/topscreen_rip/bg_eventtop.png`,
					startAt,
				),
				[`${slug}-bgm`]: getRegionAsset(bgmAsset, startAt),
			};
		}

		case "stamps": {
			const isLatestStamp = data.recentNews.events
				.map(({ stamp }) => stamp.id)
				.includes(id as never);

			const { region, voiced } = entry as DataForAsset<"stamps">;
			return {
				[`${slug}-image`]: {
					path: `/assets/${region}/stamp/01_rip/${id}.png`,
					invalidate: isLatestStamp,
				},
				...(voiced && {
					[`${slug}-voice`]: `/assets/${region}/sound/voice_stamp_rip/${id}.mp3`,
				}),
			};
		}
	}

	return {};
};
