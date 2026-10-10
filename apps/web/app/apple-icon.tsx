import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="512" height="512" viewBox="5 3 60 64" fill="none" stroke="#0b0b0b" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M10 22 L10 48 L35 62 L35 36 Z" fill="#e6e6e6" />
        <path d="M60 22 L60 48 L35 62 L35 36 Z" fill="#f7f7f7" />
        <path d="M35 8 L60 22 L35 36 L10 22 Z" fill="#fff" />
        <rect x="30" y="17" width="10" height="10" stroke="none" fill="#f26b1d" />
      </svg>
    ),
    size,
  );
}
