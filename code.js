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
    const fairBlur = {
        type: "LAYER_BLUR",
        radius: value * 2,
        visible: true,
    };
    return {
        baseGlow,
        spreadGlow,
        fairBlur,
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
    const { baseGlow, spreadGlow, fairBlur } = ApplyShapeGlow(value);
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
            if (node.type === shapeType) {
                node.effects = [baseGlow, spreadGlow];
            }
            if (node.type === "TEXT") {
                cloneNode = node.clone();
                cloneNode.name = "Clone";
                cloneNode2 = node.clone();
                cloneNode2.name = "Clone2";
                cloneNode3 = node.clone();
                cloneNode3.name = "Clone3";
                cloneNode4 = node.clone();
                cloneNode4.name = "Clone4";
                const group = figma.group([node, cloneNode, cloneNode2, cloneNode3, cloneNode4], figma.currentPage);
                group.appendChild(node);
                group.insertChild(1, cloneNode4);
                group.insertChild(2, cloneNode3);
                group.insertChild(3, cloneNode2);
                group.insertChild(4, cloneNode);
                const position = [node.x, node.y];
                [cloneNode.x, cloneNode.y] = position;
                [cloneNode2.x, cloneNode2.y] = position;
                [cloneNode3.x, cloneNode3.y] = position;
                [cloneNode4.x, cloneNode4.y] = position;
                group.appendChild(cloneNode);
                group.appendChild(cloneNode2);
                group.appendChild(cloneNode3);
                group.appendChild(cloneNode4);
                cloneNode.effects = [fairBlur];
                cloneNode2.effects = [fairBlur];
                cloneNode3.effects = [fairBlur];
                cloneNode4.effects = [fairBlur];
            }
        }
    }
    else {
        cloneNode.effects = [fairBlur];
        cloneNode2.effects = [fairBlur];
        cloneNode3.effects = [fairBlur];
        cloneNode4.effects = [fairBlur];
    }
};
