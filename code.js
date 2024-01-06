"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 220);
function createNeonizeGroupWithDuplicates(node) {
    if (!node.parent) {
        figma.notify("Cannot group nodes: the selected node has no parent.");
        return null;
    }
    // Rename the original node
    node.name = "Original";
    // Create a group with the original node
    const group = figma.group([node], node.parent);
    group.name = "Neonize Group";
    node.setPluginData("isNeonized", "true");
    return group;
}
function applyLayerBlurToGroup(group, blurValue) {
    group.children.forEach((child) => {
        // Apply blur only to duplicates, not the original node
        // Check if the child is of a type that can have effects
        if ("effects" in child && child.getPluginData("isNeonized") !== "true") {
            const blurEffect = {
                type: "LAYER_BLUR",
                radius: blurValue * 10,
                visible: true,
            };
            child.effects = [blurEffect];
        }
    });
}
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
    // Calculate the radius from the slider value
    const radius = value * 0.2;
    // Create an array to store the drop shadow effects
    const effects = [];
    // Check if the first drop shadow's radius is 0, then reset all to 0
    const finalRadius = radius <= 0 ? 0 : radius;
    // Create 5 drop shadow effects with the same or reset radius
    for (let i = 0; i < 5; i++) {
        effects.push({
            type: "DROP_SHADOW",
            color: currentColor,
            offset: { x: 0, y: 0 },
            radius: finalRadius,
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
function applyEffectsToNode(node, effects, rangeValue) {
    if (node) {
        node.effects = effects;
        node.setPluginData("enhanced", "true");
        node.setPluginData("rangeValue", rangeValue.toString());
    }
}
function updateNodeDropShadow(node, effectType, color) {
    if ("effects" in node) {
        // Apply the provided color to drop shadow effects
        let effects = node.effects.map((effect) => effect.type === "DROP_SHADOW" ? Object.assign(Object.assign({}, effect), { color: color }) : effect);
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
            updateUIColorFromSelection();
        }, 150);
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
    updateUIColorFromSelection();
    updatePluginUIFromSelectedNode();
});
figma.on("selectionchange", () => {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
        const node = selectedNodes[0];
        // Check if the node has been enhanced by the plugin
        const enhanced = node.getPluginData("enhanced");
        if (enhanced === "true") {
            // If enhanced, get the stored range value
            const rangeValue = node.getPluginData("rangeValue");
            // Update UI with the stored range value
            figma.ui.postMessage({ type: "update-range-ui", value: rangeValue });
        }
        else {
            // If not enhanced, reset the slider to 0
            figma.ui.postMessage({ type: "reset-range-ui" });
        }
    }
    else {
        // No valid node selected, reset the slider to 0
        figma.ui.postMessage({ type: "reset-range-ui" });
    }
});
function findNeonizeGroupForNode(node) {
    let currentNode = node;
    while (currentNode) {
        if (currentNode.type === "GROUP" && currentNode.name === "Neonize Group") {
            return currentNode;
        }
        currentNode = currentNode.parent;
    }
    return null;
}
function findGroupWithOriginalNode(node) {
    let currentNode = node;
    while (currentNode) {
        if (currentNode.getPluginData("isNeonized") === "true" &&
            currentNode.type === "GROUP") {
            return currentNode;
        }
        currentNode = currentNode.parent;
    }
    return null;
}
// Updated to check all parent nodes for an existing "Neonize Group"
// selectionchange listener
function createIntensityDuplicate(node, group) {
    const intensityDuplicate = node.clone();
    intensityDuplicate.name = "Intensity";
    intensityDuplicate.x = node.x;
    intensityDuplicate.y = node.y;
    group.appendChild(intensityDuplicate);
    return intensityDuplicate;
}
function createSpreadDuplicate(node, group) {
    if (!node.parent) {
        figma.notify("Cannot create spread duplicate: the selected node has no parent.");
        return null;
    }
    // Clone the original node and name it "Spread"
    const spreadDuplicate = node.clone();
    spreadDuplicate.name = "Spread";
    spreadDuplicate.x = node.x;
    spreadDuplicate.y = node.y;
    // If a group already exists, add the spread duplicate to it
    if (group) {
        group.appendChild(spreadDuplicate);
    }
    return spreadDuplicate;
}
let intensityColor = { r: 1, g: 1, b: 1, a: 1 };
function applyIntensityEffects(node, opacity, color) {
    if ("effects" in node) {
        const effects = [];
        for (let i = 0; i < 10; i++) {
            effects.push({
                type: "DROP_SHADOW",
                color: Object.assign(Object.assign({}, color), { a: opacity }),
                offset: { x: 0, y: 0 },
                radius: 8.5,
                spread: 0,
                visible: true,
                blendMode: "NORMAL",
                showShadowBehindNode: false,
            });
        }
        node.effects = effects;
    }
    node.setPluginData("intensityValue", opacity.toString());
}
let spreadColor = { r: 1, g: 1, b: 1, a: 1 };
function applySpreadEffects(node, value, color) {
    if ("effects" in node) {
        const effects = [];
        for (let i = 0; i < 10; i++) {
            effects.push({
                type: "DROP_SHADOW",
                color: Object.assign(Object.assign({}, color), { a: 1 }),
                offset: { x: 0, y: 0 },
                radius: value * 2,
                spread: 0,
                visible: true,
                blendMode: "NORMAL",
                showShadowBehindNode: false,
            });
        }
        node.effects = effects;
    }
    node.setPluginData("spreadValue", value.toString());
}
function applyLayerBlurs(node, blurValue) {
    if ("effects" in node) {
        const effects = [];
        for (let i = 0; i < 10; i++) {
            effects.push({
                type: "LAYER_BLUR",
                radius: blurValue,
                visible: true,
            });
        }
        node.effects = effects;
    }
}
function findIntensityDuplicate(node) {
    // Find the intensity duplicate in the group
    let group = findNeonizeGroupForNode(node);
    return group ? group.findOne((n) => n.name === "Intensity") : null;
}
figma.on("selectionchange", () => {
    updateUIColorFromSelection();
    updatePluginUIFromSelectedNode();
});
function findSpreadDuplicate(node) {
    // Find the Neonize Group containing the original node
    let group = findNeonizeGroupForNode(node);
    // Search for the "Spread" clone within the group
    if (group) {
        return group.findOne((n) => n.name === "Spread");
    }
    return null;
}
function reorderNodesInGroup(group) {
    const originalNode = group.findOne((n) => n.getPluginData("isNeonized") === "true");
    const intensityNode = group.findOne((n) => n.name === "Intensity");
    const spreadNode = group.findOne((n) => n.name === "Spread");
    // Remove all nodes from the group
    group.children.forEach((child) => {
        group.appendChild(child);
    });
    // Add nodes back in the desired order
    if ((originalNode && intensityNode) || (originalNode && spreadNode)) {
        group.insertChild(1, originalNode);
    }
    if (originalNode && intensityNode && spreadNode) {
        group.insertChild(2, originalNode);
        group.insertChild(1, intensityNode);
        group.insertChild(0, spreadNode);
    }
}
function updatePluginUIFromSelectedNode() {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0) {
        const node = selectedNodes[0];
        const group = findNeonizeGroupForNode(node);
        if (group) {
            const intensityNode = group.findOne((n) => n.name === "Intensity");
            const spreadNode = group.findOne((n) => n.name === "Spread");
            const intensityValue = intensityNode
                ? parseFloat(intensityNode.getPluginData("intensityValue"))
                : 0;
            const spreadValue = spreadNode
                ? parseInt(spreadNode.getPluginData("spreadValue"))
                : 0;
            // Post message to UI to update sliders
            figma.ui.postMessage({
                type: "update-intensity-ui",
                value: intensityValue,
            });
            figma.ui.postMessage({ type: "update-spread-ui", value: spreadValue });
        }
    }
}
function findIntensityNode() {
    const group = findNeonizeGroupForNode(figma.currentPage.selection[0]);
    if (group) {
        return group.findOne((n) => n.name === "Intensity");
    }
    return null;
}
function findSpreadNode() {
    const group = findNeonizeGroupForNode(figma.currentPage.selection[0]);
    if (group) {
        return group.findOne((n) => n.name === "Spread");
    }
    return null;
}
figma.ui.onmessage = async (msg) => {
    const selectedNodes = figma.currentPage.selection;
    switch (msg.type) {
        case "intensityColor-change":
            intensityColor = hexToRgb(msg.color);
            const intensityNode = findIntensityNode();
            if (intensityNode) {
                applyIntensityEffects(intensityNode, parseFloat(intensityNode.getPluginData("intensityValue")) / 100, intensityColor);
            }
            break;
        case "spreadColor-change":
            spreadColor = hexToRgb(msg.color);
            const sizeNode = findSpreadNode();
            if (sizeNode) {
                applySpreadEffects(sizeNode, parseInt(sizeNode.getPluginData("spreadValue")), spreadColor);
            }
            break;
        case "ui-ready":
            // Called when the UI is ready; initialize with the selected node color
            updateUIColorFromSelection();
            break;
        case "save-color-value":
            await figma.clientStorage.setAsync("savedColorValue", msg.color);
            break;
        case "get-saved-color-value":
            const savedColor = (await figma.clientStorage.getAsync("savedColorValue")) || "#ffffff";
            figma.ui.postMessage({ type: "update-color-ui", color: savedColor });
            currentColor = hexToRgb(savedColor);
            break;
        case "save-range-value":
            await figma.clientStorage.setAsync("savedRangeValue", msg.value);
            break;
        case "get-saved-range-value":
            const savedValue = (await figma.clientStorage.getAsync("savedRangeValue")) || 0;
            figma.ui.postMessage({ type: "update-range-ui", value: savedValue });
            break;
        case "value-change":
            const intensityValue = parseFloat(msg.value) / 100;
            let selectedNode = selectedNodes[0];
            // If the entire group is selected, find the original node within the group
            if (selectedNode.type === "GROUP" &&
                selectedNode.name === "Neonize Group") {
                const originalNode = selectedNode.findOne((n) => n.getPluginData("isNeonized") === "true");
                if (originalNode) {
                    selectedNode = originalNode;
                }
            }
            if (selectedNode && isNodeType(selectedNode)) {
                let group = findNeonizeGroupForNode(selectedNode);
                // Create group with duplicates if it doesn't exist
                if (!group) {
                    group = createNeonizeGroupWithDuplicates(selectedNode);
                }
                // Find or create intensity node
                let intensityNode = findIntensityDuplicate(selectedNode);
                if (!intensityNode && group) {
                    intensityNode = createIntensityDuplicate(selectedNode, group);
                }
                // Apply intensity effects
                if (intensityNode) {
                    applyIntensityEffects(intensityNode, intensityValue, intensityColor); // Assuming intensityColor is defined elsewhere
                    if (group) {
                        reorderNodesInGroup(group);
                    }
                }
            }
            break;
        case "size-change":
            const spreadValue = parseInt(msg.value);
            let group = findNeonizeGroupForNode(selectedNodes[0]);
            // Create group with duplicates if it doesn't exist
            if (!group && selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
                group = createNeonizeGroupWithDuplicates(selectedNodes[0]);
            }
            // Find existing spread node or create one if it doesn't exist
            let spreadNode = findSpreadDuplicate(selectedNodes[0]);
            if (!spreadNode && group) {
                spreadNode = createSpreadDuplicate(selectedNodes[0], group);
            }
            // Apply spread effects
            if (spreadNode) {
                applySpreadEffects(spreadNode, spreadValue, spreadColor);
                if (group) {
                    reorderNodesInGroup(group);
                }
            }
            break;
    }
};
