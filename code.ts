"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 100);

const PLUGIN_GROUP_NAME = "PluginTextGlowGroup";

function hexToRgb(hex: string): RGBA {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
        a: 1, // Assuming full opacity
      }
    : { r: 1, g: 1, b: 1, a: 1 }; // Default to white if conversion fails
}
let currentColor: RGBA = { r: 1, g: 1, b: 1, a: 1 }; // Default color: white

const defaultDropShadowEffect = (
  radiusMultiplier: number,
  spread: number
): DropShadowEffect => ({
  type: "DROP_SHADOW",
  color: currentColor,
  offset: { x: 0, y: 0 },
  radius: radiusMultiplier,
  spread: spread,
  visible: true,
  blendMode: "NORMAL",
  showShadowBehindNode: false,
});

function ApplyShapeGlow(value: number) {
  const baseMultiplier = value * 0.2;
  const spreadMultiplier = value * 0.8;

  return {
    baseGlow: defaultDropShadowEffect(baseMultiplier, 0),
    spreadGlow: defaultDropShadowEffect(spreadMultiplier, 11),
    fairBlur: defaultDropShadowEffect(spreadMultiplier, 0),
    intenseBlur: defaultDropShadowEffect(baseMultiplier, 0),
  };
}

const shapeValues = ["RECTANGLE", "ELLIPSE", "POLYGON"];
type NodeTypes = "RECTANGLE" | "ELLIPSE" | "POLYGON";

let cloneNode: TextNode;
let cloneNode2: TextNode;
let cloneNode3: TextNode;
let cloneNode4: TextNode;

const isValidShapeType = (nodeType: string): nodeType is NodeTypes => {
  return ["RECTANGLE", "ELLIPSE", "POLYGON"].includes(nodeType);
};

type NodeTypeings =
  | RectangleNode
  | EllipseNode
  | PolygonNode
  | TextNode
  | GroupNode;
type Effects = DropShadowEffect | InnerShadowEffect | BlurEffect;

const isNodeType = (node: SceneNode): node is NodeTypeings => {
  return (
    node.type === "RECTANGLE" ||
    node.type === "ELLIPSE" ||
    node.type === "POLYGON" ||
    node.type === "TEXT" ||
    node.type === "LINE" ||
    node.type === "STAR" ||
    (node.type === "GROUP" && node.name === PLUGIN_GROUP_NAME)
  );
};

const applyEffectsToNode = (node: NodeTypeings, effects: Effects[]) => {
  if (!node) return;
  node.effects = effects;
};

function cloneAndApplyEffects(
  node: SceneNode,
  effect: Effects,
  cloneCount: number
): TextNode[] {
  let clones: TextNode[] = [];

  for (let i = 0; i < cloneCount; i++) {
    const clone = node.clone();
    if (isNodeType(clone)) {
      applyEffectsToNode(clone, [effect]);
      clones.push(clone as TextNode);
    }
  }

  return clones;
}

function applyColorToNodeDropShadow(node: NodeTypeings, color: RGBA) {
  if ("effects" in node) {
    node.effects = node.effects.map((effect) => {
      if (effect.type === "DROP_SHADOW") {
        return { ...effect, color: color };
      }
      return effect;
    });
  }
}
function applyCurrentColorToSelectedNodesDropShadows(currentColor: RGBA) {
  figma.currentPage.selection.forEach((selectedNode) => {
    if (
      selectedNode.type === "GROUP" &&
      selectedNode.name === PLUGIN_GROUP_NAME
    ) {
      selectedNode.children.forEach((child) => {
        if (isNodeType(child)) {
          applyColorToNodeDropShadow(child, currentColor);
        }
      });
    } else if (isNodeType(selectedNode)) {
      applyColorToNodeDropShadow(selectedNode, currentColor);
    }
  });
}

const createColorManager = () => {
  let currentColor: RGBA = { r: 1, g: 1, b: 1, a: 1 };

  return {
    getCurrentColor: () => currentColor,
    setCurrentColor: (color: RGBA) => {
      currentColor = color;
      applyCurrentColorToSelectedNodesDropShadows(currentColor);
    },
  };
};

const colorManager = createColorManager();

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "color-change":
        colorManager.setCurrentColor(hexToRgb(msg.color));
        break;

      case "save-color-value":
        await figma.clientStorage.setAsync("savedColorValue", msg.color);
        break;

      case "get-saved-color-value":
        const savedColor =
          (await figma.clientStorage.getAsync("savedColorValue")) || "#ffffff";
        colorManager.setCurrentColor(hexToRgb(savedColor));
        figma.ui.postMessage({ type: "update-color-ui", color: savedColor });
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
        const { baseGlow, spreadGlow, fairBlur, intenseBlur } = ApplyShapeGlow(
          msg.value
        );

        const ERROR_MESSAGE =
          "Please use ellipses, rectangles, polygons, or text";
        const ERROR_OPTIONS = {
          timeout: 400,
          error: true,
          button: { text: "Dismiss", action: () => true },
        };

        for (const node of figma.currentPage.selection) {
          if (isNodeType(node)) {
            if (node.type === "GROUP" && node.name === PLUGIN_GROUP_NAME) {
              node.children.forEach((child) => {
                if (child.type === "TEXT") {
                  applyEffectsToNode(child, [intenseBlur, fairBlur]);
                }
              });
            } else {
              const shapeType = isValidShapeType(node.type);
              if (shapeType) {
                applyEffectsToNode(node, [baseGlow, spreadGlow]);
              } else if (node.type === "TEXT") {
                // Check if the node is part of a plugin-created group or has clones
                const isPartOfPluginGroup =
                  node.parent &&
                  node.parent.type === "GROUP" &&
                  node.parent.name === PLUGIN_GROUP_NAME;
                const hasClones = node.getPluginData("hasClones") === "true";

                if (!isPartOfPluginGroup && !hasClones) {
                  const cloneNodes = cloneAndApplyEffects(node, fairBlur, 4);
                  if (cloneNodes.length === 4) {
                    const group = figma.group(
                      [node, ...cloneNodes],
                      figma.currentPage
                    );
                    group.name = PLUGIN_GROUP_NAME;
                    cloneNodes.forEach((clone, index) => {
                      clone.x = node.x;
                      clone.y = node.y;
                      group.insertChild(index + 1, clone);
                    });

                    node.strokes = [
                      {
                        type: "SOLID",
                        color: { r: 1, g: 1, b: 1 },
                        visible: true,
                        opacity: 1,
                        blendMode: "NORMAL",
                      },
                    ];
                    node.setPluginData("hasClones", "true");
                  }
                } else if (isPartOfPluginGroup) {
                  node.parent.children.forEach((child) => {
                    if (child.type === "TEXT") {
                      applyEffectsToNode(child as TextNode, [
                        intenseBlur,
                        fairBlur,
                      ]);
                    }
                  });
                }
              }
            }
          }
        }
        break;
      default:
        figma.notify("Unrecognized message type received", { timeout: 2000 });
        break;
    }
  } catch (error) {
    console.error("An error occurred: ", error);
    figma.notify("An error occurred. Please try again.", { timeout: 2000 });
  }
};
