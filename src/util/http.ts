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

import { Context } from "hono";

// TOTALLY NOT A ROBOT. 🤖
export const get = async (url: string) => {
  return await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    },
    cf: {
      cacheEverything: true,
      cacheTtlByStatus: {
        "200-299": 60 * 60,
        "400-499": 5,
        "500-599": 0,
      },
    },
  });
};

export const getBaseURL = (ctx: Context) => {
  const url = new URL(ctx.req.url);
  return `https://${url.host}`;
};
