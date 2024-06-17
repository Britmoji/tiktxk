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
import { tiktok, TikTokContext } from "@/util/tiktok";
import { Bindings, StatusError } from "@/types/cloudflare";
import { USER_AGENT } from "@/util/http";

export const addMetaRoutes = (app: Hono<{ Bindings: Bindings }>) => {
  // Video metadata
  app.get("/meta/:videoId/video", async (c) => {
    const videoId = c.req.param("videoId");
    const ctx = await tiktok.context(videoId);
    if (!ctx) throw new StatusError(404, "UNKNOWN_AWEME");

    return fetchWithCtx(ctx.data.video.url, ctx);
  });

  // Image metadata
  app.get("/meta/:videoId/image/:index", async (c) => {
    const videoId = c.req.param("videoId");
    const index = parseInt(c.req.param("index")) || 0;
    const ctx = await tiktok.context(videoId);
    if (!ctx) throw new StatusError(404, "UNKNOWN_AWEME");

    const url = ctx.data.imagePost?.images[index].url ?? ctx.data.image.url;
    return fetchWithCtx(url, ctx);
  });

  // Audio metadata
  app.get("/meta/:videoId/audio", async (c) => {
    const videoId = c.req.param("videoId");
    const ctx = await tiktok.context(videoId);
    if (!ctx) throw new StatusError(404, "UNKNOWN_AWEME");

    return fetchWithCtx(ctx.data.audio.url, ctx);
  });

  // All metadata
  app.get("/meta/:videoId", async (c) => {
    const videoId = c.req.param("videoId");
    const details = await tiktok.context(videoId);
    if (!details) throw new StatusError(404, "UNKNOWN_AWEME");

    return c.json(details);
  });
};

const fetchWithCtx = async (url: string, context: TikTokContext) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: context.cookies.map((c) => `${c.name}=${c.value}`).join("; "),
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

  return new Response(res.body, res);
};
