figma.showUI(__html__);
figma.ui.resize(400, 400);

const shapeValues = ["RECTANGLE", "ELLIPSE", "POLYGON", "TEXT"];

type NodeTypes = "RECTANGLE" | "ELLIPSE" | "POLYGON" | "TEXT";

const isValidShapeType = (nodeType: string): NodeTypes | null => {
  if (shapeValues.includes(nodeType)) {
    return nodeType as NodeTypes;
  }
  return null;
};

function CreateEffects(value: number) {
  const baseGlow: DropShadowEffect = {
    type: "DROP_SHADOW",
    color: { r: 1, g: 1, b: 1, a: 1 },
    offset: {
      x: 0,
      y: 0,
    },
    radius: value * 0.2, // Adjust the value to your desired range
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
    radius: value * 0.8, // Adjust the value to your desired range
    spread: 11,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: false,
  };

  return {
    baseGlow,
    spreadGlow,
  };
}

figma.ui.onmessage = (messages) => {
  const { value } = messages;
  const { baseGlow, spreadGlow } = CreateEffects(value);

  for (const shape of figma.currentPage.selection) {
    const thisType = isValidShapeType(shape.type);
    if (shape.type === thisType) {
      shape.effects = [baseGlow, spreadGlow];
    }
  }
  return null;
};
