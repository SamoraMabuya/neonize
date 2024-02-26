"use strict";

figma.showUI(__html__);
figma.ui.resize(400, 335);

function createNeonizeGroupWithDuplicates(node: SceneNode): GroupNode | null {
  if (!node.parent) {
    figma.notify("Cannot group nodes: the selected node has no parent.");
    return null;
  }

  node.name = "Original";

  const group = figma.group([node], node.parent);
  group.name = "Neonize Group";
  node.setPluginData("isNeonized", "true");

  return group;
}
function hexToRgb(hex: string): RGBA {
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

let currentColor: RGBA = { r: 1, g: 1, b: 1, a: 1 };

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

// limit
function updateUIColorFromSelection() {
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
    const node = selectedNodes[0];

    // Check if the node has been neonized
    if (node.getPluginData("neonized") === "true") {
      const dropShadows = node.effects.filter(
        (effect) => effect.type === "DROP_SHADOW"
      ) as DropShadowEffect[];

      if (dropShadows.length > 0) {
        const intensityDropShadow = dropShadows[0]; // Assuming the first drop shadow is for intensity
        const spreadDropShadow =
          dropShadows.length > 1 ? dropShadows[1] : intensityDropShadow; // Assuming the second drop shadow is for spread

        // Extract colors
        intensityColor = intensityDropShadow.color;
        spreadColor = spreadDropShadow.color;

        // Convert RGBA to Hex
        const intensityHex = rgbToHex(
          intensityColor.r,
          intensityColor.g,
          intensityColor.b
        );
        const spreadHex = rgbToHex(spreadColor.r, spreadColor.g, spreadColor.b);

        // Update UI
        figma.ui.postMessage({
          type: "update-intensityColor-ui",
          color: intensityHex,
        });
        figma.ui.postMessage({
          type: "update-spreadColor-ui",
          color: spreadHex,
        });
      }
    } else {
      const fills = node.fills as ReadonlyArray<Paint>;
      if (fills.length > 0 && fills[0].type === "SOLID") {
        const solidFill = fills[0] as SolidPaint;
        const color = solidFill.color;
        const hexColor = rgbToHex(color.r, color.g, color.b);

        // Update both color pickers to reflect the node's fill color
        figma.ui.postMessage({
          type: "update-intensityColor-ui",
          color: hexColor,
        });
        figma.ui.postMessage({
          type: "update-spreadColor-ui",
          color: hexColor,
        });

        // Update the global color variables
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
        }; // Assuming the same color for both initially
      }
    }
  }
}

figma.on("run", () => {
  reselectCurrentNode();
  updateUIColorFromSelection();
  updatePluginUIFromSelectedNode();
});

figma.on("selectionchange", () => {
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length === 0 || !isNodeType(selectedNodes[0])) {
    figma.ui.postMessage({ type: "reset-opacity-ui" });
    const node = selectedNodes[0];
    const group = findNeonizeGroupForNode(node);

    if (group) {
      const opacityValue = group.getPluginData("opacityValue");

      if (opacityValue) {
        figma.ui.postMessage({
          type: "update-opacity-ui",
          value: opacityValue,
        });
      } else {
        figma.ui.postMessage({ type: "reset-opacity-ui" });
      }
    } else {
      figma.ui.postMessage({ type: "reset-range-ui" });
    }
  } else {
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

function createIntensityDuplicate(
  node: SceneNode,
  group: GroupNode
): SceneNode | null {
  if (!node.parent) {
    figma.notify(
      "Cannot create spread duplicate: the selected node has no parent."
    );
    return null;
  }
  const intensityDuplicate = node.clone();
  intensityDuplicate.name = "Intensity";
  intensityDuplicate.x = node.x;
  intensityDuplicate.y = node.y;
  if (group) {
    group.appendChild(intensityDuplicate);
  }

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

  const spreadDuplicate = node.clone();
  spreadDuplicate.name = "Spread";
  spreadDuplicate.x = node.x;
  spreadDuplicate.y = node.y;

  if (group) {
    group.appendChild(spreadDuplicate);
  }

  return spreadDuplicate;
}
let intensityColor: RGBA = { r: 1, g: 1, b: 1, a: 1 };
let hasChanged = false;

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
  node.setPluginData("intensityValue", rawIntensityValue.toString()); // Save the raw slider value
}

let spreadColor: RGBA = { r: 1, g: 1, b: 1, a: 1 };

// limit
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

figma.on("selectionchange", () => {
  updateUIColorFromSelection();
  updatePluginUIFromSelectedNode();

  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length === 0 || !isNodeType(selectedNodes[0])) {
    figma.ui.postMessage({ type: "reset-opacity-ui" });
  }
});

