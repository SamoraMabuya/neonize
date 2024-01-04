"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 100);
function hexToRgb(hex) {
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
let currentColor = { r: 1, g: 1, b: 1, a: 1 }; // Default color
function createDropShadowEffects(value) {
    const effects = [];
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
const isNodeType = (node) => [
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "LINE",
    "STAR",
    "VECTOR",
    "TEXT",
].includes(node.type);
function applyEffectsToNode(node, effects) {
    if (node) {
        node.effects = effects;
    }
}
function updateNodeDropShadow(node) {
    if ("effects" in node) {
        let effects = node.effects.map((effect) => effect.type === "DROP_SHADOW"
            ? Object.assign(Object.assign({}, effect), { color: currentColor }) : effect);
        node.effects = effects;
    }
}
const ERROR_MESSAGE = "Please use shapes or text";
const ERROR_OPTIONS = {
    timeout: 400,
    error: true,
    button: {
        text: "Dismiss",
        action: () => { },
    },
};
function rgbToHex(r, g, b) {
    const toHex = (c) => Math.round(c * 255)
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
        const fills = shapeNode.fills;
        if (fills.length > 0 && fills[0].type === "SOLID") {
            const solidFill = fills[0];
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
            const savedColor = (await figma.clientStorage.getAsync("savedColorValue")) || "#ffffff";
            figma.ui.postMessage({ type: "update-color-ui", color: savedColor });
            currentColor = hexToRgb(savedColor);
            updateDropShadowColor();
            break;
        case "save-range-value":
            await figma.clientStorage.setAsync("savedRangeValue", msg.value);
            break;
        case "get-saved-range-value":
            const savedValue = (await figma.clientStorage.getAsync("savedRangeValue")) || 0;
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
