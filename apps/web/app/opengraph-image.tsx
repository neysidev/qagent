import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "کیوایجنت";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Og() {
  const font = await readFile(join(process.cwd(), "public/fonts/peyda-bold.woff2")).catch(() => null);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", color: "#0b0b0b", fontFamily: "Peyda", gap: 24 }}>
        <svg width="160" height="160" viewBox="0 0 70 70" fill="none" stroke="#0b0b0b" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M10 22 L10 48 L35 62 L35 36 Z" fill="#e6e6e6" />
          <path d="M60 22 L60 48 L35 62 L35 36 Z" fill="#f7f7f7" />
          <path d="M35 8 L60 22 L35 36 L10 22 Z" fill="#fff" />
          <rect x="30" y="17" width="10" height="10" stroke="none" fill="#f26b1d" />
        </svg>
        <div style={{ fontSize: 96, fontWeight: 700 }}>کیوایجنت</div>
        <div style={{ fontSize: 38, color: "#555" }}>ایجنت هوشمندی که سایتت را مثل یک کاربر واقعی تست می‌کند</div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Peyda", data: font, weight: 700 as const }] : [] },
  );
}
