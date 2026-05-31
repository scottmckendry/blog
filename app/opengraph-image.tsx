import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";
export const alt = "scottmckendry.tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSrc = (() => {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const buf = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buf.toString("base64")}`;
})();

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#16181a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px",
      }}
    >
      <img
        src={logoSrc}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>,
    { ...size },
  );
}
