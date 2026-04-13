"use client";

import { useEffect } from "react";

function createNode(source: Node): Node {
  if (source.nodeName === "SCRIPT") {
    const orig = source as HTMLScriptElement;
    const script = document.createElement("script");
    Array.from(orig.attributes).forEach((attr) =>
      script.setAttribute(attr.name, attr.value),
    );
    script.textContent = orig.textContent;
    return script;
  }
  return source.cloneNode(true);
}

export default function HeadInjection({ html }: { html: string }) {
  useEffect(() => {
    if (!html) return;

    const container = document.createElement("div");
    container.innerHTML = html;
    const nodes = Array.from(container.childNodes).map(createNode);
    nodes.forEach((node) => document.head.appendChild(node));

    return () => {
      nodes.forEach((node) => {
        if (document.head.contains(node)) {
          document.head.removeChild(node);
        }
      });
    };
  }, [html]);

  return null;
}
