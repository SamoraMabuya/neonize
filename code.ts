"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 100);

const PLUGIN_GROUP_NAME = "Neonize";

function hexToRgb(hex: string): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
        a: 1, // Full opacity
      }
    : { r: 1, g: 1, b: 1, a: 1 }; // Default white
}

let currentColor: RGBA = { r: 1, g: 1, b: 1, a: 1 }; // Default color

function createDropShadowEffects(value: number): DropShadowEffect[] {
  const effects: DropShadowEffect[] = [];
  const baseMultiplier = value * 0.2;

  for (let i = 0; i < 5; i++) {
    effects.push({
      type: "DROP_SHADOW",
      color: currentColor,
      offset: { x: 0, y: 0 },
      radius: baseMultiplier + i * 10,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
      showShadowBehindNode: false,
    });
  }

  return effects;
}

type ValidNodeType =
  | RectangleNode
  | EllipseNode
  | PolygonNode
  | TextNode
  | LineNode
  | StarNode
  | VectorNode
  | GroupNode;

const isNodeType = (node: SceneNode): node is ValidNodeType =>
  [
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "LINE",
    "STAR",
    "VECTOR",
    "TEXT",
    "GROUP",
  ].includes(node.type);

function applyEffectsToNode(node: ValidNodeType, effects: DropShadowEffect[]) {
  if (node) {
    node.effects = effects;
  }
}

function updateNodeDropShadow(node: ValidNodeType) {
  if ("effects" in node) {
    let effects = node.effects.map((effect) =>
      effect.type === "DROP_SHADOW"
        ? { ...effect, color: currentColor }
        : effect
    );
    node.effects = effects;
  }
}

const ERROR_MESSAGE = "Please use shapes or text";
const ERROR_OPTIONS = {
  timeout: 400,
  error: true,
  button: {
    text: "Dismiss",
    action: () => {},
  },
};

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "color-change":
      currentColor = hexToRgb(msg.color);
      updateDropShadowColor();
      break;
    case "save-color-value":
      await figma.clientStorage.setAsync("savedColorValue", msg.color);
      break;

    case "get-saved-color-value":
      const savedColor =
        (await figma.clientStorage.getAsync("savedColorValue")) || "#ffffff";
      figma.ui.postMessage({ type: "update-color-ui", color: savedColor });
      currentColor = hexToRgb(savedColor);
      updateDropShadowColor();
      break;

    case "save-range-value":
      await figma.clientStorage.setAsync("savedRangeValue", msg.value);
      break;

    case "get-saved-range-value":
      const savedValue =
        (await figma.clientStorage.getAsync("savedRangeValue")) || 0;
      figma.ui.postMessage({ type: "update-range-ui", value: savedValue });
      break;
    case "value-change":
      const glowEffects = createDropShadowEffects(msg.value);
      if (!figma.currentPage.selection.every(isNodeType)) {
        figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
        return;
      }
      figma.currentPage.selection.forEach((node) => {
        if (isNodeType(node)) {
          applyEffectsToNode(node, glowEffects);
        }
      });
      break;
  }
};

function updateDropShadowColor() {
  figma.currentPage.selection.forEach((selectedNode) => {
    if (isNodeType(selectedNode)) {
      updateNodeDropShadow(selectedNode);
    }
  });
}
