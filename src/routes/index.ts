import { Hono } from "hono";

export const addIndexRoutes = (app: Hono) => {
  app.get("/", (c) => c.redirect("https://britmoji.org"));
  app.get("/crab", (c) => c.text("🦀"));
};
