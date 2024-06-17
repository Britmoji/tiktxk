/*
 * tiktxk - Open Source, Privacy First TikTok Embeds
 * Copyright (C) 2022 Britmoji
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ItemStruct } from "@/types/tiktok";
import parse from "node-html-parser";
import { get } from "./http";

class TikTokAPI {
  /**
   * Fetch the item details of a public TikTok, either from the
   * internal API, or fallback to the public API.
   *
   * @param videoID The video ID
   */
  async details(videoID: string): Promise<AdaptedItemDetails | undefined> {
    // Fetch internal details
    const internal = await this.internalDetails(videoID);
    // TODO: If internal.statusCode === 10204 bail

    if (internal) return this.adaptInternal(internal);
    return undefined;
  }

  /**
   * Parse the internal APIs aweme details into our
   * generic format.
   *
   * @param details The aweme details
   * @private Internal use only
   */
  private adaptInternal(details: ItemStruct): AdaptedItemDetails {
    // Adapt the data

    const videoPlayUrls = details.video?.bitrateInfo ?? [];
    const playableVideo = videoPlayUrls[0];

    console.log(
      playableVideo.PlayAddr.UrlList[0],
      //details.video.playAddr,
      //details.video.downloadAddr,
    );

    return {
      id: details.id,
      video: {
        url: playableVideo.PlayAddr.UrlList[0],
        height: details.video.height,
        width: details.video.width,
      },
      image: {
        url: details.video.cover,
      },
      audio: {
        url: details.music.playUrl,
      },
      author: {
        username: details.author.uniqueId,
      },
      statistics: {
        likes: details.statsV2?.diggCount ?? 0,
        comments: details.statsV2?.commentCount ?? 0,
      },
      imagePost: details.image_post_info
        ? {
            images: details.image_post_info.images.map((image) => ({
              url: image.display_image.url_list[
                image.display_image.url_list.length - 1
              ],
              width: image.display_image.width,
              height: image.display_image.height,
            })),
          }
        : undefined,
      src: {
        type: "internal",
      },
    };
  }

  async internalDetails(videoID: string): Promise<ItemStruct | undefined> {
    const res = await get(`https://tiktok.com/@/video/${videoID}`);

    const page = parse(await res.text());
    // eslint-disable-next-line prettier/prettier
    const hydrationTag = page.querySelector("#__UNIVERSAL_DATA_FOR_REHYDRATION__");
    if (!hydrationTag) return undefined;

    const hydration = JSON.parse(hydrationTag?.textContent);
    const data = hydration["__DEFAULT_SCOPE__"]["webapp.video-detail"];
    return data["itemInfo"]["itemStruct"];
  }
}

/**
 * Adapted TikTok API
 */
//region Adapted TikTok API
export interface MediaSource {
  url: string;
  width?: number;
  height?: number;
}

export interface AdaptedItemDetails {
  id: string;

  video: MediaSource;
  image: MediaSource;
  audio: MediaSource;

  statistics: {
    likes: string;
    comments: string;
  };

  author: {
    username: string;
  };

  imagePost?: {
    images: MediaSource[];
  };

  src: {
    type: "internal";
  };
}

//endregion

export const tiktok = new TikTokAPI();
