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

  async details(videoID: string): Promise<ItemDetails> {
    return this.get(`/item/detail/?itemId=${videoID}`);
  }
}

export interface ItemDetails {
  itemInfo: {
    itemStruct: {
      video: {
        downloadAddr: string;
      };
    };
  };
}

export const tiktok = new TikTokAPI();
