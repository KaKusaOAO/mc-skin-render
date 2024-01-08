require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/avatarRenderer.js":[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarRenderer = void 0;
const common_1 = require("./common");
class AvatarRenderer {
    constructor(skin) {
        this.noGrass = false;
        if (typeof skin === "string") {
            this.skinPath = skin;
        }
        else if (skin instanceof Image) {
            this.skinPath = skin.src;
            this.skin = skin;
        }
        else {
            throw new Error("Invalid skin argument");
        }
        this.resolution = 512;
    }
    async createAvatarCanvas() {
        return new Promise((resolve, reject) => {
            if (this.skin) {
                if (this.skin.complete) {
                    resolve(this.createAvatarCanvasFromSkin(this.skin));
                    return;
                }
            }
            else {
                this.skin = new Image();
                this.skin.onload = () => {
                    resolve(this.createAvatarCanvasFromSkin(this.skin));
                };
                this.skin.onerror = err => {
                    var canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 64;
                    var ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#f0f";
                    ctx.fillRect(0, 0, 64, 64);
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillRect(32, 32, 32, 32);
                    // @ts-ignore
                    resolve(this.createAvatarCanvasFromSkin(canvas));
                };
                this.skin.src = this.skinPath;
            }
        });
    }
    createAvatarCanvasFromSkin(skin) {
        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = this.resolution;
        var ctx = canvas.getContext("2d");
        this.drawAvatar(ctx, skin);
        return canvas;
    }
    drawAvatar(ctx, skin) {
        var skinCanvas = document.createElement("canvas");
        var skinCtx = skinCanvas.getContext("2d");
        skinCtx.canvas.width = skin.width;
        skinCtx.canvas.height = skin.height;
        skinCtx.drawImage(skin, 0, 0);
        var grassData = skinCtx.getImageData(60, 0, 4, 1).data;
        var isGrass = false;
        if (!this.noGrass) {
            if ((0, common_1.getPixelHex)(grassData, 3) == 0xff3acb28 &&
                (0, common_1.getPixelHex)(grassData, 2) == 0xfff9ca8b &&
                (0, common_1.getPixelHex)(grassData, 1) == 0xffff859b) {
                isGrass = true;
                (0, common_1.log)("AvatarRenderer", `Applying grass modification for skin ${skin.src}...`);
            }
        }
        var canvasList = (0, common_1.createCanvasList)(3).map(c => {
            c.width = c.height = 8;
            return c;
        });
        var [inner, outer, outerBack] = canvasList;
        var [iCtx, oCtx, oBackCtx] = canvasList.map(c => c.getContext("2d"));
        var size = Math.min(ctx.canvas.width, ctx.canvas.height);
        var grassExtend = size / 8 * 5;
        ctx.canvas.width = size;
        ctx.canvas.height = size + (isGrass ? grassExtend : 0);
        iCtx.drawImage(skin, -8, -8);
        oCtx.drawImage(skin, -40, -8);
        oBackCtx.drawImage(skin, -56, -8);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.translate(size / 2, size / 2);
        if (isGrass) {
            ctx.translate(0, grassExtend);
        }
        var t = ctx.getTransform();
        if (isGrass) {
            var stemCanvasList = (0, common_1.createCanvasList)(4);
            var [stemCanvas, leadConnCanvas, lLeafCanvas, rLeafCanvas] = stemCanvasList;
            stemCanvas.width = 1;
            stemCanvas.height = 4;
            leadConnCanvas.width = 2;
            leadConnCanvas.height = 1;
            lLeafCanvas.width = lLeafCanvas.height = 3;
            rLeafCanvas.width = rLeafCanvas.height = 3;
            var [stemCtx, leafConnCtx, lLeafCtx, rLeafCtx] = stemCanvasList.map(c => c.getContext("2d"));
            stemCtx.drawImage(skin, -62, -42);
            leafConnCtx.drawImage(skin, -60, -40);
            lLeafCtx.drawImage(skin, -58, -32);
            rLeafCtx.drawImage(skin, -58, -36);
            var px = size / 8;
            var stemOffsetY = 3.2;
            var leafAngle = 45;
            var leafHeightMult = Math.sin(Math.PI * 2 / 360 * (0, common_1.clamp)(leafAngle, 0, 90));
            var leafWidthMult = 0.75;
            leafHeightMult = (0, common_1.clamp)(leafHeightMult, 0, 1);
            var skewAmount = (0, common_1.lerp)(0.4, 0, leafHeightMult);
            ctx.drawImage(stemCanvas, -px / 2, -size / 2 - px * stemOffsetY, px, px * 4);
            ctx.drawImage(leadConnCanvas, -px, -size / 2 - px * (stemOffsetY + leafHeightMult / 2), px * 2, px * leafHeightMult);
            ctx.translate(-px, -size / 2 - px * stemOffsetY);
            ctx.transform(1, skewAmount, 0, 1, 0, 0);
            ctx.drawImage(lLeafCanvas, -px * 3 * leafWidthMult, -px * (leafHeightMult * 3 / 2), px * 3 * leafWidthMult, px * 3 * leafHeightMult);
            ctx.setTransform(t);
            ctx.translate(px, -size / 2 - px * stemOffsetY);
            ctx.transform(1, -skewAmount, 0, 1, 0, 0);
            ctx.drawImage(rLeafCanvas, 0, -px * (leafHeightMult * 3 / 2), px * 3 * leafWidthMult, px * 3 * leafHeightMult);
            ctx.setTransform(t);
        }
        ctx.scale(0.98, 0.98);
        ctx.drawImage(outerBack, -size / 2, -size / 2, size, size);
        ctx.setTransform(t);
        ctx.scale(0.9, 0.9);
        ctx.drawImage(inner, -size / 2, -size / 2, size, size);
        ctx.setTransform(t);
        ctx.drawImage(outer, -size / 2, -size / 2, size, size);
    }
}
exports.AvatarRenderer = AvatarRenderer;

},{"./common":1}],"/skinRenderer.js":[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkinRenderer = exports.createCuboidMirrored = exports.createCuboid = exports.createSkinVertex = exports.Bone = void 0;
const common_1 = require("./common");
const m4 = __importStar(require("./m4"));
const VERTEX_ELEMENT_COUNT = 8;
function createShader(gl, type, source) {
    var handle = gl.createShader(type);
    if (!handle)
        throw new Error("Failed to create a handle for a new shader");
    gl.shaderSource(handle, source);
    gl.compileShader(handle);
    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
        throw new Error("Failed to compile shader: " + gl.getShaderInfoLog(handle) + "\nSource: " + source);
    }
    return handle;
}
function createProgram(gl, vertexShader, fragShader) {
    var handle = gl.createProgram();
    if (!handle)
        throw new Error("Failed to create a handle for a new program");
    gl.attachShader(handle, vertexShader);
    gl.attachShader(handle, fragShader);
    gl.linkProgram(handle);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
        throw new Error("Failed to link program: " + gl.getProgramInfoLog(handle));
    }
    return handle;
}
class Bone {
    constructor(cuboids, pivot, rotation, children) {
        pivot !== null && pivot !== void 0 ? pivot : (pivot = [0, 0, 0]);
        rotation !== null && rotation !== void 0 ? rotation : (rotation = [0, 0, 0]);
        children !== null && children !== void 0 ? children : (children = []);
        this.cuboids = cuboids;
        this.pivot = pivot;
        this.rotation = rotation;
        this.children = children;
    }
    transform(mat) {
        var bone = this;
        if (bone.recursive) {
            throw new Error("Recursive bone setting detected!");
        }
        // mat ??= m4.translation(globalTranslate[0], globalTranslate[1], globalTranslate[2]);
        var [px, py, pz] = bone.pivot;
        var [rx, ry, rz] = bone.rotation;
        var cuboids = bone.cuboids;
        var matrix = m4.translate(mat, px, py, pz);
        matrix = m4.xRotate(matrix, rx);
        matrix = m4.yRotate(matrix, ry);
        matrix = m4.zRotate(matrix, rz);
        cuboids.forEach(cb => {
            var maxB = [0, 0, 0];
            var minB = [0, 0, 0];
            cb.forEach(face => {
                face.forEach(vertex => {
                    var v = [vertex[0], vertex[1], vertex[2], 1];
                    var [x, y, z] = m4.multiplyVertex(matrix, v);
                    vertex[0] = x;
                    vertex[1] = y;
                    vertex[2] = z;
                    maxB[0] = Math.max(maxB[0], x);
                    maxB[1] = Math.max(maxB[1], y);
                    maxB[2] = Math.max(maxB[2], z);
                    minB[0] = Math.max(minB[0], x);
                    minB[1] = Math.max(minB[1], y);
                    minB[2] = Math.max(minB[2], z);
                });
            });
            cb.center = [
                (maxB[0] + minB[0]) / 2,
                (maxB[1] + minB[1]) / 2,
                (maxB[2] + minB[2]) / 2
            ];
        });
        bone.recursive = true;
        bone.children.forEach(b => b.transform(matrix));
        bone.recursive = false;
    }
}
exports.Bone = Bone;
function createSkinVertex(x, y, z, u, v) {
    return [x, y, z, u / 64, v / 64, 0, 0, 0];
}
exports.createSkinVertex = createSkinVertex;
function createCuboid([x, y, z], [width, height, depth], [u, v], dilation, options) {
    dilation !== null && dilation !== void 0 ? dilation : (dilation = 0);
    options !== null && options !== void 0 ? options : (options = {
        grassUvMod: false
    });
    var dh = dilation / 2;
    var { grassUvMod } = options;
    var result = [
        // Left
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u, v + depth + height),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth, v + depth),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u, v + depth + height),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth, v + depth + height),
        ],
        // Front
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth, v + depth + height),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth + width, v + depth + height),
        ],
        // Back
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + depth * 2 + width * 2, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth * 2 + width, v + depth + height),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
        ],
        // Right
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth + width + depth, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth + width, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
        ],
        // Top
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth), v),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth), v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth) + width, v),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth), v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth) + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth) + width, v),
        ],
        // Bottom
        [
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + width + depth, v),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
        ],
        [
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + width + depth + width, v + depth),
        ]
    ];
    result.center = [
        x + width / 2,
        y + height / 2,
        z + depth / 2
    ];
    return result;
}
exports.createCuboid = createCuboid;
function createCuboidMirrored([x, y, z], [width, height, depth], [u, v], dilation, options) {
    dilation !== null && dilation !== void 0 ? dilation : (dilation = 0);
    options !== null && options !== void 0 ? options : (options = {
        grassUvMod: false
    });
    var dh = dilation / 2;
    var { grassUvMod } = options;
    var result = [
        // Left
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + depth + width + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth + width, v + depth),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth + width, v + depth + height),
        ],
        // Front
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth + width, v + depth + height),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth + width, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth, v + depth + height),
        ],
        // Back
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + depth * 2 + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width * 2, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width * 2, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width, v + depth + height),
        ],
        // Right
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u, v + depth + height),
        ],
        // Top
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth), v),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth), v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth) + width, v),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth), v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth) + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth) + width, v),
        ],
        // Bottom
        [
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + width + depth, v),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
        ],
        [
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + width + depth + width, v + depth),
        ]
    ];
    result.center = [
        x + width / 2,
        y + height / 2,
        z + depth / 2
    ];
    return result;
}
exports.createCuboidMirrored = createCuboidMirrored;
class SkinRenderer {
    constructor(skin, slim) {
        this.poseType = 0;
        this.mousePos = [0, 0];
        this.mousePosO = null;
        this.mousePosRaw = [0, 0];
        this.isSlim = slim;
        if (typeof skin === "string") {
            this.skinPath = skin;
            var img = new Image();
            img.src = skin;
            this.skin = img;
        }
        else if (skin instanceof Image) {
            this.skinPath = skin.src;
            this.skin = skin;
        }
        else {
            throw new Error("Invalid skin argument");
        }
        this.uniforms = {};
        this.attributes = {};
        this.noAnim = false;
        this.noGrass = false;
        this.isGrass = false;
        this.noEeveeEars = false;
        this.isEeveeEars = false;
        this.modifyInnerHead = false;
        this.modifyOuterHead = false;
        this.seed = Math.random() * 20480;
    }
    parseTexture() {
        var skinCanvas = document.createElement("canvas");
        var skinCtx = skinCanvas.getContext("2d");
        var skin = this.skin;
        skinCtx.canvas.width = skin.width;
        skinCtx.canvas.height = skin.height;
        skinCtx.drawImage(skin, 0, 0);
        var grassData = skinCtx.getImageData(60, 0, 4, 1).data;
        var isGrass = false;
        var modifyInnerHead = false;
        var modifyOuterHead = false;
        var validModifier = true;
        if ((0, common_1.getPixelHex)(grassData, 3) == 0xff3acb28 &&
            (0, common_1.getPixelHex)(grassData, 2) == 0xfff9ca8b &&
            (0, common_1.getPixelHex)(grassData, 1) == 0xffff859b) {
            isGrass = true;
            (0, common_1.log)("SkinParse", `Identified valid grass skin: ${skin.src}`);
            var modifier = (0, common_1.getPixel)(grassData, 0);
            if (modifier[3] == 0xff && modifier[0] == 0xff) {
                if (modifier[1] == 0xfe) {
                    (0, common_1.log)("SkinParse", `Will modify inner head UV for this skin`);
                    modifyInnerHead = true;
                }
                else {
                    validModifier = modifier[1] == 0xff;
                }
                if (modifier[2] == 0xfe) {
                    (0, common_1.log)("SkinParse", `Will modify outer head UV for this skin`);
                    modifyOuterHead = true;
                }
                else {
                    validModifier = validModifier && modifier[2] == 0xff;
                }
            }
        }
        else if ((0, common_1.getPixelHex)(grassData, 3) == 0xff51280c &&
            (0, common_1.getPixelHex)(grassData, 2) == 0xffc5a068 &&
            (0, common_1.getPixelHex)(grassData, 1) == 0xffd8c5a1) {
            this.isEeveeEars = true;
            (0, common_1.log)("SkinParse", `Identified valid eevee ears skin: ${skin.src}`);
        }
        this.isGrass = isGrass;
        this.modifyInnerHead = modifyInnerHead && validModifier;
        this.modifyOuterHead = modifyOuterHead && validModifier;
    }
    createCanvas() {
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("webgl2", {
            antialias: false
        });
        if (!gl)
            throw new Error("WebGL is not supported");
        this.context = gl;
        var vertexShaderSource = `#version 300 es
        in vec3 aPos;
        in vec2 aTexCoord;
        in vec3 aNormal;
        
        uniform mat4 uMatrix;

        out vec2 vTexCoord;
        out vec3 vNormal;
        
        void main() {
            gl_Position = uMatrix * vec4(aPos, 1);
            vTexCoord = aTexCoord;
            vNormal = normalize(aNormal);
        }            
        `;
        var fragShaderSource = `#version 300 es
        precision highp float;
        
        uniform sampler2D uTexture;
        uniform float uShadeMix;

        in vec2 vTexCoord;
        in vec3 vNormal;
        out vec4 outColor;

        vec3 rgb2hsv(vec3 c) {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }

        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
            vec4 color = texture(uTexture, vTexCoord);
            if (color.a == .0) discard;

            float a = color.a;
            float diff = max(dot(vNormal, normalize(vec3(0, 0, 1))), 0.0);
            diff = mix(0.5, 1.05, diff);

            vec3 hsv = rgb2hsv(color.rgb);
            vec3 lightColor = hsv2rgb(mix(hsv, vec3(hsv.r, 0, 1.02), 0.9));
            vec3 darkColor = hsv2rgb(mix(hsv, vec3(hsv.r, 0.8, 0.5), 0.8));
            vec3 diffuse = mix(darkColor, lightColor, diff);
            vec3 lighten = diffuse * mix(color.rgb, lightColor, 0.125);
            
            outColor = mix(color, vec4(lighten, a), uShadeMix);
        }          
        `;
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        var fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);
        var program = createProgram(gl, vertexShader, fragShader);
        gl.useProgram(program);
        this.program = program;
        var tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
            0, 0, 0, 255,
            255, 0, 255, 255,
            255, 0, 255, 255,
            0, 0, 0, 255,
        ]));
        var loadTexture = () => {
            requestAnimationFrame(() => {
                if (gl == null)
                    throw new Error();
                this.parseTexture();
                (0, common_1.log)("SkinRenderer", "Uploading texture data: " + this.skin.src);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.skin);
                // This is required
                gl.generateMipmap(gl.TEXTURE_2D);
            });
        };
        if (this.skin.complete) {
            loadTexture();
        }
        else {
            this.skin.onload = () => loadTexture();
        }
        this.texture = tex;
        var program = this.program;
        var uniforms = this.uniforms;
        var attrs = this.attributes;
        uniforms.matrix = gl.getUniformLocation(program, "uMatrix");
        uniforms.texture = gl.getUniformLocation(program, "uTexture");
        uniforms.shadeMix = gl.getUniformLocation(program, "uShadeMix");
        attrs.pos = gl.getAttribLocation(program, "aPos");
        attrs.uv = gl.getAttribLocation(program, "aTexCoord");
        attrs.normal = gl.getAttribLocation(program, "aNormal");
        var vertexBuffer = gl.createBuffer();
        this.vertexBuffer = vertexBuffer;
        this.canvas = canvas;
        document.addEventListener("mousemove", ev => {
            var x = ev.clientX;
            var y = ev.clientY;
            this.mousePosRaw = [x, y];
        });
        document.addEventListener("touchmove", ev => {
            var x = ev.touches[0].clientX;
            var y = ev.touches[0].clientY;
            this.mousePosRaw = [x, y];
        });
        var mrf = () => {
            var rect = this.canvas.getBoundingClientRect();
            var [x, y] = this.mousePosRaw;
            x = (x - rect.left - rect.width / 2 - document.documentElement.scrollLeft) / (rect.width / 2);
            y = 1 - (y - rect.top - document.documentElement.scrollTop) / rect.height * 2;
            y += -0.2;
            this.mousePos = [x, y];
            if (this.mousePosO == null) {
                this.mousePosO = [x, y];
            }
            else {
                var pg = 0.15;
                this.mousePosO = [
                    (0, common_1.lerp)(this.mousePosO[0], x, pg),
                    (0, common_1.lerp)(this.mousePosO[1], y, pg),
                ];
            }
        };
        setInterval(() => mrf(), 16);
        return canvas;
    }
    render() {
        var _a;
        var animDuration = 250; // 180;
        var camTx = 0;
        var camTy = 24;
        var camTz = -50;
        var globalTranslate = [0, 0, 0];
        function transformBone(bone, mat) {
            mat !== null && mat !== void 0 ? mat : (mat = m4.translation(globalTranslate[0], globalTranslate[1], globalTranslate[2]));
            bone.transform(mat);
        }
        function createBone(cuboids, pivot, rotation, children) {
            pivot !== null && pivot !== void 0 ? pivot : (pivot = [0, 0, 0]);
            rotation !== null && rotation !== void 0 ? rotation : (rotation = [0, 0, 0]);
            children !== null && children !== void 0 ? children : (children = []);
            return new Bone(cuboids, pivot, rotation, children);
        }
        var yOffset = -20;
        var pose = {
            head: [0, 0, 0],
            body: [0, 0, 0],
            bodyInv: [0, 0, 0],
            leftArm: [0, 0, 0],
            rightArm: [0, 0, 0],
            leftLeg: [0, 0, 0],
            rightLeg: [0, 0, 0]
        };
        var fn = (n, i) => {
            i !== null && i !== void 0 ? i : (i = 1);
            var a = 0;
            var b = 0;
            var f = Math.floor(i);
            var c = Math.ceil(i);
            for (var j = 0; j < f; j++) {
                n = n * n * (3 - 2 * n);
            }
            a = n;
            if (f == c)
                return a;
            for (var j = f; j < c; j++) {
                n = n * n * (3 - 2 * n);
            }
            b = n;
            return (0, common_1.lerp)(a, b, i - f);
        };
        if (this.poseType == 0) {
            var anim = this.noAnim ? -Math.PI / 4 : (0, common_1.lerp)(-1, 1, fn(Math.sin(this.seed + performance.now() / animDuration) / 2 + 0.5, 0.25)) * Math.PI / 2.5;
            var headAnim = this.noAnim ? -Math.PI / 4 : (0, common_1.lerp)(-1, 1, fn(Math.sin(this.seed + performance.now() / animDuration * 2) / 2 + 0.5, 0.25)) * Math.PI / 2.5;
            var bodyRotY = anim * 0.125;
            pose = {
                head: [-headAnim * 0.125, anim * 0.125, 0],
                body: [0, bodyRotY, 0],
                bodyInv: [0, -bodyRotY, 0],
                leftArm: [anim, 0, 0],
                rightArm: [-anim, 0, 0],
                leftLeg: [-anim, 0, 0],
                rightLeg: [anim, 0, 0],
            };
            var walkAnim = this.noAnim ? 0 : (0, common_1.lerp)(0, 1, Math.abs(Math.sin(this.seed + performance.now() / animDuration))) * Math.PI;
            globalTranslate[1] = walkAnim * 2;
            // var angle = (this.noAnim ? 195 : (Math.sin(performance.now() / 1000 * 160 / animDuration) * 30 + 180)) * Math.PI / 180;
            var angle = (performance.now() / 1000 * 16 / 180 + 1) * Math.PI;
            camTx = Math.sin(angle) * 50;
            camTz = Math.cos(angle) * 50;
        }
        else if (this.poseType == 1) {
            var [mx, my] = (_a = this.mousePosO) !== null && _a !== void 0 ? _a : [0, 0];
            var yaw = fn((0, common_1.clamp)((mx / 12 + 1) / 2, 0, 1), 2.5);
            var pitch = fn((0, common_1.clamp)((my / 12 + 1) / 2, 0, 1), 2.5);
            var xRot = (0, common_1.lerp)(-Math.PI / 2.25, Math.PI / 2.25, pitch);
            var yRot = (0, common_1.lerp)(Math.PI / 2.25, -Math.PI / 2.25, yaw);
            var bodyXRot = xRot; // Math.min(0, xRot);
            pose.head = [xRot / 1.5, yRot / 1.5, 0];
            pose.body = [bodyXRot, yRot / 2, 0];
            pose.bodyInv = [-bodyXRot, -yRot / 2, 0];
            camTy = 12;
        }
        var headBone;
        var outerDilation = 0.5;
        var bones = [
            createBone([
                // Body (inner / outer)
                createCuboid([-4, 0, -2], [8, 12, 4], [16, 16], 0.01),
                createCuboid([-4, 0, -2], [8, 12, 4], [16, 32], 0.01 + outerDilation)
            ], [0, yOffset + 12, 0], pose.body, [
                headBone = createBone([
                    // Head (inner / outer)
                    createCuboid([-4, 0, -4], [8, 8, 8], [0, 0], 0, { grassUvMod: !this.noGrass && this.modifyInnerHead }),
                    createCuboid([-4, 0, -4], [8, 8, 8], [32, 0], outerDilation * 2, { grassUvMod: !this.noGrass && this.modifyOuterHead })
                ], [0, 12, 0], pose.head),
                createBone([
                    // Left arm (inner / outer)
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [40, 16], 0),
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [40, 32], outerDilation),
                ], [this.isSlim ? -5 : -6, 12, 0], pose.leftArm),
                createBone([
                    // Right arm (inner / outer)
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [32, 48], 0),
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [48, 48], outerDilation),
                ], [6, 12, 0], pose.rightArm),
                createBone([], [-2, 0, 0], pose.bodyInv, [
                    createBone([
                        // Left leg (inner / outer)
                        createCuboid([-2, -12, -2], [4, 12, 4], [0, 16], 0),
                        createCuboid([-2, -12, -2], [4, 12, 4], [0, 32], outerDilation),
                    ], [0, 0, 0], pose.leftLeg),
                ]),
                createBone([], [2, 0, 0], pose.bodyInv, [
                    createBone([
                        // Right leg (inner / outer)
                        createCuboid([-2, -12, -2], [4, 12, 4], [16, 48], 0),
                        createCuboid([-2, -12, -2], [4, 12, 4], [0, 48], outerDilation),
                    ], [0, 0, 0], pose.rightLeg)
                ]),
            ]),
        ];
        if (!this.noGrass && this.isGrass) {
            headBone.children.push(createBone([
                // Stem
                createCuboid([-0.5, 0, -0.5], [1, 4, 0], [62, 42], 0.001)
            ], [0, 8, 0], [0, 0, 0], [
                createBone([
                    // Connection
                    createCuboid([-1, -0.5, 0], [2, 1, 0], [60, 40], 0.001)
                ], [0, 4, -0.5], [37.5 * Math.PI / 180, 0, 0], [
                    createBone([
                        // Left leaf
                        createCuboid([-3, -1.5, 0], [3, 3, 0], [58, 32], 0.01)
                    ], [-1, 0, 0], [0, -17.5 * Math.PI / 180, 0]),
                    createBone([
                        // Right leaf
                        createCuboid([0, -1.5, 0], [3, 3, 0], [58, 36], 0.01)
                    ], [1, 0, 0], [0, 17.5 * Math.PI / 180, 0])
                ])
            ]));
        }
        if (!this.noEeveeEars && this.isEeveeEars) {
            headBone.children.push(createBone([
                // Right ear
                createCuboidMirrored([2 - 4, 1, -0.5], [2, 5, 1], [58, 19]),
                createCuboidMirrored([0 - 4, 1, -0.5], [2, 5, 1], [58, 27]),
                createCuboidMirrored([1 - 4, 0, -0.5], [3, 1, 1], [56, 38]),
                createCuboidMirrored([0 - 4, 7, -0.5], [2, 1, 1], [58, 35]),
                createCuboidMirrored([0 - 4, 6, -0.5], [3, 1, 1], [56, 41]),
            ], [-1.5, 7, 0], [12.5 * Math.PI / 180, 7.5 * Math.PI / 180, 17.5 * Math.PI / 180]), createBone([
                // Left ear
                createCuboid([0, 1, -0.5], [2, 5, 1], [58, 19]),
                createCuboid([2, 1, -0.5], [2, 5, 1], [58, 27]),
                createCuboid([0, 0, -0.5], [3, 1, 1], [56, 38]),
                createCuboid([2, 7, -0.5], [2, 1, 1], [58, 35]),
                createCuboid([1, 6, -0.5], [3, 1, 1], [56, 41]),
            ], [1.5, 7, 0], [12.5 * Math.PI / 180, -7.5 * Math.PI / 180, -17.5 * Math.PI / 180]));
        }
        var allBones = [];
        function addBonesToList(bone) {
            allBones.push(bone);
            bone.children.forEach(b => addBonesToList(b));
        }
        bones.forEach(b => {
            transformBone(b);
            addBonesToList(b);
        });
        var cuboids = allBones.flatMap(b => b.cuboids);
        function prepareCuboids(cuboids) {
            function centerOfFace(face) {
                var vectorA = face[0];
                var vectorB = face[1];
                var vectorC = face[2];
                var centerX = ((vectorA[0] + vectorB[0] + vectorC[0]) / 3);
                var centerY = ((vectorA[1] + vectorB[1] + vectorC[1]) / 3);
                var centerZ = ((vectorA[2] + vectorB[2] + vectorC[2]) / 3);
                return [centerX, centerY, centerZ];
            }
            function dist(a, b) {
                return Math.sqrt(Math.pow(a[0] - b[0], 2) +
                    Math.pow(a[1] - b[1], 2) +
                    Math.pow(a[2] - b[2], 2));
            }
            // Z-sort all faces (triangles) in cuboids
            cuboids.forEach((cube) => {
                cube.sort((a, b) => {
                    var ca = centerOfFace(a);
                    var cb = centerOfFace(b);
                    var camPos = [camTx, camTy, camTz];
                    return dist(camPos, cb) - dist(camPos, ca);
                });
            });
            // Z-sort all cuboids in the model
            cuboids.sort((a, b) => {
                var ca = a.center;
                var cb = b.center;
                var camPos = [camTx, 0, camTz];
                return dist(camPos, cb) - dist(camPos, ca);
            });
            // Calculate the normal of each triangles
            cuboids.forEach((c) => {
                c.forEach((face) => {
                    // Deconstruct the triangle into 3 vertices.
                    let [v1, v2, v3] = face;
                    // We need them casted into m4.Vector3 in order to pass these into m4 functions
                    let p1 = v1;
                    let p2 = v2;
                    let p3 = v3;
                    // These operations produces a new array containing 3 elements (x, y, z).
                    let a = m4.subtractVectors(p2, p1);
                    let b = m4.subtractVectors(p3, p1);
                    let n = face.normal = m4.cross(a, b);
                    function setNormal(p, normal) {
                        // Vertex layout: x, y, z, u, v, nx, ny, nz
                        //         Index: 0, 1, 2, 3, 4, 5,  6,  7
                        p.splice(5);
                        Array.prototype.push.apply(p, normal);
                        // p[5] = normal[0];
                        // p[6] = normal[1];
                        // p[7] = normal[2];
                    }
                    // Assign the calculated normal back to the vertex
                    setNormal(v1, n);
                    setNormal(v2, n);
                    setNormal(v3, n);
                });
            });
        }
        prepareCuboids(cuboids);
        // Start rendering
        var canvas = this.canvas;
        var gl = this.context;
        var uniforms = this.uniforms;
        var attrs = this.attributes;
        var projMat = m4.perspective(60 / 180 * Math.PI, canvas.width / canvas.height, 1, 1000);
        var camMat = m4.scale(m4.lookAt([camTx, camTy, camTz], [0, 0, 0], [0, 1, 0]), -1, 1, 1);
        var viewMat = m4.inverse(camMat);
        var viewProjMat = m4.multiply(projMat, viewMat);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // Matrix uniform
        gl.uniformMatrix4fv(uniforms.matrix, false, m4.translate(viewProjMat, 0, 0, 0));
        // Shade?
        gl.uniform1f(uniforms.shadeMix, 1);
        // Texture filters
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(uniforms.texture, 0);
        var vertexBuffer = this.vertexBuffer;
        var sizeFloat = Float32Array.BYTES_PER_ELEMENT;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cuboids.flat(3)), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(attrs.pos);
        gl.enableVertexAttribArray(attrs.uv);
        gl.enableVertexAttribArray(attrs.normal);
        gl.vertexAttribPointer(attrs.pos, 3, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 0);
        gl.vertexAttribPointer(attrs.uv, 2, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 3 * sizeFloat);
        gl.vertexAttribPointer(attrs.normal, 3, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 5 * sizeFloat);
        gl.drawArrays(gl.TRIANGLES, 0, cuboids.flat(2).length);
    }
}
exports.SkinRenderer = SkinRenderer;

},{"./common":1,"./m4":2}],1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPixelHex = exports.lerp = exports.clamp = exports.log = exports.vLShift = exports.getPixel = exports.createCanvasList = void 0;
function createCanvasList(amount) {
    var arr = [];
    for (var i = 0; i < amount; i++) {
        arr.push(document.createElement("canvas"));
    }
    return arr;
}
exports.createCanvasList = createCanvasList;
function getPixel(data, index) {
    index *= 4;
    return [
        data[index],
        data[index + 1],
        data[index + 2],
        data[index + 3]
    ];
}
exports.getPixel = getPixel;
function vLShift(n, shift) {
    n = Math.floor(n);
    for (var i = 0; i < shift; i++) {
        n *= 2;
    }
    return n;
}
exports.vLShift = vLShift;
function log(name, ...args) {
    var fn = console.log.bind(console, `%c %c ${name} %c `, "background: #f8a; font-weight: bold;", "background: #f58; color: #fff; font-weight: bold;", "background: #f8a; font-weight: bold;");
    fn.apply(console, args);
}
exports.log = log;
function clamp(val, min, max) {
    return val > max ? max : (val < min ? min : val);
}
exports.clamp = clamp;
function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}
exports.lerp = lerp;
function getPixelHex(data, index) {
    // return in ARGB
    var c = getPixel(data, index);
    var hex = vLShift(c[3], 24) + vLShift(c[0], 16) + vLShift(c[1], 8) + c[2];
    return hex;
}
exports.getPixelHex = getPixelHex;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformVector = exports.lookAt = exports.normalize = exports.subtractVectors = exports.cross = exports.inverse = exports.scale = exports.zRotate = exports.yRotate = exports.xRotate = exports.translate = exports.scaling = exports.zRotation = exports.yRotation = exports.xRotation = exports.translation = exports.multiplyVertex = exports.multiply = exports.projection = exports.perspective = void 0;
function perspective(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0,
    ];
}
exports.perspective = perspective;
;
function projection(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 2 / depth, 0,
        -1, 1, 0, 1,
    ];
}
exports.projection = projection;
function multiply(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
        b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
        b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
        b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
        b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
        b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
        b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
        b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
        b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
        b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
        b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
        b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
        b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
        b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
        b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
        b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
        b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
}
exports.multiply = multiply;
function multiplyVertex(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var [x, y, z, w] = b;
    return [
        x * a00 + y * a10 + z * a20 + w * a30,
        x * a01 + y * a11 + z * a21 + w * a31,
        x * a02 + y * a12 + z * a22 + w * a32,
        x * a03 + y * a13 + z * a23 + w * a33,
    ];
}
exports.multiplyVertex = multiplyVertex;
function translation(tx, ty, tz) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1,
    ];
}
exports.translation = translation;
function xRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
    ];
}
exports.xRotation = xRotation;
function yRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
    ];
}
exports.yRotation = yRotation;
function zRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}
exports.zRotation = zRotation;
function scaling(sx, sy, sz) {
    return [
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0,
        0, 0, 0, 1,
    ];
}
exports.scaling = scaling;
function translate(m, tx, ty, tz) {
    return multiply(m, translation(tx, ty, tz));
}
exports.translate = translate;
function xRotate(m, angleInRadians) {
    return multiply(m, xRotation(angleInRadians));
}
exports.xRotate = xRotate;
function yRotate(m, angleInRadians) {
    return multiply(m, yRotation(angleInRadians));
}
exports.yRotate = yRotate;
function zRotate(m, angleInRadians) {
    return multiply(m, zRotation(angleInRadians));
}
exports.zRotate = zRotate;
function scale(m, sx, sy, sz) {
    return multiply(m, scaling(sx, sy, sz));
}
exports.scale = scale;
function inverse(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0 = m22 * m33;
    var tmp_1 = m32 * m23;
    var tmp_2 = m12 * m33;
    var tmp_3 = m32 * m13;
    var tmp_4 = m12 * m23;
    var tmp_5 = m22 * m13;
    var tmp_6 = m02 * m33;
    var tmp_7 = m32 * m03;
    var tmp_8 = m02 * m23;
    var tmp_9 = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;
    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    return [
        d * t0,
        d * t1,
        d * t2,
        d * t3,
        d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
            (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
        d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
            (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
        d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
            (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
        d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
            (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
        d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
            (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
        d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
            (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
        d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
            (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
        d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
            (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
        d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
            (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
        d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
            (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
        d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
            (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
        d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
            (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
    ];
}
exports.inverse = inverse;
function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}
exports.cross = cross;
function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
exports.subtractVectors = subtractVectors;
function normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    }
    else {
        return [0, 0, 0];
    }
}
exports.normalize = normalize;
function lookAt(cameraPosition, target, up) {
    var zAxis = normalize(subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));
    return [
        xAxis[0], xAxis[1], xAxis[2], 0,
        yAxis[0], yAxis[1], yAxis[2], 0,
        zAxis[0], zAxis[1], zAxis[2], 0,
        cameraPosition[0],
        cameraPosition[1],
        cameraPosition[2],
        1,
    ];
}
exports.lookAt = lookAt;
function transformVector(m, v) {
    var dst = [];
    for (var i = 0; i < 4; ++i) {
        dst[i] = 0.0;
        for (var j = 0; j < 4; ++j) {
            dst[i] += v[j] * m[j * 4 + i];
        }
    }
    return dst;
}
exports.transformVector = transformVector;

},{}]},{},[]);
