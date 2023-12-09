"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 400);
const defaultDropShadowEffect = (radiusMultiplier, spread) => ({
    type: "DROP_SHADOW",
    color: { r: 1, g: 1, b: 1, a: 1 }, // Reusable color object
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
figma.ui.onmessage = (messages) => {
    const { value } = messages;
    const { baseGlow, spreadGlow, fairBlur, intenseBlur } = ApplyShapeGlow(value);
    const ERROR_MESSAGE = "Please use ellipses, rectangles, polygons, or text";
    const ERROR_OPTIONS = {
        timeout: 400,
        error: true,
        button: { text: "Dismiss", action: () => true },
    };
    const isNodeType = (node) => {
        return (node.type === "RECTANGLE" ||
            node.type === "ELLIPSE" ||
            node.type === "POLYGON" ||
            node.type === "TEXT");
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
    for (const node of figma.currentPage.selection) {
        const shapeType = isValidShapeType(node.type);
        switch (node.type) {
            case shapeType:
                applyEffectsToNode(node, [baseGlow, spreadGlow]);
                break;
            case "TEXT":
                if (!cloneNode) {
                    cloneNode = cloneAndApplyEffects(node, fairBlur);
                    cloneNode2 = cloneAndApplyEffects(node, fairBlur);
                    cloneNode3 = cloneAndApplyEffects(node, fairBlur);
                    cloneNode4 = cloneAndApplyEffects(node, fairBlur);
                    // Grouping and positioning clones
                    const clones = [node, cloneNode, cloneNode2, cloneNode3, cloneNode4];
                    const group = figma.group(clones, figma.currentPage);
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
                else {
                    applyEffectsToNode(cloneNode, [intenseBlur]);
                    applyEffectsToNode(cloneNode2, [intenseBlur]);
                    applyEffectsToNode(cloneNode3, [fairBlur]);
                    applyEffectsToNode(cloneNode4, [fairBlur]);
                }
                break;
            default:
                figma.notify(ERROR_MESSAGE, ERROR_OPTIONS);
        }
    }
};
