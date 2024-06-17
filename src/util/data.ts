/*
 * tiktxk - Open Source, Privacy First TikTok Embeds
 * Copyright (C) 2024 Britmoji
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

// Shamelessly stolen from https://github.com/yt-dlp/yt-dlp/blob/a0d9967f6822fc279e86bce33464194985148727/yt_dlp/extractor/common.py#L1331
export const searchJSON = <T>(
  startPattern: string,
  content: string,
  endPattern = "",
  containsPattern = "{(.+)}",
): T | undefined => {
  // Create regex
  const regex = new RegExp(
    `(${startPattern})\\s*(?<json>${containsPattern})\\s*(${endPattern})`,
  );

  // Test against regex
  const match = regex.exec(content);
  if (!match || !match.groups?.json) return undefined;

  // Parse the JSON
  try {
    return JSON.parse(match.groups?.json ?? "");
  } catch (e) {
    return undefined;
  }
};

export const traverseJSON = <T>(
  json: object,
  path: string[],
  defaultValue: T | undefined = undefined,
): T | undefined => {
  let current = json;
  for (const key of path) {
    if (current[key] === undefined) return defaultValue;
    current = current[key];
  }
  return current as T;
};
