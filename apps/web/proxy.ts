import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignIn = createRouteMatcher(["/signin"]);
const isApp = createRouteMatcher(["/dashboard(.*)", "/projects(.*)", "/runs(.*)", "/tests(.*)", "/settings(.*)", "/notifications(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isSignIn(request) && (await convexAuth.isAuthenticated())) return nextjsMiddlewareRedirect(request, "/dashboard");
  if (isApp(request) && !(await convexAuth.isAuthenticated())) return nextjsMiddlewareRedirect(request, "/signin");
});

export const config = { matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"] };
