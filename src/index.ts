/*
    tiktxk - Open Source, Privacy First TikTok Downloader
    Copyright (C) 2022 Britmoji

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// inshallah this works
// 🦀 crab in the code

const TT_API = "https://t.tiktok.com/api/item/detail/?itemId="
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0"

async function get(url: string) { // Wrapper for fetch, pretend to be a human.
	return await fetch(url, {
		headers: {
			"User-Agent": USER_AGENT
		},
	})
}

async function getVideoURL(videoID: string): Promise<string | undefined> {
	let res = await get(TT_API + videoID)
	let json: any = await res.json() // TODO: type
	let videoURL = undefined

	try {
		videoURL = json?.itemInfo?.itemStruct?.video?.downloadAddr
	} catch (e) { /* TODO: Maybe do something here... an image, perhaps? */ }

	return videoURL
}

async function idFromTikTokURL(url: string) {
	let videoID = new URL(url).pathname.split("/").pop()
	if(!videoID) return undefined
	
	return await getVideoURL(videoID)
}

export default {
	async fetch(request: Request): Promise<Response> {
		let url = new URL(request.url)
		// If the URL is like /@username/video/1234567891234567891
		if (url.pathname.match(/\/@[^\/]+\/video\/\d+/)) {
			let videoURL = await idFromTikTokURL(request.url)
			if(videoURL) return Response.redirect(videoURL, 302)
		} 

		// If the URL is like https://www.tiktok.com/t/ZTRav7308
		if (url.pathname.match(/\/t\/\w+/)) {
			let videoID = url.pathname.replace("/t/", "").replace(/\/$/, "")
			if(!videoID) return new Response("Failed to parse Video ID from t URL", { status: 400 })

			// We actually need to go to that page to get a URL we like :)
			let res = await get("https://www.tiktok.com/t/" + videoID)

			let videoURL = await idFromTikTokURL(res.url)
			if(videoURL) return Response.redirect(videoURL, 302)
		}

		// There's a third one, vm.tiktok.com/VIDEO_ID
		// But, I don't know how to host the subdomain thing in a Worker right now.
		
		return Response.redirect("https://britmoji.org/")
	}
}