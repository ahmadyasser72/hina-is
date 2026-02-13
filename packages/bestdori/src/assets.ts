import slug from "slug";

import * as data from "./data";
import type { MapValue } from "./data";

export type AssetType = keyof typeof data;
export type DataForAsset<T extends AssetType> = MapValue<(typeof data)[T]>;

const getRegionAsset = (pathname: string, releasedAt: { en: Date | null }) =>
	["/assets", releasedAt.en ? "en" : "jp", pathname].join("/");

export const getAsset = <T extends AssetType>(
	type: T,
	data: DataForAsset<T> & { id: string | number },
) => {
	const { id, slug } = data;

	switch (type) {
		case "attributes": {
			const { name } = data as DataForAsset<"attributes">;
			return { [slug]: `/res/icon/${name}.svg` };
		}

		case "bands": {
			const { color } = data as DataForAsset<"bands">;
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
			} = data as DataForAsset<"cards">;

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
			break;
		}

		case "events": {
			const { startAt, assetBundleName, bannerAssetBundleName } =
				data as DataForAsset<"events">;
			return {
				[`${slug}-banner`]: getRegionAsset(
					`homebanner_rip/${bannerAssetBundleName}.png`,
					startAt,
				),
				[`${slug}-background`]: getRegionAsset(
					`event/${assetBundleName}/topscreen_rip/bg_eventtop.png`,
					startAt,
				),
			};
		}

		case "stamps": {
			const { region, voiced } = data as DataForAsset<"stamps">;
			return {
				[`${slug}-image`]: `/assets/${region}/stamp/01_rip/${id}.png`,
				...(voiced && {
					[`${slug}-voice`]: `/assets/${region}/sound/voice_stamp_rip/${id}.mp3`,
				}),
			};
		}
	}

	return {};
};

export const getSlug = (id: string | number, string: string) =>
	slug(`${id} ${string}`);
