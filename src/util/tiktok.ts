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
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0";

class TikTokAPI extends APIClient {
  constructor() {
    super("https://t.tiktok.com/api");
  }

  async getHeaders(): Promise<Record<string, string>> {
    return {
      "User-Agent": USER_AGENT,
    };
  }

  async details(videoID: string): Promise<InternalItemDetail> {
    // Throw if the video ID is not a number
    if (isNaN(Number(videoID))) {
      throw new Error("Invalid video ID");
    }

    return fetch(
      `https://api19-normal-c-alisg.tiktokv.com/aweme/v1/multi/aweme/detail/?device_id=7150415238323324421&channel=googleplay&aid=1233&app_name=musical_ly&version_code=260403&version_name=26.4.3&device_platform=android&device_type=Pixel%2B5&os_version=12&cache=${videoID}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent":
            "com.zhiliaoapp.musically/2022604030 (Linux; U; Android 12; en_AU; Pixel 5; Build/SQ3A.220705.003.A1;tt-ok/3.12.13.1)",
          "x-argus":
            "I/Qq8Aucfjg1Fs2fRb1R/JfVq5LxV9BTvBcIDOTlk6e2btnd9hkNZjPtQg6zHlM1T6bnp3H0xOV6JEoF+nDCU9hqVm7ZuFlUEkQkxoxgRUd0kCZEy2gkecaTzI2J5EjdOx30q1O+qg0+qFG3X0krNo25U27nZtAHLufJxpK54SqAxFmuJwc2E8/GgZT0iV3sCiqA3cTiRsU04Mm9w1e4ZS0HEFCz6wGR6BuqvQCQiwJwxEmmowbmYCdXrykhbdyuGSAcmO4tbXPhCODwrrcgADX/ooAVcsP60SOUj0FdCwNrZumH7k/27Xwz2xIv2iTQ7vmsnfflh+ZEtq7/jElUDCIb",
          "x-ladon": "QcAZOBZPYsUdPhgSa32MfkUyMIs4EEAJQelTPIIyIReyUK1K",
        },
        body: new URLSearchParams({
          aweme_ids: `[${videoID}]`,
          request_source: "0",
        }),
        cf: {
          cacheEverything: true,
          cacheTtlByStatus: {
            "200-299": 60 * 60,
            "400-499": 5,
            "500-599": 0,
          },
        },
      },
    ).then((res) => res.json());
  }
}

/**
 * Modern TikTok API
 */
export interface InternalItemDetail {
  aweme_details: Aweme[];
}

export interface Aweme {
  aweme_id: string;
  music: {
    play_url: AssetDetail;
  };
  author: {
    aweme_details: AssetDetail;
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

export const tiktok = new TikTokAPI();
