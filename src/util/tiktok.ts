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

import { randomBigInt, randomInt } from "@/util/math";
import { v4 as uuidv4 } from "uuid";

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
    const internalDetails = internal?.aweme_list.filter(
      (value) => value.aweme_id === videoID,
    )[0];

    if (internalDetails) return this.adaptInternal(internalDetails);
    return undefined;
  }

  /**
   * Parse the internal APIs aweme details into our
   * generic format.
   *
   * @param details The aweme details
   * @private Internal use only
   */
  private adaptInternal(details: Aweme): AdaptedItemDetails {
    const videoPlayUrls = details?.video?.play_addr.url_list ?? [];
    const audioPlayUrls = details?.music?.play_url.url_list ?? [];

    const thumbnail =
      details.image_post_info?.images[0]?.display_image?.url_list ||
      details.video?.cover?.url_list ||
      [];

    // Adapt the data
    return {
      id: details.aweme_id,
      video: {
        url: videoPlayUrls[videoPlayUrls?.length - 1],
        height: details.video?.play_addr.height ?? 1080,
        width: details.video?.play_addr.width ?? 1920,
      },
      image: {
        url: thumbnail[thumbnail?.length - 1],
      },
      audio: {
        url: audioPlayUrls[audioPlayUrls?.length - 1],
      },
      author: {
        username: details.author?.unique_id,
      },
      statistics: {
        likes: details.statistics?.digg_count ?? 0,
        comments: details.statistics?.comment_count ?? 0,
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
        data: details,
      },
    };
  }

  async internalDetails(
    videoID: string,
  ): Promise<InternalItemDetail | undefined> {
    // Throw if the video ID is not a number
    if (isNaN(Number(videoID))) return undefined;

    // Based off yt-dlp tiktok extractor. https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/tiktok.py
    // Turns out the only parameter you need is aid (which appears to influence some fields in the output,
    // maybe for compatibility with older app versions?).
    // The User-Agent isn't strictly required, but some appear to be blacklisted. This one (based off yt-dlp) should be good.
    const appName = "musical_ly";
    const appId = 0; //_AID = 0 # aweme = 1128, trill = 1180, musical_ly = 1233, universal = 0;
    const appVersion = "34.1.2";
    const appManifestVersion = "2023401020";
    const userAgent = `com.zhiliaoapp.musically/${appVersion} (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)`;

    // TODO: Cache working app iid
    const appInstallIds = ["7355728856979392262"];

    for (const iid of appInstallIds) {
      const queryString = new URLSearchParams({
        // Provide the Aweme ID
        aweme_id: videoID,

        // App install ID
        iid,
        last_install_time: (
          Math.floor(Date.now() / 1000) - randomInt(86400, 1123200)
        ).toString(),

        // Versioning
        aid: appId.toString(),
        app_name: appName,
        version_code: appVersion
          .split(".")
          .map((v) => v.padStart(2, "0"))
          .join(""), // 34.1.2 -> 340102
        version_name: appVersion,
        manifest_version_code: appManifestVersion,
        update_version_code: appManifestVersion,
        ab_version: appVersion,
        build_number: appVersion,

        // General
        ssmix: "a",
        channel: "googleplay",
        resolution: "1080*2400",
        dpi: "420",
        language: "en",
        os: "android",
        os_api: "29",
        os_version: "13",
        ac: "wifi",
        is_pad: "0",
        current_region: "US",
        app_type: "normal",
        sys_region: "US",
        timezone_name: "America/New_York",
        residence: "US",
        app_language: "en",
        timezone_offset: "-14400",
        host_abi: "armeabi-v7a",
        locale: "en",
        ac2: "wifi5g",
        uoo: "1",
        op_region: "US",
        region: "US",
        carrier_region: "US",

        // Derivative
        _rticket: Math.floor(Date.now()).toString(),
        // Random UUID
        cdid: uuidv4().toString(),
        // Random 16 character hex string
        opeudid: [...Array(16)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),
        ts: Math.floor(Date.now() / 1000).toString(),

        // Device meta
        // Shoutout: https://github.com/yt-dlp/yt-dlp/issues/9506#issuecomment-2020074295
        device_id: randomBigInt(
          7250000000000000000n,
          7351147085025500000n,
        ).toString(),
        device_type: "Pixel 7",
        device_brand: "Google",
        device_platform: "android",
      });

      const res = await fetch(
        `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?${queryString.toString()}`,
        {
          headers: {
            // Hello, it's me, a human! 🤖
            "User-Agent": userAgent,
          },
          cf: {
            cacheEverything: true,
            cacheTtlByStatus: {
              "200-299": 60 * 60,
              "400-499": 5,
              "500-599": 0,
            },
          },
        },
      );

      if (res.headers.get("Content-Length") === "0") continue;
      return res.json();
    }

    return undefined;
  }
}

/**
 * Modern TikTok API
 */
//region Modern TikTok API
export interface InternalItemDetail {
  aweme_list: Aweme[];
}

export interface Aweme {
  aweme_id: string;
  music: {
    play_url: AssetDetail;
  };
  author: {
    unique_id: string;
  };
  video?: {
    // Prefer the last video in the url list
    // No format, but we can get it from the url
    play_addr: AssetDetail;
    cover: AssetDetail;
  };
  image_post_info?: {
    images: {
      display_image: AssetDetail;
    }[];
  };
  statistics: {
    digg_count: number;
    comment_count: number;
    share_count: number;
    play_count: number;
  };
}

export interface AssetDetail {
  uri: string;
  url_list: string[];

  height: number;
  width: number;
}

//endregion

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
    likes: number;
    comments: number;
  };

  author: {
    username: string;
  };

  imagePost?: {
    images: MediaSource[];
  };

  src: {
    type: "internal";
    data: Aweme;
  };
}

//endregion

export const tiktok = new TikTokAPI();
