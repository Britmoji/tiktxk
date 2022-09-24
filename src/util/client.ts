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

import { StatusError } from "@/types/cloudflare";

export abstract class APIClient {
  protected constructor(private readonly base: string) {}

  async getCacheId(): Promise<string> {
    return "";
  }

  abstract getHeaders(): Promise<Record<string, string>>;

  /**
   * Performs a GET request to an API.
   * This method automatically adds any headers to the request and
   * will cache the response for 1 hour.
   *
   * @param path The path to the endpoint
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get(path: string): Promise<any> {
    const id = await this.getCacheId();
    const headers = await this.getHeaders();

    const cacheId = `${path.includes("?") ? "&" : "?"}cache_id=${id}`;
    const response = await fetch(`${this.base}${path}${cacheId}`, {
      method: "GET",
      headers: headers,
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: {
          "200-299": 60 * 60,
          "400-499": 5,
          "500-599": 0,
        },
      },
    });

    if (response.status !== 200)
      throw new StatusError(response.status, await response.text());

    return response.json();
  }
}
