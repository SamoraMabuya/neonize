"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 280);
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
const isNodeType = (node) => [
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "LINE",
    "STAR",
    "VECTOR",
    "TEXT",
].includes(node.type);
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
        const node = selectedNodes[0];
        // Check if the node has been neonized
        if (node.getPluginData("neonized") === "true") {
            const dropShadows = node.effects.filter((effect) => effect.type === "DROP_SHADOW");
            if (dropShadows.length > 0) {
                const intensityDropShadow = dropShadows[0]; // Assuming the first drop shadow is for intensity
                const spreadDropShadow = dropShadows.length > 1 ? dropShadows[1] : intensityDropShadow; // Assuming the second drop shadow is for spread
                // Extract colors
                intensityColor = intensityDropShadow.color;
                spreadColor = spreadDropShadow.color;
                // Convert RGBA to Hex
                const intensityHex = rgbToHex(intensityColor.r, intensityColor.g, intensityColor.b);
                const spreadHex = rgbToHex(spreadColor.r, spreadColor.g, spreadColor.b);
                // Update UI
                figma.ui.postMessage({
                    type: "update-intensityColor-ui",
                    color: intensityHex,
                });
                figma.ui.postMessage({
                    type: "update-spreadColor-ui",
                    color: spreadHex,
                });
            }
        }
        else {
            const fills = node.fills;
            if (fills.length > 0 && fills[0].type === "SOLID") {
                const solidFill = fills[0];
                const color = solidFill.color;
                const hexColor = rgbToHex(color.r, color.g, color.b);
                // Update both color pickers to reflect the node's fill color
                figma.ui.postMessage({
                    type: "update-intensityColor-ui",
                    color: hexColor,
                });
                figma.ui.postMessage({
                    type: "update-spreadColor-ui",
                    color: hexColor,
                });
                // Update the global color variables
                intensityColor = {
                    r: color.r,
                    g: color.g,
                    b: color.b,
                    a: solidFill.opacity || 1,
                };
                spreadColor = {
                    r: color.r,
                    g: color.g,
                    b: color.b,
                    a: solidFill.opacity || 1,
                }; // Assuming the same color for both initially
            }
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
    if (selectedNodes.length === 0 || !isNodeType(selectedNodes[0])) {
        figma.ui.postMessage({ type: "reset-opacity-ui" });
        const node = selectedNodes[0];
        const group = findNeonizeGroupForNode(node);
        if (group) {
            // Retrieve the stored opacity value from the group's plugin data
            const opacityValue = group.getPluginData("opacityValue");
            // If there's a stored opacity value, update the UI with it
            if (opacityValue) {
                figma.ui.postMessage({
                    type: "update-opacity-ui",
                    value: opacityValue,
                });
            }
            else {
                // No stored opacity value, reset the slider
                figma.ui.postMessage({ type: "reset-opacity-ui" });
            }
        }
        else {
            // If not enhanced, reset the sliders
            figma.ui.postMessage({ type: "reset-range-ui" });
        }
    }
    else {
        // No valid node selected, reset all sliders
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
    if (!node.parent) {
        figma.notify("Cannot create spread duplicate: the selected node has no parent.");
        return null;
    }
    const intensityDuplicate = node.clone();
    intensityDuplicate.name = "Intensity";
    intensityDuplicate.x = node.x;
    intensityDuplicate.y = node.y;
    if (group) {
        group.appendChild(intensityDuplicate);
    }
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
function applyIntensityEffects(node, processedOpacity, color, rawIntensityValue) {
    if ("effects" in node) {
        const effects = [];
        for (let i = 0; i < 10; i++) {
            effects.push({
                type: "DROP_SHADOW",
                color: Object.assign(Object.assign({}, color), { a: processedOpacity }),
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
    node.setPluginData("intensityValue", rawIntensityValue.toString()); // Save the raw slider value
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
figma.on("selectionchange", () => {
    updateUIColorFromSelection();
    updatePluginUIFromSelectedNode();
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length === 0 || !isNodeType(selectedNodes[0])) {
        // No valid node selected, reset the opacity slider to 100
        figma.ui.postMessage({ type: "reset-opacity-ui" });
    }
});
function findIntensityDuplicate(node) {
    // Find the Neonize Group containing the original node
    let group = findNeonizeGroupForNode(node);
    // Search for the "Intensity" clone within the group
    if (group) {
        return group.findOne((n) => n.name === "Intensity");
    }
    return null;
}
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
            // Update intensity value
            const intensityValue = intensityNode
                ? parseInt(intensityNode.getPluginData("intensityValue"))
                : 0;
            figma.ui.postMessage({
                type: "update-intensity-ui",
                value: intensityValue,
            });
            // Update spread value
            const spreadValue = spreadNode
                ? parseInt(spreadNode.getPluginData("spreadValue"))
                : 0;
            figma.ui.postMessage({ type: "update-spread-ui", value: spreadValue });
            const opacityValue = group.getPluginData("opacityValue");
            // Update opacity value
            figma.ui.postMessage({
                type: "update-opacity-ui",
                value: opacityValue, // Default to 100 if not set
            });
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
                // Retrieve the raw intensity value stored in the plugin data
                const rawIntensityValue = parseInt(intensityNode.getPluginData("intensityValue"));
                // Pass the raw intensity value directly to applyIntensityEffects
                applyIntensityEffects(intensityNode, rawIntensityValue / 100, // Convert to a percentage for opacity
                intensityColor, rawIntensityValue // Pass the raw slider value
                );
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
            updateUIColorFromSelection();
            break;
        case "intensity-change":
            const intensityValue = parseInt(msg.value); // Directly use the received value
            let selectedNode = selectedNodes[0];
            if (selectedNode.type === "GROUP" &&
                selectedNode.name === "Neonize Group") {
                // Find the intensity node within the group
                const intensityNodeInGroup = findIntensityNode();
                // If found, select this node
                if (intensityNodeInGroup) {
                    figma.currentPage.selection = [intensityNodeInGroup];
                    selectedNode = intensityNodeInGroup;
                }
            }
            if (selectedNode && isNodeType(selectedNode)) {
                let group = findNeonizeGroupForNode(selectedNodes[0]);
                // Create group with duplicates if it doesn't exist
                if (!group &&
                    selectedNodes.length > 0 &&
                    isNodeType(selectedNodes[0])) {
                    group = createNeonizeGroupWithDuplicates(selectedNodes[0]);
                }
                // Find or create intensity node
                let intensityNode = findIntensityDuplicate(selectedNode);
                if (!intensityNode && group) {
                    intensityNode = createIntensityDuplicate(selectedNode, group);
                }
                // Apply intensity effects
                if (intensityNode) {
                    applyIntensityEffects(intensityNode, intensityValue / 100, intensityColor, intensityValue); // Assuming intensityColor is defined elsewhere
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
        case "opacity-change":
            const opacityValue = msg.value / 100; // Convert to a percentage
            let targetSpreadNode = findSpreadNode();
            let targetGroup = findNeonizeGroupForNode(figma.currentPage.selection[0]);
            if (targetGroup) {
                // Save the opacity value as plugin data
                targetGroup.setPluginData("opacityValue", msg.value.toString());
            }
            // Apply the opa
            if (targetSpreadNode && "effects" in targetSpreadNode) {
                const newEffects = targetSpreadNode.effects.map((effect) => {
                    if (effect.type === "DROP_SHADOW") {
                        const newEffect = Object.assign(Object.assign({}, effect), { color: Object.assign(Object.assign({}, effect.color), { a: opacityValue }) });
                        return newEffect;
                    }
                    return effect;
                });
                targetSpreadNode.effects = newEffects;
            }
            break;
    }
};
