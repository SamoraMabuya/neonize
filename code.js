"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 400);
const PLUGIN_GROUP_NAME = "PluginTextGlowGroup";
function hexToRgb(hex) {
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
let currentColor = { r: 1, g: 1, b: 1, a: 1 }; // Default color: white
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
function ApplyShapeGlow(value) {
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
let cloneNode;
let cloneNode2;
let cloneNode3;
let cloneNode4;
const isValidShapeType = (nodeType) => {
    if (shapeValues.includes(nodeType)) {
        return nodeType;
    }
    return null;
};
const isNodeType = (node) => {
    return (node.type === "RECTANGLE" ||
        node.type === "ELLIPSE" ||
        node.type === "POLYGON" ||
        node.type === "TEXT" ||
        (node.type === "GROUP" && node.name === PLUGIN_GROUP_NAME));
};
const applyEffectsToNode = (node, effects) => {
    if (!node)
        return;
    node.effects = effects;
};
const cloneAndApplyEffects = (node, effect) => {
    const clone = node.clone();
    if (isNodeType(clone)) {
        applyEffectsToNode(clone, [effect]);
        return clone;
    }
    return null;
};
function updateDropShadowColor() {
    figma.currentPage.selection.forEach((selectedNode) => {
        if (selectedNode.type === "GROUP" &&
            selectedNode.name === PLUGIN_GROUP_NAME) {
            // Update all children of the group
            selectedNode.children.forEach((child) => updateNodeDropShadow(child));
        }
        else {
            // If an individual node is selected, also update its group siblings
            const parent = selectedNode.parent;
            if (parent &&
                parent.type === "GROUP" &&
                parent.name === PLUGIN_GROUP_NAME) {
                parent.children.forEach((child) => updateNodeDropShadow(child));
            }
            else {
                updateNodeDropShadow(selectedNode);
            }
        }
    });
}
function updateNodeDropShadow(node) {
    if ("effects" in node) {
        // Check if the node supports effects
        let effects = node.effects.map((effect) => {
            if (effect.type === "DROP_SHADOW") {
                return Object.assign(Object.assign({}, effect), { color: currentColor }); // Update color of drop shadow effect
            }
            return effect; // Leave other effects unchanged
        });
        node.effects = effects;
    }
}
figma.ui.onmessage = (messages) => {
    const { value, color } = messages;
    if (messages.type === "color-change") {
        currentColor = hexToRgb(messages.color);
        updateDropShadowColor();
    }
    if (messages.type === "value-change") {
        const { baseGlow, spreadGlow, fairBlur, intenseBlur } = ApplyShapeGlow(value);
        const ERROR_MESSAGE = "Please use ellipses, rectangles, polygons, or text";
        const ERROR_OPTIONS = {
            timeout: 400,
            error: true,
            button: { text: "Dismiss", action: () => true },
        };
        for (const node of figma.currentPage.selection) {
            if (node.type === "GROUP" && node.name === PLUGIN_GROUP_NAME) {
                node.children.forEach((child) => {
                    if (child.type === "TEXT") {
                        applyEffectsToNode(child, [intenseBlur, fairBlur]);
                    }
                });
            }
            else {
                const shapeType = isValidShapeType(node.type);
                switch (node.type) {
                    case shapeType:
                        applyEffectsToNode(node, [baseGlow, spreadGlow]);
                        break;
                    case "TEXT":
                        // Check if the node is part of a plugin-created group
                        const isPartOfPluginGroup = node.parent &&
                            node.parent.type === "GROUP" &&
                            node.parent.name === PLUGIN_GROUP_NAME;
                        if (isPartOfPluginGroup) {
                            // Apply effects to all text nodes within the group
                            node.parent.children.forEach((child) => {
                                if (child.type === "TEXT") {
                                    applyEffectsToNode(child, [
                                        intenseBlur,
                                        fairBlur,
                                    ]);
                                }
                            });
                        }
                        else {
                            const maybeCloneNode = cloneAndApplyEffects(node, fairBlur);
                            const maybeCloneNode2 = cloneAndApplyEffects(node, fairBlur);
                            const maybeCloneNode3 = cloneAndApplyEffects(node, fairBlur);
                            const maybeCloneNode4 = cloneAndApplyEffects(node, fairBlur);
                            if (maybeCloneNode &&
                                maybeCloneNode2 &&
                                maybeCloneNode3 &&
                                maybeCloneNode4) {
                                cloneNode = maybeCloneNode;
                                cloneNode2 = maybeCloneNode2;
                                cloneNode3 = maybeCloneNode3;
                                cloneNode4 = maybeCloneNode4;
                                // Grouping and positioning clones
                                const clones = [
                                    node,
                                    cloneNode,
                                    cloneNode2,
                                    cloneNode3,
                                    cloneNode4,
                                ];
                                const group = figma.group(clones, figma.currentPage);
                                group.name = PLUGIN_GROUP_NAME;
                                clones.forEach((clone, index) => {
                                    clone.x = node.x;
                                    clone.y = node.y;
                                    group.insertChild(index, clone);
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
                            }
                        }
                        break;
                    default:
                        figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
                }
            }
        }
    }
};
