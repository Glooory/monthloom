import type { SvgDocument } from "./document";
import type { SvgNode } from "./ast";

function renderNode(node: SvgNode, key: number | string): React.ReactNode {
  switch (node.kind) {
    case "path":
      return (
        <path
          key={key}
          d={node.d}
          transform={node.transform}
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          opacity={node.opacity}
        />
      );
    case "text":
      return (
        <text
          key={key}
          x={node.x}
          y={node.y}
          fontFamily={node.fontFamily}
          fontSize={node.fontSize}
          fontWeight={node.fontWeight}
          fontStyle={node.fontStyle}
          letterSpacing={node.letterSpacing}
          fill={node.fill}
          opacity={node.opacity}
        >
          {node.text}
        </text>
      );
    case "image":
      return (
        <image
          key={key}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          href={node.href}
          opacity={node.opacity}
        />
      );
    case "line":
      return (
        <line
          key={key}
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
          key={key}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          fill={node.fill}
          opacity={node.opacity}
        />
      );
    case "circle":
      return (
        <circle
          key={key}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={node.fill}
          opacity={node.opacity}
        />
      );
    case "group":
      return (
        <g key={key} opacity={node.opacity}>
          {node.children.map((child, idx) => renderNode(child, idx))}
        </g>
      );
  }
}

export function SvgPreview(props: {
  document: SvgDocument;
  className?: string;
}): JSX.Element {
  const { document: doc, className } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={doc.width}
      height={doc.height}
      viewBox={doc.viewBox}
      className={className}
    >
      {doc.children.map((node, idx) => renderNode(node, idx))}
    </svg>
  );
}
