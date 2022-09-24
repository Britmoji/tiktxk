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

import { Hono } from "hono";
import { StatusError } from "@/types/cloudflare";

export const addEmbedRoutes = (app: Hono) => {
  app.get("/internal/embed", async (c) => {
    const username = c.req.query("username");
    if (!username) throw new StatusError(400, "Missing username");

    return c.json({
      author_name: `@${username}`,
      author_url: `https://tiktok.com/@${username}`,
      provider_name: "TikTxk - Embed using s/o/x",
      provider_url: "https://github.com/britmoji/tiktxk",
      title: "TikTok Embed",
      type: "link",
      version: "1.0",
    });
  });
};
