"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 400);
let cloneNode = null;
const updateBrightness = (msg) => {
    const { value } = msg;
    // Check if there's a selection on the current page
    if (figma.currentPage.selection.length > 0) {
        // Loop through selected nodes
        if (!cloneNode) {
            for (const node of figma.currentPage.selection) {
                // Check if the selected node is a type that can have effects (e.g., 'RECTANGLE', 'ELLIPSE', 'POLYGON')
                if (node.type === "RECTANGLE" ||
                    node.type === "ELLIPSE" ||
                    node.type === "POLYGON") {
                    // Clone the selected node
                    cloneNode = node.clone();
                    // Create a blur effect with the specified radius
                    const blurEffect = {
                        type: "LAYER_BLUR",
                        radius: value * 1,
                        visible: true,
                    };
                    const innerShadow = {
                        type: "INNER_SHADOW",
                        radius: value * 1,
                        visible: true,
                        offset: {
                            x: 0,
                            y: 4,
                        },
                        blendMode: "NORMAL",
                        color: { r: 1, g: 1, b: 1, a: 1 },
                    };
                    const dropShadow = {
                        type: "DROP_SHADOW",
                        color: { r: 1, g: 1, b: 1, a: 1 },
                        offset: {
                            x: 0,
                            y: 4,
                        },
                        radius: value * 1.5,
                        spread: 0,
                        visible: true,
                        blendMode: "NORMAL",
                        showShadowBehindNode: true,
                    };
                    cloneNode.effects = [innerShadow, dropShadow];
                    // Add the cloned node to the current page
                    figma.currentPage.appendChild(cloneNode);
                    // Automatically rename the clone node with "Copy" at the end of the name
                    if (cloneNode.name) {
                        cloneNode.name += " Copy";
                    }
                    else {
                        cloneNode.name = "Copy";
                    }
                    // Group the original node and its clone
                    const group = figma.group([node, cloneNode], figma.currentPage);
                    group.name = "Grouped Node"; // Set a name for the group
                    // Log a message to indicate that the blur effect has been applied
                    console.log(`Applied blur effect and grouped nodes: ${node.name || "unnamed node"}.`);
                }
            }
        }
    }
};
figma.ui.onmessage = updateBrightness;
