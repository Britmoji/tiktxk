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
import { AdaptedItemDetails, tiktok } from "@/util/tiktok";
import { get } from "@/util/http";
import { StatusError } from "@/types/cloudflare";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsx } from "hono/jsx";
import { formatNumber } from "@/util/numbers";
import { Constants } from "@/constants";

const DiscordEmbed = ({ data }: { data: AdaptedItemDetails }) => {
  const likes = formatNumber(data.statistics.likes, 1);
  const comments = formatNumber(data.statistics.comments, 1);

  const authorSuffix = data.imagePost ? "slideshow" : "";
  const previewComponent = data.imagePost ? (
    <ImagePreview data={data} />
  ) : (
    <VideoPreview data={data} />
  );

  // noinspection HtmlRequiredTitleElement
  return (
    <html lang="en">
      <head>
        {/* Site Metadata */}
        <meta property="og:title" content={`❤️ ${likes} 💬 ${comments}`} />
        <meta property="og:site_name" content="TikTxk - Prettier Embeds" />
        <meta
          property="theme-color"
          content={Math.random() > 0.5 ? "#69C9D0" : "#EE1D52"}
        />

        {/* Preview Metadata */}
        {previewComponent}

        {/* The additional oembed is pulled by Discord to enable improved embeds. */}
        <link
          rel="alternate"
          href={`${Constants.HOST_URL}/internal/embed?username=${data.author.username}&authorSuffix=${authorSuffix}`}
          type="application/json+oembed"
        />
      </head>
    </html>
  );
};

const VideoPreview = ({ data }: { data: AdaptedItemDetails }) => (
  <div>
    <meta
      property="og:video"
      content={`${Constants.HOST_URL}/meta/${data.id}/video`}
    />
    <meta property="og:video:type" content={`video/mp4`} />
    <meta property="og:video:width" content={data.video.width} />
    <meta property="og:video:height" content={data.video.height} />
    <meta property="og:type" content="video.other" />
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ImagePreview = ({ data }: { data: AdaptedItemDetails }) => (
  <div>
    <meta
      property="og:image"
      content={`${Constants.HOST_URL}/meta/${data.id}/image`}
    />
    <meta property="og:image:type" content={`image/jpeg`} />
    <meta property="og:image:width" content={data.imagePost?.images[0].width} />
    <meta
      property="og:image:height"
      content={data.imagePost?.images[0].height}
    />
    <meta property="og:type" content="image.other" />
    <meta property="twitter:card" content="summary_large_image" />
  </div>
);

export const addTikTokRoutes = (app: Hono) => {
  const videoIdRegex = /https:\/\/www\.tiktok\.com\/@[^/]+\/video\/(\d+)/;

  // Main renderer
  const render = (c: Context, data: AdaptedItemDetails) => {
    const raw = c.req.query("raw") === "true";

    // Discord embed rendering
    if (c.req.header("User-Agent")?.includes("Discordbot/2.0") && !raw) {
      return c.html(<DiscordEmbed data={data} />);
    }

    // Redirect if raw
    if (raw) {
      return c.redirect(data.video.url);
    }

    // Normal redirect
    return c.redirect(
      `https://www.tiktok.com/@${data.author.username}/video/${data.id}`,
    );
  };

  // E.g. https://www.tiktok.com/@username/video/1234567891234567891
  const handleUsernameVideo: Handler = async (c) => {
    // const username = c.req.param("username"); // includes @
    const videoId = c.req.param("videoId");

    // Lookup details
    const details = await tiktok.details(videoId);
    if (!details) throw new StatusError(404, "Video not found");

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
      if (!details) throw new StatusError(404, "Video not found");

      return render(c, details);
    };

  // https://www.tiktok.com/@username/video/1234567891234567891
  app.get("/*/video/:videoId", handleUsernameVideo);
  app.get("/*/video/:videoId/", handleUsernameVideo);

  // https://vm.tiktok.com/ZTRav7308/
  app.get("/:vmId", handleRedirect("vmId"));
  app.get("/:vmId/", handleRedirect("vmId"));

  // https://www.tiktok.com/t/ZTRav7308
  app.get("/t/:videoId", handleRedirect("videoId"));
  app.get("/t/:videoId/", handleRedirect("videoId"));
};
