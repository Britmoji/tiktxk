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
import { logger } from "hono/logger";
import { etag } from "hono/etag";
import { Bindings, StatusError } from "./types/cloudflare";
import { StatusCode } from "hono/utils/http-status";
import { addTikTokRoutes } from "./routes/tiktok";
import { addIndexRoutes } from "./routes";
import { addEmbedRoutes } from "@/routes/embed";
import { addMetaRoutes } from "@/routes/meta";
import { Constants } from "./constants";
import { Toucan } from "toucan-js";
import { prettyJSON } from "hono/pretty-json";
import { GenericDiscordEmbed, isDiscord } from "@/util/discord";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", etag(), logger(), prettyJSON());

// Add routes
addIndexRoutes(app);
addEmbedRoutes(app);
addMetaRoutes(app);
addTikTokRoutes(app);

// Add error handlers
const errorComment =
  `If you're here, and have no idea what this nerd shit is, something went wrong when
trying to embed a TikTok video. We don't support slideshows or LIVE videos, and we can't 
show videos that are private, or have been deleted. Sorry! Something wrong? 
Open an issue on GitHub at ${Constants.HOST_URL}/issue <3`.replace(/\s+/g, " ");

const handle404: Parameters<typeof app.notFound>["0"] = (c) =>
  c.json({
    message: "Not Found",
    success: false,

    routes: app.routes
      .filter((r) => r.path !== "*")
      .map((r) => ({
        path: r.path,
        method: r.method,
      })),
  });

app.notFound(handle404);

app.onError((err, c) => {
  // Create a random identifiable error ID
  const requestId = Array.from(Array(10), () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join("");

  if (err instanceof StatusError) {
    // If the request is from Discord, we should render an embed
    // as the response
    if (isDiscord(c.req)) {
      return c.html(
        <GenericDiscordEmbed
          title="TikTxk - Error"
          description={err.message}
          color="#f44336"
        />,
      );
    }

    // If the error is a 404, handle it as such
    if (err.status == 404) return handle404(c) as Response;

    // Otherwise just set the status code
    c.status(err.status as StatusCode);
  } else {
    // If the error is not a StatusError, log it to the console
    console.error(err);

    // Handle Discord embeds
    if (isDiscord(c.req)) {
      c.html(
        <GenericDiscordEmbed
          title="TikTxk - Error"
          description={`A fatal error occurred while processing your request. Please try again later. If this error persists, please open an issue on GitHub at ${Constants.HOST_URL}/issue. Error ID: ${requestId}.`}
          color="#f44336"
        />,
      );
    } else {
      c.status(500);
    }
  }

  if (c.env?.SENTRY_DSN && !(err instanceof StatusError)) {
    try {
      const sentry = new Toucan({
        dsn: c.env.SENTRY_DSN,
        context: c.executionCtx,
        request: c.req.raw,
      });

      sentry.setExtra("request_id", requestId);
      sentry.captureException(err);
    } catch (e) {
      console.error("Failed to send error to Sentry", e);
    }
  }

  return c.json({
    _comment: errorComment,
    error: err.message,
    success: false,
  });
});

// noinspection JSUnusedGlobalSymbols
export default app;
