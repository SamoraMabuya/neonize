figma.showUI(__html__);
figma.ui.resize(400, 400);

function ApplyShapeGlow(value: number) {
  const baseGlow: DropShadowEffect = {
    type: "DROP_SHADOW",
    color: { r: 1, g: 1, b: 1, a: 1 },
    offset: {
      x: 0,
      y: 0,
    },
    radius: value * 0.2,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: false,
  };

  const spreadGlow: DropShadowEffect = {
    type: "DROP_SHADOW",
    color: { r: 1, g: 1, b: 1, a: 1 },
    offset: {
      x: 0,
      y: 0,
    },
    radius: value * 0.8,
    spread: 11,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: false,
  };
  const primaryTextGlow: BlurEffect = {
    type: "LAYER_BLUR",
    radius: value * 1.8,
    visible: true,
  };
  const secondaryTextGlow: DropShadowEffect = {
    type: "DROP_SHADOW",
    color: { r: 1, g: 1, b: 1, a: 1 },
    offset: {
      x: 0,
      y: 0,
    },
    radius: value * 0.8,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: false,
  };

  return {
    baseGlow,
    spreadGlow,
    primaryTextGlow,
    secondaryTextGlow,
  };
}

const shapeValues = ["RECTANGLE", "ELLIPSE", "POLYGON"];

type NodeTypes = "RECTANGLE" | "ELLIPSE" | "POLYGON";

let cloneNode: BaseNode | null;
let secondCloneNode: BaseNode;
let thirdCloneNode: BaseNode;

const isValidShapeType = (nodeType: string): NodeTypes | null => {
  if (shapeValues.includes(nodeType)) {
    return nodeType as NodeTypes;
  }
  return null;
};

figma.ui.onmessage = (messages) => {
  const { value } = messages;
  const { baseGlow, spreadGlow, primaryTextGlow, secondaryTextGlow } =
    ApplyShapeGlow(value);

  const ERROR_MESSAGE = "Please use ellipses, rectangles, polygons, or text";
  const ERROR_OPTIONS: NotificationOptions = {
    timeout: 400,
    error: true,
    button: {
      text: "Dismiss",
      action: () => true,
    },
  };

  // Check if cloneNode is not null before cloning again
  if (!cloneNode) {
    let validNodeFound = false; // Flag to check if a valid node is found
    for (const node of figma.currentPage.selection) {
      const shapeType = isValidShapeType(node.type);
      if (node.type === shapeType) {
        node.effects = [baseGlow, spreadGlow];
        validNodeFound = true;
      }
      if (node.type === "TEXT") {
        cloneNode = node.clone();
        cloneNode.name = "Base Node";
        secondCloneNode = node.clone();
        secondCloneNode.name = "Intense Edge";
        figma.currentPage.appendChild(cloneNode);
        figma.currentPage.appendChild(secondCloneNode);
        const group = figma.group(
          [node, cloneNode, secondCloneNode],
          figma.currentPage
        );
        const position = [node.x, node.y];

        group.name = "My Plugin";
        node.effects = [primaryTextGlow];
        cloneNode.effects = [secondaryTextGlow];
        [cloneNode.x, cloneNode.y] = position;
        [secondCloneNode.x, secondCloneNode.y] = position;
        validNodeFound = true;
      }
    }

    // Check if a valid node is not found and show the error notification
    if (!validNodeFound) {
      figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
    }
  }
};
