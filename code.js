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
    return ["RECTANGLE", "ELLIPSE", "POLYGON"].includes(nodeType);
};
const isNodeType = (node) => {
    return (node.type === "RECTANGLE" ||
        node.type === "ELLIPSE" ||
        node.type === "POLYGON" ||
        node.type === "TEXT" ||
        node.type === "LINE" ||
        node.type === "STAR" ||
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
function applyColorToNodeDropShadow(node, color) {
    if ("effects" in node) {
        node.effects = node.effects.map((effect) => {
            if (effect.type === "DROP_SHADOW") {
                return Object.assign(Object.assign({}, effect), { color: color });
            }
            return effect;
        });
    }
}
function applyCurrentColorToSelectedNodesDropShadows(currentColor) {
    figma.currentPage.selection.forEach((selectedNode) => {
        if (selectedNode.type === "GROUP" &&
            selectedNode.name === PLUGIN_GROUP_NAME) {
            selectedNode.children.forEach((child) => {
                if (isNodeType(child)) {
                    applyColorToNodeDropShadow(child, currentColor);
                }
            });
        }
        else if (isNodeType(selectedNode)) {
            applyColorToNodeDropShadow(selectedNode, currentColor);
        }
    });
}
const createColorManager = () => {
    let currentColor = { r: 1, g: 1, b: 1, a: 1 };
    return {
        getCurrentColor: () => currentColor,
        setCurrentColor: (color) => {
            currentColor = color;
            applyCurrentColorToSelectedNodesDropShadows(currentColor);
        },
    };
};
const colorManager = createColorManager();
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        switch (msg.type) {
            case "color-change":
                colorManager.setCurrentColor(hexToRgb(msg.color));
                break;
            case "save-color-value":
                yield figma.clientStorage.setAsync("savedColorValue", msg.color);
                break;
            case "get-saved-color-value":
                const savedColor = (yield figma.clientStorage.getAsync("savedColorValue")) || "#ffffff";
                colorManager.setCurrentColor(hexToRgb(savedColor));
                figma.ui.postMessage({ type: "update-color-ui", color: savedColor });
                break;
            case "save-range-value":
                yield figma.clientStorage.setAsync("savedRangeValue", msg.value);
                break;
            case "get-saved-range-value":
                const savedValue = (yield figma.clientStorage.getAsync("savedRangeValue")) || 0;
                figma.ui.postMessage({ type: "update-range-ui", value: savedValue });
                break;
            case "value-change":
                const { baseGlow, spreadGlow, fairBlur, intenseBlur } = ApplyShapeGlow(msg.value);
                const ERROR_MESSAGE = "Please use ellipses, rectangles, polygons, or text";
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
                        }
                        else {
                            const shapeType = isValidShapeType(node.type);
                            if (shapeType) {
                                applyEffectsToNode(node, [baseGlow, spreadGlow]);
                            }
                            else if (node.type === "TEXT") {
                                // Check if the node is part of a plugin-created group or has clones
                                const isPartOfPluginGroup = node.parent &&
                                    node.parent.type === "GROUP" &&
                                    node.parent.name === PLUGIN_GROUP_NAME;
                                const hasClones = node.getPluginData("hasClones") === "true";
                                if (!isPartOfPluginGroup && !hasClones) {
                                    const cloneNodes = cloneAndApplyEffects(node, fairBlur, 4);
                                    if (cloneNodes.length === 4) {
                                        const group = figma.group([node, ...cloneNodes], figma.currentPage);
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
                                }
                                else if (isPartOfPluginGroup) {
                                    node.parent.children.forEach((child) => {
                                        if (child.type === "TEXT") {
                                            applyEffectsToNode(child, [
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
    }
    catch (error) {
        console.error("An error occurred: ", error);
        figma.notify("An error occurred. Please try again.", { timeout: 2000 });
    }
});
