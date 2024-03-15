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

import { APIClient } from "./client";

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36";

class TikTokAPI extends APIClient {
  constructor() {
    super("https://t.tiktok.com/api");
  }

  async getHeaders(): Promise<Record<string, string>> {
    return {
      "User-Agent": USER_AGENT,
    };
  }

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

    // If the internal details fail, fallback to the public details
    if (!internalDetails) {
      const item = await this.publicDetails(videoID);
      if (!item || !item.itemInfo) return undefined;
      return this.adaptPublic(item);
    }

    return this.adaptInternal(internalDetails);
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

  /**
   * Parse the public APIs item details into our
   * generic format.
   *
   * @param item The item details
   * @private Internal use only
   */
  private adaptPublic(item: PublicItemDetails): AdaptedItemDetails {
    // Adapt the data
    return {
      id: item.itemInfo.itemStruct.id,
      video: {
        url: item.itemInfo.itemStruct.video.downloadAddr,
        height: item.itemInfo.itemStruct.video.height,
        width: item.itemInfo.itemStruct.video.width,
      },
      image: {
        url: item.itemInfo.itemStruct.video.cover,
      },
      audio: {
        url: item.itemInfo.itemStruct.music.playUrl,
      },
      author: {
        username: item.itemInfo.itemStruct.author.uniqueId,
      },
      statistics: {
        likes: item.itemInfo.itemStruct.stats.diggCount,
        comments: item.itemInfo.itemStruct.stats.commentCount,
      },
      src: {
        type: "public",
        data: item,
      },
    };
  }

  async publicDetails(videoID: string): Promise<PublicItemDetails> {
    return this.get(`/item/detail/?itemId=${videoID}`);
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

    const aid = "1180";
    const appVersions = [
      { version_name: "26.1.3", version_code: "260103" },
      { version_name: "26.1.2", version_code: "260102" },
      { version_name: "26.1.1", version_code: "260101" },
      { version_name: "25.6.2", version_code: "256202" },
    ];

    for (const params of appVersions) {
      const queryString = new URLSearchParams({
        // Required version data for compatibility
        aid,
        ...params,

        // Provide the Aweme ID
        aweme_id: videoID,

        // Required headers to spoof the app
        build_number: params.version_name,
        manifest_version_code: params.version_code,
        update_version_code: params.version_code,

        // Random 16 character hex string
        opeudid: [...Array(16)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),

        // Random 16 character digit string
        uuid: [...Array(16)].map(() => Math.floor(Math.random() * 10)).join(""),

        _rticket: Math.floor(Date.now()).toString(),
        ts: Math.floor(Date.now() / 1000).toString(),

        // Device meta
        device_brand: "Google",
        device_type: "Pixel 4",
        device_platform: "android",
        resolution: "1080*1920",
        dpi: "420",
        os_version: "10",
        os_api: "29",
        carrier_region: "US",
        sys_region: "US",
        region: "US",
        app_name: "trill",
        app_language: "en",
        language: "en",
        timezone_name: "America/New_York",
        timezone_offset: "-14400",
        channel: "googleplay",
        ac: "wifi",
        mcc_mnc: "310260",
        is_my_cn: "0",
        ssmix: "a",
        as: "a1qwert123",
        cp: "cbfhckdckkde1",
      });

      const res = await fetch(
        `https://api22-normal-c-useast2a.tiktokv.com/aweme/v1/feed/?${queryString.toString()}`,
        {
          headers: {
            "User-Agent":
              "com.ss.android.ugc.trill/250602 (Linux; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)",
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
 * Public TikTok API
 */
//region Public TikTok API
export interface PublicItemDetails {
  shareMeta: {
    desc: string;
    title: string;
  };
  itemInfo: {
    itemStruct: {
      id: string;
      author: {
        avatarThumb: string;
        uniqueId: string;
      };
      stats: {
        commentCount: number;
        diggCount: number;
        playCount: number;
        shareCount: number;
      };
      video: {
        downloadAddr: string;
        cover: string;
        format: string;
        height: number;
        width: number;
      };
      music: {
        playUrl: string;
      };
    };
  };
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
    type: "internal" | "public";
    data: Aweme | PublicItemDetails;
  };
}

//endregion

export const tiktok = new TikTokAPI();
