"use strict";

figma.showUI(__html__);
figma.ui.resize(400, 220);

function createAndGroupDuplicates(node: SceneNode): GroupNode | null {
  if (!node.parent) {
    figma.notify("Cannot group nodes: the selected node has no parent.");
    return null;
  }

  const duplicates: SceneNode[] = [];
  for (let i = 0; i < 4; i++) {
    const duplicate = node.clone();
    duplicate.name = `spread ${4 - i}`; // Naming the duplicates in reverse order

    if ("absoluteTransform" in node.parent) {
      duplicate.x = node.x + node.parent.absoluteTransform[0][2];
      duplicate.y = node.y + node.parent.absoluteTransform[1][2];
    } else {
      duplicate.x = node.x;
      duplicate.y = node.y;
    }

    duplicates.unshift(duplicate); // Add to the beginning of the array
  }

  // Rename the original node
  node.name = "Original";

  // Group the original node with its duplicates, with original on top
  const allNodes = [...duplicates, node]; // Original node first, then duplicates in reverse order
  const group = figma.group(allNodes, node.parent);
  group.appendChild(node);
  group.name = "Neonize Group";
  node.setPluginData("isNeonized", "true");

  return group;
}
function applyLayerBlurToGroup(group: GroupNode, blurValue: number) {
  group.children.forEach((child) => {
    // Apply blur only to duplicates, not the original node
    // Check if the child is of a type that can have effects
    if ("effects" in child && child.getPluginData("isNeonized") !== "true") {
      const blurEffect: Effect = {
        type: "LAYER_BLUR",
        radius: blurValue * 10,
        visible: true,
      };
      child.effects = [blurEffect];
    }
  });
}

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
  | VectorNode;

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

function applyEffectsToNode(
  node: ValidNodeType,
  effects: DropShadowEffect[],
  rangeValue: number
) {
  if (node) {
    node.effects = effects;
    node.setPluginData("enhanced", "true");
    node.setPluginData("rangeValue", rangeValue.toString());
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

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function reselectCurrentNode() {
  const currentSelection = figma.currentPage.selection;

  if (currentSelection.length > 0) {
    figma.currentPage.selection = [];

    setTimeout(() => {
      figma.currentPage.selection = currentSelection;
    }, 100);
  }
}

function updateUIColorFromSelection() {
  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
    const shapeNode = selectedNodes[0];
    const fills = shapeNode.fills as ReadonlyArray<Paint>;
    if (fills.length > 0 && fills[0].type === "SOLID") {
      const solidFill = fills[0] as SolidPaint;
      const color = solidFill.color;
      const hexColor = rgbToHex(color.r, color.g, color.b);
      currentColor = {
        r: color.r,
        g: color.g,
        b: color.b,
        a: solidFill.opacity || 1,
      };
      figma.ui.postMessage({ type: "update-color-ui", color: hexColor });
    }
  }
}

figma.on("run", () => {
  reselectCurrentNode();
});

figma.on("selectionchange", () => {
  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
    const node = selectedNodes[0];
    const enhanced = node.getPluginData("enhanced");
    if (enhanced) {
      const rangeValue = node.getPluginData("rangeValue");
      // Post message to UI to update range slider
      figma.ui.postMessage({ type: "update-range-ui", value: rangeValue });
    } else {
      // Post message to UI to reset range slider
      figma.ui.postMessage({ type: "reset-range-ui" });
    }
  } else {
    // Post message to UI to reset range slider
    figma.ui.postMessage({ type: "reset-range-ui" });
  }
});
function findNeonizeGroupForNode(node: SceneNode): GroupNode | null {
  let currentNode: BaseNode | null = node;

  while (currentNode) {
    if (currentNode.type === "GROUP" && currentNode.name === "Neonize Group") {
      return currentNode as GroupNode;
    }
    currentNode = currentNode.parent;
  }

  return null;
}
function findGroupWithOriginalNode(node: SceneNode): GroupNode | null {
  let currentNode: BaseNode | null = node;
  while (currentNode) {
    if (
      currentNode.getPluginData("isNeonized") === "true" &&
      currentNode.type === "GROUP"
    ) {
      return currentNode as GroupNode;
    }
    currentNode = currentNode.parent;
  }
  return null;
}

// Updated to check all parent nodes for an existing "Neonize Group"

// selectionchange listener
figma.on("selectionchange", () => {
  updateUIColorFromSelection();
});
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "ui-ready":
      // Called when the UI is ready; initialize with the selected node color
      updateUIColorFromSelection();

      break;

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
          applyEffectsToNode(node, glowEffects, msg.value);
        }
      });
      break;
    case "size-change":
      const blurValue = parseInt(msg.value);
      const selectedNodes = figma.currentPage.selection;

      if (selectedNodes.length === 0) {
        figma.notify("Please select a node");
        break;
      }

      const selectedNode = selectedNodes[0];
      let group = findNeonizeGroupForNode(selectedNode);

      // Check if the node or any of its parents have been neonized
      if (selectedNode.getPluginData("isNeonized") === "true" || group) {
        group = group || findGroupWithOriginalNode(selectedNode);
      } else if (isNodeType(selectedNode)) {
        group = createAndGroupDuplicates(selectedNode);
      }

      if (!group) {
        figma.notify("Cannot find or create a Neonize Group");
        break;
      }

      applyLayerBlurToGroup(group, blurValue);
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
