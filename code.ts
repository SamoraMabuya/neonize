figma.showUI(__html__);
figma.ui.resize(400, 400);

const updateBlurEffect = (msg: any) => {
  const { value,  } = msg;

  // Check if there's a selection on the current page
  if (figma.currentPage.selection.length > 0) {
    // Loop through selected nodes
    for (const node of figma.currentPage.selection) {
      // Check if the selected node is a type that can have effects (e.g., 'RECTANGLE', 'ELLIPSE', 'POLYGON')
      if (
        node.type === "RECTANGLE" ||
        node.type === "ELLIPSE" ||
        node.type === "POLYGON"
      ) {
          // Create a blur effect with the specified radius
          const blurEffect: BlurEffect = {
            type: "LAYER_BLUR",
            radius: value * 1  ,// Adjust the value to your desired range
            visible: true,
          };

          const innerShadow: InnerShadowEffect = {
            type: "INNER_SHADOW",
            radius: value * 1,
            visible: true,
            offset: {
              x: 0,
              y: 4,
            },
            blendMode: "NORMAL",
            color: {
              r: 0.255,
              g: 0.255,
              b: 0.255,
              a: 1
            }


          }


          const dropShadow: DropShadowEffect {
            
          }

          

          // Set the node's effects to the created blur effect
          node.effects = [innerShadow];

          // Log a message to indicate that the blur effect has been applied
          console.log(`Applied blur effect to ${node.name || "unnamed node"}.`);
        }
      }
    }
    
};

figma.ui.onmessage = updateBlurEffect;

