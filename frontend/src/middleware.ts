import { defineMiddleware } from "astro:middleware";
import {
  GUILD_COOKIE,
  GUILD_COOKIE_MAX_AGE_SEC,
  readGuildIdFromCookieHeader,
} from "./lib/guildCookie";
import { isDashboardPath, loadPanelContext } from "./server/panel";
import { getSessionUser } from "./server/session";

function guildSetCookie(id: string, secure: boolean): string {
  const parts = [
    `${GUILD_COOKIE}=${encodeURIComponent(id)}`,
    "Path=/",
    `Max-Age=${GUILD_COOKIE_MAX_AGE_SEC}`,
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  context.locals.panel = null;

  if (pathname === "/" || pathname === "") {
    context.locals.user = await getSessionUser(
      context.request,
      context.locals,
    );
    const response = await next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (isDashboardPath(pathname)) {
    const panel = await loadPanelContext(context.request, context.locals);
    if (!panel) {
      return context.redirect("/");
    }
    context.locals.user = panel.me.user;
    context.locals.panel = panel;
    const response = await next();
    response.headers.set("Cache-Control", "private, no-store");
    if (panel.selectedGuild) {
      const current = readGuildIdFromCookieHeader(
        context.request.headers.get("cookie"),
      );
      if (current !== panel.selectedGuild.id) {
        response.headers.append(
          "Set-Cookie",
          guildSetCookie(
            panel.selectedGuild.id,
            context.url.protocol === "https:",
          ),
        );
      }
    }
    return response;
  }

  context.locals.user = null;
  return next();
});
