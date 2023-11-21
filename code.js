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
    const primaryTextGlow = {
        type: "LAYER_BLUR",
        radius: value * 2.8,
        visible: true,
    };
    const secondaryTextGlow = {
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
    return {
        baseGlow,
        spreadGlow,
        primaryTextGlow,
        secondaryTextGlow,
    };
}
const shapeValues = ["RECTANGLE", "ELLIPSE", "POLYGON"];
let cloneNode = null;
let secondCloneNode = null;
const isValidShapeType = (nodeType) => {
    if (shapeValues.includes(nodeType)) {
        return nodeType;
    }
    return null;
};
figma.ui.onmessage = (messages) => {
    const { value } = messages;
    const { baseGlow, spreadGlow, primaryTextGlow } = ApplyShapeGlow(value);
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
        let validNodeFound = false; // Flag to check if a valid node is found
        for (const node of figma.currentPage.selection) {
            const shapeType = isValidShapeType(node.type);
            if (node.type === shapeType) {
                node.effects = [baseGlow, spreadGlow];
                validNodeFound = true;
            }
            if (node.type === "TEXT") {
                cloneNode = node.clone();
                cloneNode.name = "Clone";
                secondCloneNode = node.clone();
                secondCloneNode.name = "SecondClone";
                figma.currentPage.appendChild(cloneNode);
                const group = figma.group([node, secondCloneNode, cloneNode], figma.currentPage);
                group.name = "Group Node With Effect";
                node.effects = [primaryTextGlow];
                secondCloneNode.effects = [secondaryTextGlow];
                cloneNode.x = node.x;
                cloneNode.y = node.y;
                secondCloneNode.x = node.x;
                secondCloneNode.y = node.y;
                validNodeFound = true;
            }
        }
        // Check if a valid node is not found and show the error notification
        if (!validNodeFound) {
            figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
        }
    }
};
