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
import { StatusError } from "./types/cloudflare";
import { StatusCode } from "hono/utils/http-status";
import { addTikTokRoutes } from "./routes/tiktok";
import { addIndexRoutes } from "./routes";
import { addEmbedRoutes } from "@/routes/embed";

const app = new Hono();

app.use("*", etag(), logger());

// Add routes
addIndexRoutes(app);
addEmbedRoutes(app);
addTikTokRoutes(app);

// Add error handlers
const errorComment =
  `If you're here, and have no idea what this nerd shit is, something went wrong when
trying to embed a TikTok video. We don't support LIVE videos, and we don't support videos that
are private, or have been deleted. If you're trying to embed a video that is private, or has
been deleted, you can't. Sorry! Otherwise, please open an issue on GitHub at https://github.com/britmoji/tiktxk <3`.replace(
    /\s+/g,
    " ",
  );

app.notFound(() => {
  throw new StatusError(404);
});

app.onError((err, c) => {
  if (err instanceof StatusError) {
    c.status(<StatusCode>err.status);
  } else {
    console.error(err);
    c.status(500);
  }

  return c.json({
    _comment: errorComment,
    error: err.message,
    success: false,
  });
});

// noinspection JSUnusedGlobalSymbols
export default app;
