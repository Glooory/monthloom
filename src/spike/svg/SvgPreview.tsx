import React from "react";
import type { SvgDocument, SvgNode } from "./ast";

function renderNode(node: SvgNode, index: number): React.ReactElement {
  switch (node.kind) {
    case "group":
      return (
        <g key={index} opacity={node.opacity}>
          {node.children.map(renderNode)}
        </g>
      );
    case "path":
      return (
        <path
          key={index}
          d={node.d}
          transform={node.transform}
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          opacity={node.opacity}
        />
      );
    case "line":
      return (
        <line
          key={index}
          x1={node.x1}
          y1={node.y1}
          x2={node.x2}
          y2={node.y2}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          opacity={node.opacity}
        />
      );
    case "rect":
      return (
        <rect
          key={index}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          opacity={node.opacity}
        />
      );
    case "image":
      return (
        <image
          key={index}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          href={node.href}
          opacity={node.opacity}
        />
      );
  }
}

export function SvgPreview({ document }: { document: SvgDocument }) {
  return (
    <svg
      width={document.width}
      height={document.height}
      viewBox={document.viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {document.children.map(renderNode)}
    </svg>
  );
}
