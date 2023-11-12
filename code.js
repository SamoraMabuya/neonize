"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 400);
const shapeValues = ["RECTANGLE", "ELLIPSE", "POLYGON", "TEXT"];
const isValidShapeType = (nodeType) => {
    if (shapeValues.includes(nodeType)) {
        return nodeType;
    }
    return null;
};
function CreateEffects(value) {
    const baseGlow = {
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
    const spreadGlow = {
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
