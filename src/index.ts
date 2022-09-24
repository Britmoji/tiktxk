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

const app = new Hono();

app.use("*", etag(), logger());

// Add routes
addIndexRoutes(app);
addTikTokRoutes(app);

// Add error handlers
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
    error: err.message,
    success: false,
  });
});

// noinspection JSUnusedGlobalSymbols
export default app;
