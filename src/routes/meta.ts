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
import { Bindings, StatusError } from "@/types/cloudflare";

export const addMetaRoutes = (app: Hono<{ Bindings: Bindings }>) => {
  // Video metadata
  app.get("/meta/:authorName/:videoId/video", async (c) => {
    const authorName = c.req.param("authorName");
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(authorName, videoId);
    if (!details) throw new StatusError(404, "UNKNOWN_AWEME");

    return c.redirect(details.video.url);
  });

  // Image metadata
  app.get("/meta/:authorName/:videoId/image/:index", async (c) => {
    const authorName = c.req.param("authorName");
    const videoId = c.req.param("videoId");
    const index = parseInt(c.req.param("index")) || 0;
    const details = await tiktok.details(authorName, videoId);
    if (!details) throw new StatusError(404, "UNKNOWN_AWEME");

    if (details.imagePost?.images?.length) {
      return c.redirect(details.imagePost.images[index].url);
    }

    return c.redirect(details.image.url);
  });

  // Audio metadata
  app.get("/meta/:authorName/:videoId/audio", async (c) => {
    const authorName = c.req.param("authorName");
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(authorName, videoId);
    if (!details) throw new StatusError(404, "UNKNOWN_AWEME");

    return c.redirect(details.audio.url);
  });

  // All metadata
  app.get("/meta/:authorName/:videoId", async (c) => {
    const authorName = c.req.param("authorName");
    const videoId = c.req.param("videoId");
    const details = await tiktok.details(authorName, videoId);
    if (!details) throw new StatusError(404, "UNKNOWN_AWEME");

    return c.json(details);
  });
};
