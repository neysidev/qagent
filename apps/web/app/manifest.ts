import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "کیوایجنت",
    short_name: "کیوایجنت",
    description: "ایجنت هوشمندی که مسیرهای سایتت را مثل یک کاربر واقعی تست می‌کند.",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f26b1d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
