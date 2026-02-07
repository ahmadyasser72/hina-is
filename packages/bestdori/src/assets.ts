import slug from "slug";

import * as data from "./data";
import type { MapValue } from "./data";

export type AssetType = keyof typeof data;
type Data<T extends AssetType> = MapValue<(typeof data)[T]>;

const getRegionAsset = (pathname: string, releasedAt: { en: Date | null }) =>
	["/assets", !releasedAt.en ? "en" : "jp", pathname].join("/");

export const getAsset = <T extends AssetType>(
	type: T,
	data: Data<T> & { id: string | number },
) => {
	const { id, slug } = data;

	switch (type) {
		case "attributes": {
			const { name } = data as Data<"attributes">;
			return { [slug]: `/res/icon/${name}.svg` };
		}

		case "bands": {
			const { color } = data as Data<"bands">;
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
			const { releasedAt, resourceSetName, trainingState } =
				data as Data<"cards">;

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

			if (trainingState === "both") return { ...normal, ...trained };
			else if (trainingState === "no-trained") return normal;
			else if (trainingState === "only-trained") return trained;
			break;
		}

		case "events": {
			const { startAt, assetBundleName, bannerAssetBundleName } =
				data as Data<"events">;
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
			const { region, voiced } = data as Data<"stamps">;
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
