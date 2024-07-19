// utils.ts

export const hexToRgb = (hex: string): RGBA => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
        a: 1,
      }
    : { r: 1, g: 1, b: 1, a: 1 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export type ValidNodeType =
  | RectangleNode
  | EllipseNode
  | PolygonNode
  | TextNode
  | LineNode
  | StarNode
  | VectorNode;

export const isNodeType = (node: SceneNode): node is ValidNodeType =>
  [
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "LINE",
    "STAR",
    "VECTOR",
    "TEXT",
  ].includes(node.type);
