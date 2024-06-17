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
import { Bindings, StatusError } from "@/types/cloudflare";
import { formatNumber } from "@/util/numbers";
import { Constants } from "@/constants";
import { DiscordEmbedData, respondDiscord } from "@/util/discord";
import { Fragment } from "hono/jsx";

const createDiscordEmbed = (data: AdaptedItemDetails): DiscordEmbedData => {
  // Format the numbers
  const likes = formatNumber(data.statistics.likes, 1);
  const comments = formatNumber(data.statistics.comments, 1);

  // Determine the preview component for the media type
  const previewComponent = (
    <Fragment>
      {!data.imagePost && <VideoPreview tiktok={data} />}
      {data.imagePost
        ? data.imagePost.images
            .slice(0, 4) // Only show the first 4 images
            .map((_, index) => <ImagePreview tiktok={data} index={index} />)
        : null}
    </Fragment>
  );

  // Format the headings
  const authorName = `@${data.author.username}${
    data.imagePost ? ` (slideshow)` : ""
  }`;
  const authorUrl = `https://tiktok.com/@${data.author.username}`;

  // noinspection HtmlRequiredTitleElement
  return {
    author: { name: authorName, url: authorUrl },
    title: `❤️ ${likes} 💬 ${comments}`,
    url: `https://tiktok.com/@${data.author.username}/video/${data.id}`,
    description: data.description,
    component: previewComponent as unknown as Element | undefined,
  };
};

const VideoPreview = ({ tiktok }: { tiktok: AdaptedItemDetails }) => (
  <Fragment>
    <meta
      property="og:video"
      content={`${Constants.HOST_URL}/meta/${tiktok.id}/video`}
    />
    <meta property="og:video:type" content={`video/mp4`} />
    <meta property="og:video:width" content={"1080"} />
    <meta property="og:video:height" content={"1920"} />
    <meta property="og:type" content="video.other" />
  </Fragment>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ImagePreview = ({
  tiktok,
  index,
}: {
  tiktok: AdaptedItemDetails;
  index: number;
}) => (
  <Fragment>
    <meta
      property="og:image"
      content={`${Constants.HOST_URL}/meta/${tiktok.id}/image/${index}`}
    />
    <meta property="og:image:type" content={`image/jpeg`} />
    <meta
      property="og:image:width"
      content={tiktok.imagePost?.images[index].width?.toString()}
    />
    <meta
      property="og:image:height"
      content={tiktok.imagePost?.images[index].height?.toString()}
    />
    <meta property="og:type" content="image.other" />
    <meta property="twitter:card" content="summary_large_image" />
  </Fragment>
);

export const addTikTokRoutes = (app: Hono<{ Bindings: Bindings }>) => {
  const videoIdRegex =
    /https:\/\/www\.tiktok\.com\/@(?<username>[^/]+)\/(video|photo)\/(?<id>\d+)/;

  // Main renderer
  const render = (c: Context, data: AdaptedItemDetails) =>
    respondDiscord(
      c,
      () => createDiscordEmbed(data),
      () =>
        c.redirect(
          `https://www.tiktok.com/@${data.author.username}/video/${data.id}`,
        ),
    );

  // E.g. https://www.tiktok.com/@username/video/1234567891234567891
  const handleUsernameVideo: Handler = async (c) => {
    const videoId = c.req.param("videoId");

    // Lookup details
    const details = await tiktok.context(videoId);
    if (!details) throw new StatusError(404, "UNKNOWN_AWEME");

    return render(c, details.data);
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
      if (!match || !match.groups) {
        throw new StatusError(400, "FAILED_TO_PARSE_VIDEO_ID");
      }

      // Lookup details
      const details = await tiktok.context(match.groups?.id);

      if (!details) {
        throw new StatusError(404, "UNKNOWN_AWEME");
      }

      return render(c, details.data);
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
