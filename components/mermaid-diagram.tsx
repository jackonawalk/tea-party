"use client";

import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const renderId = `mermaid-${reactId}-${Math.random().toString(36).slice(2)}`;

    void import("mermaid").then(async (mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        htmlLabels: false,
        theme: "neutral",
      });

      try {
        const rendered = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(rendered.svg);
        }
      } catch {
        if (!cancelled) {
          setSvg("");
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (svg === "") {
    return null;
  }

  return (
    <div
      className="mt-2 overflow-x-auto rounded-xl border bg-background p-2 [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
