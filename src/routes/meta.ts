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
import { tiktok } from "@/util/tiktok";
import { StatusError } from "@/types/cloudflare";

export const addMetaRoutes = (app: Hono) => {
  // Video metadata
  app.get("/meta/:videoId/video", async (c) => {
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(videoId);

    if (!details) {
      throw new StatusError(404);
    }

    return c.redirect(details.itemInfo.itemStruct.video.downloadAddr);
  });

  // Thumbnail metadata
  app.get("/meta/:videoId/thumbnail", async (c) => {
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(videoId);

    if (!details) {
      throw new StatusError(404);
    }

    return c.redirect(details.itemInfo.itemStruct.video.cover);
  });

  // Audio metadata
  app.get("/meta/:videoId/audio", async (c) => {
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(videoId);

    if (!details) {
      throw new StatusError(404);
    }

    return c.redirect(details.itemInfo.itemStruct.music.playUrl);
  });

  // All metadata
  app.get("/meta/:videoId", async (c) => {
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(videoId);

    if (!details) {
      throw new StatusError(404);
    }

    return c.json(details);
  });
};