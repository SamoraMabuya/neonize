"use strict";

// Show the UI and set its size
figma.showUI(__html__);
figma.ui.resize(400, 335);

// Convert hex color to RGBA
const hexToRgb = (hex: string): RGBA => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
        a: 1,
      }
    : { r: 1, g: 1, b: 1, a: 1 };
}

// Convert RGBA color to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Define valid node types
type ValidNodeType =
  | RectangleNode
  | EllipseNode
  | PolygonNode
  | TextNode
  | LineNode
  | StarNode
  | VectorNode;

// Check if a node is of a valid type
const isNodeType = (node: SceneNode): node is ValidNodeType =>
  [
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "LINE",
    "STAR",
    "VECTOR",
    "TEXT",
  ].includes(node.type);

// Initial color values
let intensityColor: RGBA = { r: 1, g: 1, b: 1, a: 1 };
let spreadColor: RGBA = { r: 1, g: 1, b: 1, a: 1 };

// Update the UI with colors from the selected node
function updateUIColorFromSelection() {
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
    const node = selectedNodes[0];
    const fills = node.fills as ReadonlyArray<Paint>;

    if (fills.length > 0 && fills[0].type === "SOLID") {
      const solidFill = fills[0] as SolidPaint;
      const color = solidFill.color;
      const hexColor = rgbToHex(color.r, color.g, color.b);

      figma.ui.postMessage({
        type: "update-intensityColor-ui",
        color: hexColor,
      });
      figma.ui.postMessage({
        type: "update-spreadColor-ui",
        color: hexColor,
      });

      intensityColor = {
        r: color.r,
        g: color.g,
        b: color.b,
        a: solidFill.opacity || 1,
      };
      spreadColor = {
        r: color.r,
        g: color.g,
        b: color.b,
        a: solidFill.opacity || 1,
      };
    }
  } else {
    figma.ui.postMessage({ type: "reset-range-ui" });
  }
}

// Apply intensity effects to a node
async function applyIntensityEffects(
  node: SceneNode,
  processedOpacity: number,
  color: RGBA,
  rawIntensityValue: number
) {
  if ("effects" in node) {
    const effects: DropShadowEffect[] = [];
    for (let i = 0; i < 10; i++) {
      effects.push({
        type: "DROP_SHADOW",
        color: { ...color, a: processedOpacity },
        offset: { x: 0, y: 0 },
        radius: 8.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      });
    }
    node.effects = effects;
  }
  node.setPluginData("intensityValue", rawIntensityValue.toString());
}

// Apply spread effects to a node
async function applySpreadEffects(node: SceneNode, value: number, color: RGBA) {
  if ("effects" in node) {
    const effects: DropShadowEffect[] = [];
    for (let i = 0; i < 10; i++) {
      effects.push({
        type: "DROP_SHADOW",
        color: { ...color, a: 1 },
        offset: { x: 0, y: 0 },
        radius: value * 2,
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      });
    }
    node.effects = effects;
  }
  node.setPluginData("spreadValue", value.toString());
}

// Update the UI when the selection changes
figma.on("selectionchange", () => {
  updateUIColorFromSelection();
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  const selectedNodes = figma.currentPage.selection;

  switch (msg.type) {
    case "intensityColor-change":
      intensityColor = hexToRgb(msg.color);
      const intensityNode = selectedNodes[0];
      if (intensityNode && isNodeType(intensityNode)) {
        const rawIntensityValue = parseInt(
          intensityNode.getPluginData("intensityValue")
        );
        applyIntensityEffects(
          intensityNode,
          rawIntensityValue / 100,
          intensityColor,
          rawIntensityValue
        );
      }
      break;

    case "spreadColor-change":
      spreadColor = hexToRgb(msg.color);
      const spreadNode = selectedNodes[0];
      if (spreadNode && isNodeType(spreadNode)) {
        applySpreadEffects(
          spreadNode,
          parseInt(spreadNode.getPluginData("spreadValue")),
          spreadColor
        );
      }
      break;

    case "intensity-change":
      const intensityValue = parseInt(msg.value);
      const selectedNode = selectedNodes[0];
      if (selectedNode && isNodeType(selectedNode)) {
        applyIntensityEffects(
          selectedNode,
          intensityValue / 100,
          intensityColor,
          intensityValue
        );
      }
      break;

    case "spread-change":
      const spreadValue = parseInt(msg.value);
      const node = selectedNodes[0];
      if (node && isNodeType(node)) {
        applySpreadEffects(node, spreadValue, spreadColor);
      }
      break;

    case "opacity-change":
      const opacityValue = msg.value / 100;
      const targetNode = selectedNodes[0];
      if (targetNode && isNodeType(targetNode)) {
        if ("effects" in targetNode) {
          const newEffects = targetNode.effects.map((effect) => {
            if (effect.type === "DROP_SHADOW") {
              return {
                ...effect,
                color: { ...effect.color, a: opacityValue },
              };
            }
            return effect;
          });
          targetNode.effects = newEffects;
        }
      }
      break;
  }
};
