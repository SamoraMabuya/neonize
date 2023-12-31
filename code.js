"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__);
figma.ui.resize(400, 100);
const PLUGIN_GROUP_NAME = "Neonize";
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
    const spreadMultiplier = value * 0.6;
    // Adjust these properties to match the desired effects based on your Figma file
    for (let i = 0; i < 5; i++) {
        effects.push({
            type: "DROP_SHADOW",
            color: currentColor,
            offset: { x: 0, y: 0 },
            radius: baseMultiplier + i * 10, // Example: incrementing radius
            spread: spreadMultiplier + i * 2, // Example: incrementing spread
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
    "GROUP",
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
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    switch (msg.type) {
        case "color-change":
            currentColor = hexToRgb(msg.color);
            updateDropShadowColor();
            break;
        case "save-color-value":
            yield figma.clientStorage.setAsync("savedColorValue", msg.color);
            break;
        case "get-saved-color-value":
            const savedColor = (yield figma.clientStorage.getAsync("savedColorValue")) || "#ffffff";
            figma.ui.postMessage({ type: "update-color-ui", color: savedColor });
            currentColor = hexToRgb(savedColor);
            updateDropShadowColor();
            break;
        case "save-range-value":
            yield figma.clientStorage.setAsync("savedRangeValue", msg.value);
            break;
        case "get-saved-range-value":
            const savedValue = (yield figma.clientStorage.getAsync("savedRangeValue")) || 0;
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
});
function updateDropShadowColor() {
    figma.currentPage.selection.forEach((selectedNode) => {
        if (isNodeType(selectedNode)) {
            updateNodeDropShadow(selectedNode);
        }
    });
}
