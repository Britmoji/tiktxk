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

  async details(videoID: string): Promise<AdaptedItemDetails | undefined> {
    try {
      // Fetch internal details
      const internal = await this.internalDetails(videoID);
      const details = internal.aweme_list[0];
      if (!details) return undefined;

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
                url: image.display_image.url_list[0],
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
    } catch (e) {
      // If the internal details fail, fallback to the public details
      const item = await this.publicDetails(videoID);
      if (!item) return undefined;

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
  }

  async publicDetails(videoID: string): Promise<PublicItemDetails> {
    return this.get(`/item/detail/?itemId=${videoID}`);
  }

  async internalDetails(videoID: string): Promise<InternalItemDetail> {
    // Throw if the video ID is not a number
    if (isNaN(Number(videoID))) {
      throw new Error("Invalid video ID");
    }

    // Based off yt-dlp tiktok extractor. https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/tiktok.py
    // Turns out the only parameter you need is aid (which appears to influence some of the fields in the output,
    // maybe for compatibility with older app versions?).
    // 1180 seems to be a good value where all the fields we need are present.
    // The User-Agent isn't strictly required, but some appear to be blacklisted. This one (based off yt-dlp) should be good.

    const res = await fetch(
      `https://api-h2.tiktokv.com/aweme/v1/feed/?aweme_id=${videoID}&aid=1180`,
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

    if (res.headers.get("Content-Length") === "0") {
      throw new Error("Failed to fetch internal details");
    }

    return res.json();
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