function findIntensityDuplicate(node: SceneNode): SceneNode | null {
  let group = findNeonizeGroupForNode(node);

  if (group) {
    return group.findOne((n) => n.name === "Intensity") as SceneNode | null;
  }

  return null;
}
function findSpreadDuplicate(node: SceneNode): SceneNode | null {
  let group = findNeonizeGroupForNode(node);

  if (group) {
    return group.findOne((n) => n.name === "Spread") as SceneNode | null;
  }

  return null;
}

function reorderNodesInGroup(group: GroupNode): void {
  const originalNode = group.findOne(
    (n) => n.getPluginData("isNeonized") === "true"
  );
  const intensityNode = group.findOne((n) => n.name === "Intensity");
  const spreadNode = group.findOne((n) => n.name === "Spread");

  group.children.forEach((child) => {
    group.appendChild(child);
  });

  if ((originalNode && intensityNode) || (originalNode && spreadNode)) {
    group.insertChild(1, originalNode);
  }
  if (originalNode && intensityNode && spreadNode) {
    group.insertChild(2, originalNode);
    group.insertChild(1, intensityNode);
    group.insertChild(0, spreadNode);
  }
}
function updatePluginUIFromSelectedNode() {
  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length > 0) {
    const node = selectedNodes[0];
    const group = findNeonizeGroupForNode(node);

    if (group) {
      const intensityNode = group.findOne((n) => n.name === "Intensity");
      const spreadNode = group.findOne((n) => n.name === "Spread");

      const intensityValue = intensityNode
        ? parseInt(intensityNode.getPluginData("intensityValue"))
        : 0;
      figma.ui.postMessage({
        type: "update-intensity-ui",
        value: intensityValue,
      });

      const spreadValue = spreadNode
        ? parseInt(spreadNode.getPluginData("spreadValue"))
        : 0;
      figma.ui.postMessage({ type: "update-spread-ui", value: spreadValue });

      const opacityValue = group.getPluginData("opacityValue");

      figma.ui.postMessage({
        type: "update-opacity-ui",
        value: opacityValue,
      });
    }
  }
}

function findIntensityNode(): SceneNode | null {
  const group = findNeonizeGroupForNode(figma.currentPage.selection[0]);
  if (group) {
    return group.findOne((n) => n.name === "Intensity") as SceneNode | null;
  }
  return null;
}

function findSpreadNode(): SceneNode | null {
  const group = findNeonizeGroupForNode(figma.currentPage.selection[0]);
  if (group) {
    return group.findOne((n) => n.name === "Spread") as SceneNode | null;
  }
  return null;
}

async function getUsageCount(): Promise<number> {
  try {
    const usageCount = await figma.clientStorage.getAsync("usageCount");
    return usageCount ?? 0;
  } catch (error) {
    console.error("Error getting usage count:", error);
    return 0;
  }
}

async function setUsageCount(count: number): Promise<void> {
  try {
    await figma.clientStorage.setAsync("usageCount", count);
  } catch (error) {
    console.error("Error setting usage count:", error);
  }
}

