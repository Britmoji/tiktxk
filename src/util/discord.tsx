/*
 * tiktxk - Open Source, Privacy First TikTok Embeds
 * Copyright (C) 2023 Britmoji
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

import { Constants } from "@/constants";
import { FC, JSXNode } from "hono/jsx";
import { Context, HonoRequest } from "hono";
import { HtmlEscapedString } from "hono/dist/types/utils/html";

type DiscordEmbedData = {
  title?: string;
  color?: string;
  description?: string;
  url?: string;

  author?: {
    name: string;
    url?: string;
  };

  component?: JSXNode;
};

export const GenericDiscordEmbed: FC = (embed: DiscordEmbedData) => {
  // Build the embed url
  const authorName = embed.author?.name ?? "TikTxk";
  const authorUrl = embed.author?.url ?? Constants.HOST_URL;

  const url = new URL(`${Constants.HOST_URL}/internal/embed`);
  url.searchParams.set("authorName", authorName);
  url.searchParams.set("authorUrl", authorUrl);

  // noinspection HtmlRequiredTitleElement
  return (
    <html lang="en">
      <head>
        {/* Site Metadata */}
        <meta property="og:title" content={embed.title} />
        <meta property="og:site_name" content="TikTxk - Prettier Embeds" />
        <meta property="og:url" content={embed.url} />
        <meta property="og:description" content={embed.description} />
        <meta
          property="theme-color"
          content={embed.color ?? (Math.random() > 0.5 ? "#69C9D0" : "#EE1D52")}
        />

        {/* Preview Metadata */}
        {embed.component}

        {/* The additional oembed is pulled by Discord to enable improved embeds. */}
        {embed.author && (
          <link
            rel="alternate"
            href={url.toString()}
            type="application/json+oembed"
          />
        )}
      </head>
    </html>
  );
};

/**
 * Checks if the request is from Discord.
 *
 * @param req The request to check.
 * @returns True if the request is from Discord.
 */
export const isDiscord = (req: HonoRequest): boolean => {
  const raw = req.query("raw") === "true";
  return req.header("User-Agent")?.includes("Discordbot") === true && !raw;
};

/**
 * Respond with two different results depending on if the request is from Discord.
 *
 * @param ctx The request context.
 * @param embed Lazy function that returns the embed to respond with.
 * @param handler The handler to call if the request is not from Discord.
 * @returns The response.
 */
export const respondDiscord = (
  ctx: Context,
  embed: () => DiscordEmbedData | JSX.Element,
  handler: () => Response | Promise<Response>,
): Response | Promise<Response> => {
  if (isDiscord(ctx.req)) {
    // Get the embed data
    const data = embed();

    // noinspection SuspiciousTypeOfGuard
    return ctx.html(
      typeof data === "string" ? data : <GenericDiscordEmbed {...data} />,
    );
  } else {
    return handler();
  }
};
