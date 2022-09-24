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

import { Context, Handler, Hono } from "hono";
import { ItemDetails, tiktok } from "@/util/tiktok";
import { get } from "@/util/http";
import { StatusError } from "@/types/cloudflare";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsx } from "hono/jsx";
import { formatNumber } from "@/util/numbers";

const DiscordEmbed = ({ data }: { data: ItemDetails }) => {
  const video = data.itemInfo.itemStruct.video;
  const stats = data.itemInfo.itemStruct.stats;
  const author = data.itemInfo.itemStruct.author.uniqueId;

  const likes = formatNumber(stats.diggCount, 1);
  const comments = formatNumber(stats.commentCount, 1);

  // noinspection HtmlRequiredTitleElement
  return (
    <html lang="en">
      <head>
        {/* Site Metadata */}
        <meta property="og:title" content={`❤️ ${likes} 💬 ${comments}`} />
        <meta property="og:site_name" content="TikTxk - Prettier Embeds" />
        <meta property="theme-color" content="#f48fb1" />

        {/* Video Metadata */}
        <meta property="og:video" content={video.downloadAddr} />
        <meta property="og:video:type" content={`video/${video.format}`} />
        <meta property="og:video:width" content={video.width} />
        <meta property="og:video:height" content={video.height} />
        <meta property="og:type" content="video.other" />

        {/* The additional oembed is pulled by Discord to enable improved embeds. */}
        <link
          rel="alternate"
          href={`https://tiktxk.com/internal/embed?username=${author}`}
          type="application/json+oembed"
        />
      </head>
    </html>
  );
};

export const addTikTokRoutes = (app: Hono) => {
  const videoIdRegex = /https:\/\/www\.tiktok\.com\/@[^/]+\/video\/(\d+)/;

  // Main renderer
  const render = (c: Context, data: ItemDetails) => {
    const raw = c.req.query("raw") === "true";

    // Discord embed rendering
    if (c.req.header("User-Agent")?.includes("Discordbot/2.0") && !raw) {
      return c.html(<DiscordEmbed data={data} />);
    }

    // Redirect if raw
    if (raw) {
      return c.redirect(data.itemInfo.itemStruct.video.downloadAddr);
    }

    // Normal redirect
    return c.redirect(
      `https://www.tiktok.com/@${data.itemInfo.itemStruct.author.uniqueId}/video/${data.itemInfo.itemStruct.id}`,
    );
  };

  // E.g. https://www.tiktok.com/@username/video/1234567891234567891
  const handleUsernameVideo: Handler = async (c) => {
    // const username = c.req.param("username"); // includes @
    const videoId = c.req.param("videoId");

    // Lookup details
    const details = await tiktok.details(videoId);
    return render(c, details);
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
      return render(c, details);
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