figma.ui.onmessage = async (msg) => {
  const selectedNodes = figma.currentPage.selection;
  const MAX_FREE_USAGE = 40;
  let usageCount = await getUsageCount();

  switch (msg.type) {
    case "open-paypal-url":
      if (msg.url) {
        figma.showUI(`<script>window.location.href="${msg.url}";</script>`, {
          visible: false,
        });
      }
      break;
    case "decrement-credit":
      // Increment the usage count each time a credit is used
      usageCount += 1;
      await setUsageCount(usageCount); // Update the stored usage count

      // Check if the user has exceeded their 40 free credits
      if (usageCount >= 40) {
        // User has used their 40 free credits; initiate checkout flow
        figma.notify(
          "Free credits used up. Please upgrade for unlimited access."
        );
        // Here, you could also trigger the UI to display the upgrade button or directly initiate the checkout process
        figma.ui.postMessage({ type: "initiate-checkout" });
      } else {
        // Update the UI with the remaining credits
        const creditsLeft = 40 - usageCount;
        figma.ui.postMessage({
          type: "update-credits",
          creditsLeft: creditsLeft,
        });
      }
      break;
    case "initiate-checkout":
      // Check if the Payments API is available
      if (figma.payments) {
        // Logic to initiate the checkout flow
        try {
          await figma.payments.initiateCheckoutAsync({
            // Your checkout details here, such as productID or other relevant information
          });
          // Handle post-checkout logic, perhaps checking the payment status again
        } catch (error) {
          console.error("Checkout initiation failed:", error);
          // Handle errors, such as by notifying the user or logging the issue
        }
      } else {
        console.error("Payments API is not available.");
        // Optionally, notify the user that the checkout process cannot be initiated
        figma.notify("Unable to initiate checkout. Please try again later.");
      }
      break;

    case "intensityColor-change":
      intensityColor = hexToRgb(msg.color);

      const intensityNode = findIntensityNode();
      if (intensityNode) {
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
      const sizeNode = findSpreadNode();
      if (sizeNode) {
        applySpreadEffects(
          sizeNode,
          parseInt(sizeNode.getPluginData("spreadValue")),
          spreadColor
        );
      }
      break;
    case "ui-ready":
      const creditsLeft = MAX_FREE_USAGE - usageCount;
      figma.ui.postMessage({
        type: "update-credits",
        creditsLeft: creditsLeft,
      });
      updateUIColorFromSelection();
      break;
    case "intensity-change":
      const intensityValue = parseInt(msg.value);
      let selectedNode = selectedNodes[0];

      if (
        selectedNode.type === "GROUP" &&
        selectedNode.name === "Neonize Group"
      ) {
        const intensityNodeInGroup = findIntensityNode();

        if (intensityNodeInGroup) {
          figma.currentPage.selection = [intensityNodeInGroup];
          selectedNode = intensityNodeInGroup;
        }
      }

      if (selectedNode && isNodeType(selectedNode)) {
        let group = findNeonizeGroupForNode(selectedNodes[0]);

        if (
          !group &&
          selectedNodes.length > 0 &&
          isNodeType(selectedNodes[0])
        ) {
          group = createNeonizeGroupWithDuplicates(selectedNodes[0]);
        }
        let intensityNode = findIntensityDuplicate(selectedNode);
        if (!intensityNode && group) {
          intensityNode = createIntensityDuplicate(selectedNode, group);
        }

        if (intensityNode) {
          applyIntensityEffects(
            intensityNode,
            intensityValue / 100,
            intensityColor,
            intensityValue
          );
          if (group) {
            reorderNodesInGroup(group);
          }
        }
      }
      break;
    case "spread-change":
      const spreadValue = parseInt(msg.value);
      let group = findNeonizeGroupForNode(selectedNodes[0]);

      if (!group && selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
        group = createNeonizeGroupWithDuplicates(selectedNodes[0]);
      }

      let spreadNode = findSpreadDuplicate(selectedNodes[0]);
      if (!spreadNode && group) {
        spreadNode = createSpreadDuplicate(selectedNodes[0], group);
      }

      if (spreadNode) {
        applySpreadEffects(spreadNode, spreadValue, spreadColor);
        if (group) {
          reorderNodesInGroup(group);
        }
      }
      break;
    case "opacity-change":
      const opacityValue = msg.value / 100;
      let targetSpreadNode = findSpreadNode();
      let targetGroup = findNeonizeGroupForNode(figma.currentPage.selection[0]);

      if (targetGroup) {
        targetGroup.setPluginData("opacityValue", msg.value.toString());
      }

      if (targetSpreadNode && "effects" in targetSpreadNode) {
        const newEffects = targetSpreadNode.effects.map((effect) => {
          if (effect.type === "DROP_SHADOW") {
            const newEffect: DropShadowEffect = {
              ...effect,
              color: { ...effect.color, a: opacityValue },
            };

            return newEffect;
          }
          return effect;
        });
        targetSpreadNode.effects = newEffects;
      }
      break;
  }
};
