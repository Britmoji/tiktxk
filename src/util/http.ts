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

import { USER_AGENT } from "./tiktok";
import { Context } from "hono";

// I am not a 🤖
export const get = async (url: string) => {
  return await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
};

export const getBaseURL = (ctx: Context) => {
  const url = new URL(ctx.req.url);
  return `https://${url.host}`;
};
