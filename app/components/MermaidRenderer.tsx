"use client";

import { useEffect } from "react";
import mermaid from "mermaid";

export default function MermaidRenderer() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
    });
    mermaid.run({ nodes: document.querySelectorAll(".mermaid") });
  }, []);

  return null;
}
