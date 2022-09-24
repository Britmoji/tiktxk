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

import { Handler, Hono } from "hono";
import { tiktok } from "../util/tiktok";
import { get } from "../util/http";
import { StatusError } from "../types/cloudflare";

export const addTikTokRoutes = (app: Hono) => {
  const videoIdRegex = /https:\/\/www\.tiktok\.com\/@[^/]+\/video\/(\d+)/;

  // E.g. https://www.tiktok.com/@username/video/1234567891234567891
  const handleUsernameVideo: Handler = async (c) => {
    // const username = c.req.param("username"); // includes @
    const videoId = c.req.param("videoId");

    // Lookup details
    const details = await tiktok.details(videoId);
    return c.redirect(details.itemInfo.itemStruct.video.downloadAddr);
  };

  // E.g. https://www.tiktok.com/t/ZTRav7308
  // E.g. https://vm.tiktok.com/ZTRav7308/
  const handleRedirect: (param: string) => Handler =
    (param: string) => async (c) => {
      const videoId = c.req.param(param);

      // Redirect to the page
      const res = await get(`https://www.tiktok.com/t/${videoId}/`);

      // Parse video ID from url
      const match = videoIdRegex.exec(res.url);
      if (!match) {
        throw new StatusError(404);
      }

      // Lookup details
      const details = await tiktok.details(match[1]);
      return c.redirect(details.itemInfo.itemStruct.video.downloadAddr);
    };

  // https://vm.tiktok.com/ZTRav7308/
  app.get("/:vmId", handleRedirect("vmId"));
  app.get("/:vmId/", handleRedirect("vmId"));

  // https://www.tiktok.com/t/ZTRav7308
  app.get("/t/:videoId", handleRedirect("videoId"));
  app.get("/t/:videoId/", handleRedirect("videoId"));

  // https://www.tiktok.com/@username/video/1234567891234567891
  app.get("/:username/video/:videoId", handleUsernameVideo);
  app.get("/:username/video/:videoId/", handleUsernameVideo);
};
