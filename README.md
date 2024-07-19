# Neonize

### What Neonize Offers

**Glow Color:** Using our built-in color picker on the plugin, select any color of your choice to alter the glow color.
**Glow Intensity:** A range slider that adjusts the intensity of the glow on your selections.
**Selection Types:** The plugin can only be used on rectangles, ellipses, polygons, lines, stars, arrows, vectors, and text.

### How to Use Neonize:

**Select a Node:** Choose the design element you want to enhance.
**Valid nodes:** rectangle, ellipse, polygon, line, star, arrows, vector, text.
**Adjust glow intensity:** Drag the knob on the slider to intensify the glow brightness on the selected shape or text.
**Pick a Color:** Use the color picker on the plugin to select the desired glow color.
**Limitations:** Neonize is optimized to work on specific target types. This includes rectangle, ellipse, polygon, line, star, arrows, vector, text.

The plugin has not yet been tested properly to enhance multiple nodes simultaneously, and could mean that unexpected results could be rendered when attempting to run Neonize on several nodes at the same time.

## Installation for Developers

To set up the project for development, follow these steps:

### Prerequisites

- Ensure Node.js and npm are installed on your machine. [Node.js Download](https://nodejs.org/en/download/).
- Figma Desktop App installed (Windows or macOS)

### Setup

**1. Clone the Repository**

```sh
git clone https://github.com/SamoraMabuya/neonize.git
cd neonize

```

**2. Install dependencies**

```sh
   npm install

```

**3. Run project**

```sh
 npm run build
```

or

```sh
npm run watch
```

\*\*\*4. Open Figma App

- Click the menu icon
- Navigate to Plugins > Development > Import plugin from manifest
- Navigate to the root of the cloned project and select manifest.json

If prompted with a floating menu, just select Neonize which has a "development" tag next to it.

You should see the plugin appear on your screen.

### Have Fun!
