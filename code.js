"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Show the UI and set its size
figma.showUI(__html__);
figma.ui.resize(400, 335);
// Convert hex color to RGBA
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
            a: 1,
        }
        : { r: 1, g: 1, b: 1, a: 1 };
}
// Convert RGBA color to hex
function rgbToHex(r, g, b) {
    var toHex = function (c) {
        return Math.round(c * 255)
            .toString(16)
            .padStart(2, "0");
    };
    return "#".concat(toHex(r)).concat(toHex(g)).concat(toHex(b));
}
// Check if a node is of a valid type
var isNodeType = function (node) {
    return [
        "RECTANGLE",
        "ELLIPSE",
        "POLYGON",
        "LINE",
        "STAR",
        "VECTOR",
        "TEXT",
    ].includes(node.type);
};
// Initial color values
var intensityColor = { r: 1, g: 1, b: 1, a: 1 };
var spreadColor = { r: 1, g: 1, b: 1, a: 1 };
// Update the UI with colors from the selected node
function updateUIColorFromSelection() {
    var selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0 && isNodeType(selectedNodes[0])) {
        var node = selectedNodes[0];
        var fills = node.fills;
        if (fills.length > 0 && fills[0].type === "SOLID") {
            var solidFill = fills[0];
            var color = solidFill.color;
            var hexColor = rgbToHex(color.r, color.g, color.b);
            figma.ui.postMessage({
                type: "update-intensityColor-ui",
                color: hexColor,
            });
            figma.ui.postMessage({
                type: "update-spreadColor-ui",
                color: hexColor,
            });
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
            };
        }
    }
    else {
        figma.ui.postMessage({ type: "reset-range-ui" });
    }
}
// Apply intensity effects to a node
function applyIntensityEffects(node, processedOpacity, color, rawIntensityValue) {
    return __awaiter(this, void 0, void 0, function () {
        var effects, i;
        return __generator(this, function (_a) {
            if ("effects" in node) {
                effects = [];
                for (i = 0; i < 10; i++) {
                    effects.push({
                        type: "DROP_SHADOW",
                        color: __assign(__assign({}, color), { a: processedOpacity }),
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
            node.setPluginData("intensityValue", rawIntensityValue.toString());
            return [2 /*return*/];
        });
    });
}
// Apply spread effects to a node
function applySpreadEffects(node, value, color) {
    return __awaiter(this, void 0, void 0, function () {
        var effects, i;
        return __generator(this, function (_a) {
            if ("effects" in node) {
                effects = [];
                for (i = 0; i < 10; i++) {
                    effects.push({
                        type: "DROP_SHADOW",
                        color: __assign(__assign({}, color), { a: 1 }),
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
            return [2 /*return*/];
        });
    });
}
// Update the UI when the selection changes
figma.on("selectionchange", function () {
    updateUIColorFromSelection();
});
// Handle messages from the UI
figma.ui.onmessage = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var selectedNodes, intensityNode, rawIntensityValue, spreadNode, intensityValue, selectedNode, spreadValue, node, opacityValue_1, targetNode, newEffects;
    return __generator(this, function (_a) {
        selectedNodes = figma.currentPage.selection;
        switch (msg.type) {
            case "intensityColor-change":
                intensityColor = hexToRgb(msg.color);
                intensityNode = selectedNodes[0];
                if (intensityNode && isNodeType(intensityNode)) {
                    rawIntensityValue = parseInt(intensityNode.getPluginData("intensityValue"));
                    applyIntensityEffects(intensityNode, rawIntensityValue / 100, intensityColor, rawIntensityValue);
                }
                break;
            case "spreadColor-change":
                spreadColor = hexToRgb(msg.color);
                spreadNode = selectedNodes[0];
                if (spreadNode && isNodeType(spreadNode)) {
                    applySpreadEffects(spreadNode, parseInt(spreadNode.getPluginData("spreadValue")), spreadColor);
                }
                break;
            case "intensity-change":
                intensityValue = parseInt(msg.value);
                selectedNode = selectedNodes[0];
                if (selectedNode && isNodeType(selectedNode)) {
                    applyIntensityEffects(selectedNode, intensityValue / 100, intensityColor, intensityValue);
                }
                break;
            case "spread-change":
                spreadValue = parseInt(msg.value);
                node = selectedNodes[0];
                if (node && isNodeType(node)) {
                    applySpreadEffects(node, spreadValue, spreadColor);
                }
                break;
            case "opacity-change":
                opacityValue_1 = msg.value / 100;
                targetNode = selectedNodes[0];
                if (targetNode && isNodeType(targetNode)) {
                    if ("effects" in targetNode) {
                        newEffects = targetNode.effects.map(function (effect) {
                            if (effect.type === "DROP_SHADOW") {
                                return __assign(__assign({}, effect), { color: __assign(__assign({}, effect.color), { a: opacityValue_1 }) });
                            }
                            return effect;
                        });
                        targetNode.effects = newEffects;
                    }
                }
                break;
        }
        return [2 /*return*/];
    });
}); };
