import { Hono } from "hono";
import { respondDiscord } from "@/util/discord";
import { Constants } from "@/constants";

export const addIndexRoutes = (app: Hono) => {
  // Home page
  app.get("/", (c) =>
    respondDiscord(
      c,
      () => ({
        title: "TikTxk",
        description:
          "TikTxk fixes TikTok's broken embeds in Discord, allowing you to play videos directly without leaving the app. To get started, send any TikTok link, and type s/o/x to fix its stupid lil' embed. Enjoy!",
      }),
      () => c.redirect("https://github.com/Britmoji/tiktxk"),
    ),
  );

  // Crab (very important)
  app.get("/crab", (c) =>
    respondDiscord(
      c,
      () => ({ title: "🦀", description: "fuck it. crab in the code." }),
      () => c.text("🦀"),
    ),
  );

  // Report an issue
  app.get("/issue", (c) =>
    respondDiscord(
      c,
      () => ({
        title: "Report an issue",
        description: "To report an issue, go to https://github.com/Britmoji/tiktxk/issues/new. (Or click the blue link)",
      }),
      () => c.redirect("https://github.com/Britmoji/tiktxk/issues/new"),
    ),
  );
};
