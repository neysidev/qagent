import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();

/** Fetches the site's home page and stores its <title> and favicon on the project. Best effort: failures leave the defaults. */
export const fetchSiteMeta = internalAction({
  args: { projectId: v.id("projects"), baseUrl: v.string() },
  handler: async (ctx, { projectId, baseUrl }) => {
    let title: string | undefined;
    let faviconUrl: string | undefined;
    try {
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "Mozilla/5.0 (compatible; QAgent)" } });
      // ponytail: regex parse of the first 256KB, a real HTML parser if odd markup shows up
      const html = (await res.text()).slice(0, 256 * 1024);
      title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || undefined;
      const link = [...html.matchAll(/<link\b[^>]*>/gi)]
        .map((m) => m[0])
        .find((tag) => /\brel\s*=\s*["']?[^"'>]*\bicon\b/i.test(tag) && !/mask-icon/i.test(tag));
      const href = link?.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      faviconUrl = new URL(decode(href?.[1] ?? href?.[2] ?? href?.[3] ?? "/favicon.ico"), res.url || baseUrl).href;
    } catch {
      return;
    }
    await ctx.runMutation(internal.siteMeta.save, { projectId, title: title?.slice(0, 120), faviconUrl });
  },
});

export const save = internalMutation({
  args: { projectId: v.id("projects"), title: v.optional(v.string()), faviconUrl: v.optional(v.string()) },
  handler: async (ctx, { projectId, title, faviconUrl }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return;
    // Only replace the default name (the host); a name the user chose stays.
    const isDefaultName = project.name === new URL(project.baseUrl).host;
    await ctx.db.patch(projectId, { faviconUrl, ...(title && isDefaultName ? { name: title } : {}) });
  },
});
