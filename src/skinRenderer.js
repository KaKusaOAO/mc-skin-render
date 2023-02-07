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
function createShader(gl, type, source) {
    var handle = gl.createShader(type);
    if (!handle)
        throw new Error("Failed to create a handle for a new shader");
    gl.shaderSource(handle, source);
    gl.compileShader(handle);
    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
        throw new Error("Failed to compile shader: " + gl.getShaderInfoLog(handle));
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
    return [x, y, z, u / 64, v / 64];
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

        void main() {
            vec4 color = texture(uTexture, vTexCoord);
            if (color.a == .0) discard;

            float a = color.a;
            float diff = max(dot(vNormal, normalize(vec3(0, 0, 1))), 0.0);
            diff = mix(0.85, 1.05, diff);

            vec3 lightColor = mix(color.rgb, vec3(1, 1, 1), 0.88);
            vec3 diffuse = diff * lightColor;
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
        var camTx = Math.sin(Math.PI) * 50;
        var camTy = 24;
        var camTz = Math.cos(Math.PI) * 50;
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
            var angle = (this.noAnim ? 195 : (Math.sin(performance.now() / 1000 * 160 / animDuration) * 30 + 180)) * Math.PI / 180;
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
            // Z-sort all faces in cuboids
            cuboids.forEach(cube => {
                cube.sort((a, b) => {
                    // a and b are two faces
                    var ca = centerOfFace(a);
                    var cb = centerOfFace(b);
                    var camPos = [camTx, camTy, camTz];
                    return dist(camPos, cb) - dist(camPos, ca);
                });
            });
            cuboids.sort((a, b) => {
                // a and b are two cubes
                var ca = a.center;
                var cb = b.center;
                var camPos = [camTx, 0, camTz];
                return dist(camPos, cb) - dist(camPos, ca);
            });
            // Normal calculate
            cuboids.forEach(c => {
                c.forEach(face => {
                    var p1 = face[0];
                    var p2 = face[1];
                    var p3 = face[2];
                    var a = m4.subtractVectors(p2, p1);
                    var b = m4.subtractVectors(p3, p1);
                    var n = face.normal = m4.cross(a, b);
                    Array.prototype.push.apply(p1, n);
                    Array.prototype.push.apply(p2, n);
                    Array.prototype.push.apply(p3, n);
                });
            });
        }
        prepareCuboids(cuboids);
        // Start rendering
        var canvas = this.canvas;
        var gl = this.context;
        var uniforms = this.uniforms;
        var attrs = this.attributes;
        var projMat = m4.perspective(87, canvas.width / canvas.height, 1, 1000);
        var camMat = m4.scale(m4.lookAt([camTx, camTy, camTz], [0, 0, 0], [0, 1, 0]), 1, -1, 1);
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
        gl.vertexAttribPointer(attrs.pos, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
        gl.vertexAttribPointer(attrs.uv, 2, gl.FLOAT, false, 8 * sizeFloat, 3 * sizeFloat);
        gl.vertexAttribPointer(attrs.normal, 3, gl.FLOAT, false, 8 * sizeFloat, 5 * sizeFloat);
        gl.drawArrays(gl.TRIANGLES, 0, cuboids.flat(2).length);
    }
}
exports.SkinRenderer = SkinRenderer;