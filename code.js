"use strict";
figma.showUI(__html__);
figma.ui.resize(400, 400);
let cloneNode = null;
figma.ui.onmessage = (messages) => {
    const { value } = messages;
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
                    node.effects = [baseGlow, spreadGlow];
                    // set position
                    // Group the original node and its clone
                    // Log a message to indicate that the blur effect has been applied
                }
            }
        }
    }
};
