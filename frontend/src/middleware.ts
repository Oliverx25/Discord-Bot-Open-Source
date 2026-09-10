import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "./server/session";

function needsSessionUser(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (needsSessionUser(context.url.pathname)) {
    context.locals.user = await getSessionUser(context.request, context.locals);
  } else {
    context.locals.user = null;
  }

  const response = await next();
  if (needsSessionUser(context.url.pathname)) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
});
