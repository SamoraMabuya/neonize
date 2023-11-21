"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 400);
function ApplyShapeGlow(value) {
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
    const textGlow = {
        type: "LAYER_BLUR",
        radius: value * 2.8,
        visible: true,
    };
    return {
        baseGlow,
        spreadGlow,
        textGlow,
    };
}
const shapeValues = ["RECTANGLE", "ELLIPSE", "POLYGON"];
let cloneNode = null; // Move the cloneNode outside the event handler
const isValidShapeType = (nodeType) => {
    if (shapeValues.includes(nodeType)) {
        return nodeType;
    }
    return null;
};
const isValidTextType = (nodeType) => {
    if (nodeType === "TEXT") {
        return nodeType;
    }
    return null;
};
figma.ui.onmessage = (messages) => {
    const { value } = messages;
    const { baseGlow, spreadGlow, textGlow } = ApplyShapeGlow(value);
    const ERROR_MESSAGE = "Please use ellipses, rectangles, polygons, or text";
    const ERROR_OPTIONS = {
        timeout: 400,
        error: true,
        button: {
            text: "Dismiss",
            action: () => true,
        },
    };
    // Check if cloneNode is not null before cloning again
    if (!cloneNode) {
        for (const node of figma.currentPage.selection) {
            const shapeType = isValidShapeType(node.type);
            const textType = isValidTextType(node.type);
            if (node.type === shapeType) {
                node.effects = [baseGlow, spreadGlow];
            }
            if (node.type === "TEXT") {
                cloneNode = node.clone();
                cloneNode.name = "Clone";
                node.name = "Base";
                figma.currentPage.appendChild(cloneNode);
                const group = figma.group([node, cloneNode], figma.currentPage);
                group.name = "Group Node With Effect";
                node.effects = [textGlow];
                cloneNode.x = node.x;
                cloneNode.y = node.y;
            }
        }
    }
    return figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
};
