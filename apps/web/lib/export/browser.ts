import { render, imageUrls, type Doc, type ExportOptions } from ".";

/** Downloads text or bytes as a file. */
export function download(name: string, mime: string, data: BlobPart) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

let fontCss: Promise<string> | undefined;
/** Peyda as base64 @font-face rules, so a saved HTML or PDF keeps the app's font on any machine. Empty if the fetch fails. */
export function peydaCss(): Promise<string> {
  fontCss ??= Promise.all(
    ([["regular", 400], ["bold", 700]] as const).map(async ([file, weight]) => {
      const bytes = new Uint8Array(await (await fetch(`/fonts/peyda-${file}.woff2`)).arrayBuffer());
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      return `@font-face{font-family:Peyda;font-weight:${weight};src:url(data:font/woff2;base64,${btoa(bin)}) format("woff2")}`;
    }),
  ).then((r) => r.join(""), () => "");
  return fontCss;
}

/** Fetches a screenshot and re-encodes it as a smaller JPEG data: URL; falls back to the original URL if it cannot. */
async function shrink(url: string): Promise<string> {
  try {
    const bmp = await createImageBitmap(await (await fetch(url)).blob());
    const scale = Math.min(1, 1100 / bmp.width);
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } catch {
    return url;
  }
}

async function inline(urls: string[]): Promise<(u: string) => string> {
  const map = new Map<string, string>();
  let next = 0;
  // Six at a time: enough to be quick, few enough not to stall the page.
  await Promise.all(
    Array.from({ length: Math.min(6, urls.length) }, async () => {
      while (next < urls.length) {
        const u = urls[next++];
        map.set(u, await shrink(u));
      }
    }),
  );
  return (u) => map.get(u) ?? u;
}

/** Opens the print dialog for a rendered page in a hidden frame, so "Save as PDF" gets the report and not the app. */
function printHtml(html: string, title: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;inset-inline-end:0;bottom:0;width:0;height:0;border:0";
  frame.srcdoc = html;
  frame.onload = () => {
    const w = frame.contentWindow!;
    w.document.title = title;
    w.onafterprint = () => frame.remove();
    setTimeout(() => (w.focus(), w.print()), 150);
    // Browsers that never fire afterprint would otherwise leave the frame behind.
    setTimeout(() => frame.remove(), 120_000);
  };
  document.body.append(frame);
}

/** Builds the file for one report and downloads it (PDF opens the print dialog). Screenshots are embedded for HTML and PDF. */
export async function deliver(doc: Doc, o: ExportOptions) {
  const embed = o.format === "html" || o.format === "pdf";
  const file = render(doc, o, embed ? await inline(imageUrls(doc)) : undefined, embed ? await peydaCss() : undefined);
  if (o.format === "pdf") printHtml(file.text, file.name.replace(/\.html$/, ""));
  else download(file.name, file.mime, file.text);
}

/** The same font as files plus rules pointing at them, for zips where inlining it into every report would repeat 90 KB. */
export const PEYDA_RELATIVE_CSS =
  '@font-face{font-family:Peyda;font-weight:400;src:url(fonts/peyda-regular.woff2) format("woff2")}' +
  '@font-face{font-family:Peyda;font-weight:700;src:url(fonts/peyda-bold.woff2) format("woff2")}';
export async function peydaFiles(): Promise<Record<string, Uint8Array>> {
  const get = async (f: string) => new Uint8Array(await (await fetch(`/fonts/peyda-${f}.woff2`)).arrayBuffer());
  return { "fonts/peyda-regular.woff2": await get("regular"), "fonts/peyda-bold.woff2": await get("bold") };
}
