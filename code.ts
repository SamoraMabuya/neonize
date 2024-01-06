"use strict";

figma.showUI(__html__);
figma.ui.resize(400, 220);

function createNeonizeGroupWithDuplicates(node: SceneNode): GroupNode | null {
  if (!node.parent) {
    figma.notify("Cannot group nodes: the selected node has no parent.");
    return null;
  }

  // Rename the original node
  node.name = "Original";

  // Create a group with the original node
  const group = figma.group([node], node.parent);
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
  // Calculate the radius from the slider value
  const radius = value * 0.2;

  // Create an array to store the drop shadow effects
  const effects: DropShadowEffect[] = [];

  // Check if the first drop shadow's radius is 0, then reset all to 0
  const finalRadius = radius <= 0 ? 0 : radius;

  // Create 5 drop shadow effects with the same or reset radius
  for (let i = 0; i < 5; i++) {
    effects.push({
      type: "DROP_SHADOW",
      color: currentColor,
      offset: { x: 0, y: 0 },
      radius: finalRadius,
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
      updateUIColorFromSelection();
    }, 150);
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

    // Check if the node has been enhanced by the plugin
    const enhanced = node.getPluginData("enhanced");
    if (enhanced === "true") {
      // If enhanced, get the stored range value
      const rangeValue = node.getPluginData("rangeValue");
      // Update UI with the stored range value
      figma.ui.postMessage({ type: "update-range-ui", value: rangeValue });
    } else {
      // If not enhanced, reset the slider to 0
      figma.ui.postMessage({ type: "reset-range-ui" });
    }
  } else {
    // No valid node selected, reset the slider to 0
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

function createIntensityDuplicate(
  node: SceneNode,
  group: GroupNode
): SceneNode | null {
  const intensityDuplicate = node.clone();
  intensityDuplicate.name = "Intensity";
  intensityDuplicate.x = node.x;
  intensityDuplicate.y = node.y;
  group.appendChild(intensityDuplicate);
  return intensityDuplicate;
}

function createSpreadDuplicate(
  node: SceneNode,
  group: GroupNode | null
): SceneNode | null {
  if (!node.parent) {
    figma.notify(
      "Cannot create spread duplicate: the selected node has no parent."
    );
    return null;
  }

  // Clone the original node and name it "Spread"
  const spreadDuplicate = node.clone();
  spreadDuplicate.name = "Spread";
  spreadDuplicate.x = node.x;
  spreadDuplicate.y = node.y;

  // If a group already exists, add the spread duplicate to it
  if (group) {
    group.appendChild(spreadDuplicate);
  }

  return spreadDuplicate;
}

function applyIntensityEffects(node: SceneNode, opacity: number) {
  if ("effects" in node) {
    const effects: DropShadowEffect[] = [];

    for (let i = 0; i < 10; i++) {
      effects.push({
        type: "DROP_SHADOW",
        color: { ...currentColor, a: opacity }, // Apply opacity to the color
        offset: { x: 0, y: 0 },
        radius: 5.5, // Fixed radius
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      });
    }

    node.effects = effects;
  }
}

function applySpreadEffects(node: SceneNode, value: number) {
  if ("effects" in node) {
    const effects: DropShadowEffect[] = [];
    for (let i = 0; i < 10; i++) {
      effects.push({
        type: "DROP_SHADOW",
        color: { ...currentColor, a: 1 }, // Set opacity to 100%
        offset: { x: 0, y: 0 }, // Incremental offset for spread effect
        radius: value, // Use the value from the slider for radius
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      });
    }

    node.effects = effects;
  }
}

function applyLayerBlurs(node: SceneNode, blurValue: number) {
  if ("effects" in node) {
    const effects: BlurEffect[] = [];
    for (let i = 0; i < 10; i++) {
      effects.push({
        type: "LAYER_BLUR",
        radius: blurValue,
        visible: true,
      });
    }
    node.effects = effects;
  }
}

function findIntensityDuplicate(node: SceneNode): SceneNode | null {
  // Find the intensity duplicate in the group
  let group = findNeonizeGroupForNode(node);
  return group ? group.findOne((n) => n.name === "Intensity") : null;
}
figma.on("selectionchange", () => {
  updateUIColorFromSelection();
});
function findSpreadDuplicate(node: SceneNode): SceneNode | null {
  // Find the Neonize Group containing the original node
  let group = findNeonizeGroupForNode(node);

  // Search for the "Spread" clone within the group
  if (group) {
    return group.findOne((n) => n.name === "Spread") as SceneNode | null;
  }

  return null;
}

figma.ui.onmessage = async (msg) => {
  const selectedNodes = figma.currentPage.selection;

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
      const intensityValue = parseFloat(msg.value) / 100;
      let selectedNode = selectedNodes[0];

      // If the entire group is selected, find the original node within the group
      if (
        selectedNode.type === "GROUP" &&
        selectedNode.name === "Neonize Group"
      ) {
        const originalNode = selectedNode.findOne(
          (n) => n.getPluginData("isNeonized") === "true"
        );
        if (originalNode) {
          selectedNode = originalNode;
        }
      }

      if (selectedNode && isNodeType(selectedNode)) {
        let group = findNeonizeGroupForNode(selectedNode);

        // Create group with duplicates if it doesn't exist
        if (!group) {
          group = createNeonizeGroupWithDuplicates(selectedNode);
        }

        // Find or create intensity node
        let intensityNode = findIntensityDuplicate(selectedNode);
        if (!intensityNode && group) {
          intensityNode = createIntensityDuplicate(selectedNode, group);
        }

        // Apply intensity effects
        if (intensityNode) {
          applyIntensityEffects(intensityNode, intensityValue);
        }
      }
      break;

    case "size-change":
      const spreadValue = parseInt(msg.value);
      let group = findNeonizeGroupForNode(selectedNodes[0]);

      // Create group with duplicates if it doesn't exist
      if (!group && selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
        group = createNeonizeGroupWithDuplicates(selectedNodes[0]);
      }

      // Find existing spread node or create one if it doesn't exist
      let spreadNode = findSpreadDuplicate(selectedNodes[0]);
      if (!spreadNode && group) {
        spreadNode = createSpreadDuplicate(selectedNodes[0], group);
      }

      // Apply spread effects
      if (spreadNode) {
        applySpreadEffects(spreadNode, spreadValue);
      }
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
