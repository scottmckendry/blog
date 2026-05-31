import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "scottmckendry.tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#16181a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
      }}
    >
      <div
        style={{
          display: "flex",
          color: "#7b8496",
          fontSize: 32,
          marginBottom: 16,
        }}
      >
        $ whoami
      </div>
      <div
        style={{
          display: "flex",
          color: "#5ef1ff",
          fontSize: 72,
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        scottmckendry
      </div>
      <div
        style={{
          display: "flex",
          color: "#ffffff",
          fontSize: 28,
          lineHeight: 1.5,
        }}
      >
        building things incorrectly, in public.
      </div>
      <div
        style={{
          display: "flex",
          color: "#ffffff",
          fontSize: 28,
          lineHeight: 1.5,
        }}
      >
        the way it&apos;s meant to be.
      </div>
      <div
        style={{
          display: "flex",
          color: "#7b8496",
          fontSize: 24,
          marginTop: 40,
        }}
      >
        $ echo $THEME
      </div>
      <div
        style={{
          display: "flex",
          color: "#5ef1ff",
          fontSize: 24,
          marginTop: 4,
        }}
      >
        cyberdream.nvim
      </div>
    </div>,
    { ...size },
  );
}
