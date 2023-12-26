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
const defaultDropShadowEffect = (radiusMultiplier, spread) => ({
    type: "DROP_SHADOW",
    color: currentColor,
    offset: { x: 0, y: 0 },
    radius: radiusMultiplier,
    spread: spread,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: false,
});
function applyGlow(value) {
    const baseMultiplier = value * 0.2;
    const spreadMultiplier = value * 0.6;
    return {
        baseGlow: defaultDropShadowEffect(baseMultiplier, 0),
        spreadGlow: defaultDropShadowEffect(spreadMultiplier, 4),
        intenseBlur: defaultDropShadowEffect(baseMultiplier, 0),
        fairBlur: defaultDropShadowEffect(spreadMultiplier, 0),
    };
}
const isValidShapeType = (nodeType) => ["RECTANGLE", "ELLIPSE", "POLYGON", "LINE", "STAR", "VECTOR"].includes(nodeType);
const isNodeType = (node) => {
    return (isValidShapeType(node.type) ||
        node.type === "TEXT" ||
        (node.type === "GROUP" && node.name === PLUGIN_GROUP_NAME));
};
const applyEffectsToNode = (node, effects) => {
    if (!node)
        return;
    node.effects = effects;
};
function cloneAndApplyEffects(node, effect, cloneCount) {
    let clones = [];
    for (let i = 0; i < cloneCount; i++) {
        const clone = node.clone();
        if (isNodeType(clone)) {
            applyEffectsToNode(clone, [effect]);
            clones.push(clone);
        }
    }
    return clones;
}
function updateDropShadowColor() {
    figma.currentPage.selection.forEach((selectedNode) => {
        if (isNodeType(selectedNode) && selectedNode.type === "GROUP") {
            selectedNode.children.forEach((child) => {
                if (isNodeType(child)) {
                    updateNodeDropShadow(child);
                }
            });
        }
        else {
            updateNodeDropShadow(selectedNode);
        }
    });
}
function updateNodeDropShadow(node) {
    if ("effects" in node) {
        let effects = node.effects.map((effect) => effect.type === "DROP_SHADOW"
            ? Object.assign(Object.assign({}, effect), { color: currentColor }) : effect);
        node.effects = effects;
    }
}
function applyEffectsToGroupChildren(group, glowEffects) {
    group.children.forEach((child, index) => {
        if (!isNodeType(child))
            return;
        if (child.name === "original") {
            child.effects = []; // Remove effects from the original node
        }
        else {
            let effect;
            if (child.type === "TEXT") {
                effect = index < 2 ? glowEffects.fairBlur : glowEffects.intenseBlur;
            }
            else {
                effect = glowEffects.baseGlow; // Apply baseGlow to both Clone 1 and Clone 2
            }
            applyEffectsToNode(child, [effect]);
        }
    });
}
function createAndApplyEffectsToClones(node, glowEffects) {
    const cloneNodes = cloneAndApplyEffects(node, glowEffects.baseGlow, 4);
    if (cloneNodes.length !== 4)
        return;
    node.name = "original";
    const group = figma.group([...cloneNodes, node], figma.currentPage);
    group.name = PLUGIN_GROUP_NAME;
    // Set positions and names for clones before reversing
    cloneNodes.forEach((clone, index) => {
        clone.name = `clone${index + 1}`;
        clone.x = node.x;
        clone.y = node.y;
    });
    // Apply effects to clones
    cloneNodes.forEach((clone, index) => {
        let effect;
        if (node.type === "TEXT") {
            effect = index < 2 ? glowEffects.fairBlur : glowEffects.intenseBlur;
        }
        else {
            effect = index < 2 ? glowEffects.baseGlow : glowEffects.spreadGlow;
        }
        applyEffectsToNode(clone, [effect]);
    });
    reverseChildrenOrder(group);
    if (node.type === "TEXT") {
        node.strokes = [
            {
                type: "SOLID",
                color: { r: 1, g: 1, b: 1 },
                visible: true,
                opacity: 1,
                blendMode: "NORMAL",
            },
        ];
    }
    node.setPluginData("hasClones", "true");
}
function reverseChildrenOrder(group) {
    for (let i = group.children.length - 1; i >= 0; i--) {
        const child = group.children[i];
        group.appendChild(child);
    }
}
const ERROR_MESSAGE = "Please use shapes or text";
const ERROR_OPTIONS = {
    timeout: 400,
    error: true,
    button: {
        text: "Dismiss",
        action: () => { }, // Empty function, the notification will close on click
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
            const glowEffects = applyGlow(msg.value);
            if (!figma.currentPage.selection.every(isNodeType)) {
                figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
                return;
            }
            figma.currentPage.selection.forEach((node) => {
                if (isNodeType(node)) {
                    let targetGroup = null;
                    if (node.type === "GROUP" && node.name === PLUGIN_GROUP_NAME) {
                        targetGroup = node;
                    }
                    else if (node.parent &&
                        node.parent.type === "GROUP" &&
                        node.parent.name === PLUGIN_GROUP_NAME) {
                        targetGroup = node.parent;
                    }
                    if (targetGroup) {
                        applyEffectsToGroupChildren(targetGroup, glowEffects);
                    }
                    else if (node.getPluginData("hasClones") !== "true") {
                        createAndApplyEffectsToClones(node, glowEffects);
                    }
                }
            });
            break;
    }
});
