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

import { Constants } from "@/constants";

export class StatusError extends Error {
  private static readonly DEFAULT_MESSAGE = `An unknown error occurred, please report this issue at ${Constants.HOST_URL}/issue, and include the request ID.`;

  public static readonly LANG = {
    UNKNOWN_AWEME:
      "The video could not be found. Either it was deleted, or TikTok has removed it.",
    FAILED_TO_PARSE_VIDEO_ID:
      "The video ID could not be parsed, is it a valid TikTok URL?",
  };

  private static readonly STATUSES = new Map<number, string>([
    [400, "Bad Request"],
    [401, "Unauthorized"],
    [403, "Forbidden"],
    [404, "Not Found"],
    [405, "Method Not Allowed"],
  ]);

  constructor(
    public status: number,
    message?: string | keyof typeof StatusError.LANG,
  ) {
    super(
      message
        ? StatusError.LANG[message] || message
        : StatusError.STATUSES.get(status) || StatusError.DEFAULT_MESSAGE,
    );
  }
}
