function __KInitCommonLib() {
    var $ = {};

    /**
     * @param {number} amount 
     * @returns {HTMLCanvasElement[]}
     */
    function createCanvasList(amount) {
        var arr = [];
        for (var i = 0; i < amount; i++) {
            arr.push(document.createElement("canvas"));
        }
        return arr;
    }
    $.createCanvasList = createCanvasList;

    /**
     * 
     * @param {Uint8ClampedArray} data 
     * @param {number} index 
     * @return {[r: number, g: number, b: number, a: number]}
     */
    function getPixel(data, index) {
        index *= 4;
        return [
            data[index],
            data[index + 1],
            data[index + 2],
            data[index + 3]
        ];
    }
    $.getPixel = getPixel;

    function vLShift(n, shift) {
        n = Math.floor(n);
        for (var i = 0; i < shift; i++) {
            n *= 2;
        }
        return n;
    }
    $.vLShift = vLShift;

    function log(name, ...args) {
        var fn = console.log.bind(console,
            `%c %c ${name} %c `,
            "background: #f8a; font-weight: bold;",
            "background: #f58; color: #fff; font-weight: bold;",
            "background: #f8a; font-weight: bold;"
        );
        fn.apply(console, args);
    }
    $.log = log;

    function clamp(val, min, max) {
        return val > max ? max : (val < min ? min : val);
    }
    $.clamp = clamp;

    function lerp(a, b, t) {
        return a + (b - a) * clamp(t, 0, 1);
    }
    $.lerp = lerp;

    /**
     * 
     * @param {Uint8ClampedArray} data 
     * @param {number} index 
     * @return {number}
     */
    function getPixelHex(data, index) {
        // return in ARGB
        var c = getPixel(data, index);
        var hex = vLShift(c[3], 24) + vLShift(c[0], 16) + vLShift(c[1], 8) + c[2];
        return hex;
    }
    $.getPixelHex = getPixelHex;

    return $;
}

($ => {
    var {
        createCanvasList, getPixelHex, log, clamp, lerp
    } = __KInitCommonLib();

    class AvatarRenderer {
        constructor(skin) {
            if (typeof skin === "string") {
                this.skinPath = skin;
            } else if (skin instanceof Image) {
                this.skinPath = skin.src;
                this.skin = skin;
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
                } else {
                    this.skin = new Image();
                    this.skin.src = this.skinPath;
                }

                var image = this.skin;
                image.onload = () => {
                    resolve(this.createAvatarCanvasFromSkin(image));
                };
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
            skinCtx.width = skin.width;
            skinCtx.height = skin.height;
            skinCtx.drawImage(skin, 0, 0);

            var grassData = skinCtx.getImageData(60, 0, 4, 1).data;
            var isGrass = false;
            if (getPixelHex(grassData, 3) == 0xff3acb28 &&
                getPixelHex(grassData, 2) == 0xfff9ca8b &&
                getPixelHex(grassData, 1) == 0xffff859b) {
                isGrass = true;
                log("AvatarRenderer", `Applying grass modification for skin ${skin.src}...`);
            }

            var canvasList = createCanvasList(3).map(c => {
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
                var stemCanvasList = createCanvasList(4);
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
                var leafHeightMult = Math.sin(Math.PI * 2 / 360 * clamp(leafAngle, 0, 90));
                var leafWidthMult = 0.75;
                leafHeightMult = clamp(leafHeightMult, 0, 1);
                var skewAmount = lerp(0.4, 0, leafHeightMult);

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

    $.AvatarRenderer = AvatarRenderer;
})(window);

($ => {
    var {
        log, lerp, getPixelHex, getPixel
    } = __KInitCommonLib();

    var m4 = {

        perspective: function (fieldOfViewInRadians, aspect, near, far) {
            var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
            var rangeInv = 1.0 / (near - far);

            return [
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (near + far) * rangeInv, -1,
                0, 0, near * far * rangeInv * 2, 0,
            ];
        },

        projection: function (width, height, depth) {
            // Note: This matrix flips the Y axis so 0 is at the top.
            return [
                2 / width, 0, 0, 0,
                0, -2 / height, 0, 0,
                0, 0, 2 / depth, 0,
                -1, 1, 0, 1,
            ];
        },

        multiply: function (a, b) {
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
        },

        multiplyVertex: function (a, b) {
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
        },

        translation: function (tx, ty, tz) {
            return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                tx, ty, tz, 1,
            ];
        },

        xRotation: function (angleInRadians) {
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);

            return [
                1, 0, 0, 0,
                0, c, s, 0,
                0, -s, c, 0,
                0, 0, 0, 1,
            ];
        },

        yRotation: function (angleInRadians) {
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);

            return [
                c, 0, -s, 0,
                0, 1, 0, 0,
                s, 0, c, 0,
                0, 0, 0, 1,
            ];
        },

        zRotation: function (angleInRadians) {
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);

            return [
                c, s, 0, 0,
                -s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ];
        },

        scaling: function (sx, sy, sz) {
            return [
                sx, 0, 0, 0,
                0, sy, 0, 0,
                0, 0, sz, 0,
                0, 0, 0, 1,
            ];
        },

        translate: function (m, tx, ty, tz) {
            return m4.multiply(m, m4.translation(tx, ty, tz));
        },

        xRotate: function (m, angleInRadians) {
            return m4.multiply(m, m4.xRotation(angleInRadians));
        },

        yRotate: function (m, angleInRadians) {
            return m4.multiply(m, m4.yRotation(angleInRadians));
        },

        zRotate: function (m, angleInRadians) {
            return m4.multiply(m, m4.zRotation(angleInRadians));
        },

        scale: function (m, sx, sy, sz) {
            return m4.multiply(m, m4.scaling(sx, sy, sz));
        },

        inverse: function (m) {
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
        },

        cross: function (a, b) {
            return [
                a[1] * b[2] - a[2] * b[1],
                a[2] * b[0] - a[0] * b[2],
                a[0] * b[1] - a[1] * b[0],
            ];
        },

        subtractVectors: function (a, b) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        },

        normalize: function (v) {
            var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            // make sure we don't divide by 0.
            if (length > 0.00001) {
                return [v[0] / length, v[1] / length, v[2] / length];
            } else {
                return [0, 0, 0];
            }
        },

        lookAt: function (cameraPosition, target, up) {
            var zAxis = m4.normalize(
                m4.subtractVectors(cameraPosition, target));
            var xAxis = m4.normalize(m4.cross(up, zAxis));
            var yAxis = m4.normalize(m4.cross(zAxis, xAxis));

            return [
                xAxis[0], xAxis[1], xAxis[2], 0,
                yAxis[0], yAxis[1], yAxis[2], 0,
                zAxis[0], zAxis[1], zAxis[2], 0,
                cameraPosition[0],
                cameraPosition[1],
                cameraPosition[2],
                1,
            ];
        },

        transformVector: function (m, v) {
            var dst = [];
            for (var i = 0; i < 4; ++i) {
                dst[i] = 0.0;
                for (var j = 0; j < 4; ++j) {
                    dst[i] += v[j] * m[j * 4 + i];
                }
            }
            return dst;
        },

    };

    /**
     * 
     * @param {WebGLRenderingContext | WebGL2RenderingContext} gl 
     * @param {number} type 
     * @param {*} source 
     */
    function createShader(gl, type, source) {
        var handle = gl.createShader(type);
        if (!handle) throw new Error("Failed to create a handle for a new shader");

        gl.shaderSource(handle, source);
        gl.compileShader(handle);

        if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
            throw new Error("Failed to compile shader: " + gl.getShaderInfoLog(handle));
        }

        return handle;
    }

    /**
     * 
     * @param {WebGLRenderingContext | WebGL2RenderingContext} gl 
     */
    function createProgram(gl, vertexShader, fragShader) {
        var handle = gl.createProgram();
        if (!handle) throw new Error("Failed to create a handle for a new program");

        gl.attachShader(handle, vertexShader);
        gl.attachShader(handle, fragShader);
        gl.linkProgram(handle);

        if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
            throw new Error("Failed to link program: " + gl.getProgramInfoLog(handle));
        }

        return handle;
    }

    class SkinRenderer {
        constructor(skin, slim) {
            this.isSlim = slim;
            if (typeof skin === "string") {
                this.skinPath = skin;

                var img = new Image();
                img.src = skin;
                this.skin = img;
            } else if (skin instanceof Image) {
                this.skinPath = skin.src;
                this.skin = skin;
            }

            this.uniforms = {};
            this.attributes = {};

            this.noGrass = false;
            this.noAnim = false;

            this.isGrass = false;
            this.modifyInnerHead = false;
            this.modifyOuterHead = false;

            this.seed = Math.random() * 20480;
        }

        parseTexture() {
            var skinCanvas = document.createElement("canvas");
            var skinCtx = skinCanvas.getContext("2d");
            var skin = this.skin;
            skinCtx.width = skin.width;
            skinCtx.height = skin.height;
            skinCtx.drawImage(skin, 0, 0);

            var grassData = skinCtx.getImageData(60, 0, 4, 1).data;
            var isGrass = false;

            var modifyInnerHead = false;
            var modifyOuterHead = false;
            var validModifier = true;

            if (getPixelHex(grassData, 3) == 0xff3acb28 &&
                getPixelHex(grassData, 2) == 0xfff9ca8b &&
                getPixelHex(grassData, 1) == 0xffff859b) {
                isGrass = true;
                log("SkinParse", `Identified valid grass skin: ${skin.src}...`);

                var modifier = getPixel(grassData, 0);
                if (modifier[3] == 0xff && modifier[0] == 0xff) {
                    if (modifier[1] == 0xfe) {
                        log("SkinParse", `Will modify inner head UV for this skin`);
                        modifyInnerHead = true;
                    } else {
                        validModifier = modifier[1] == 0xff;
                    }

                    if (modifier[2] == 0xfe) {
                        log("SkinParse", `Will modify outer head UV for this skin`);
                        modifyOuterHead = true;
                    } else {
                        validModifier = validModifier && modifier[2] == 0xff;
                    }
                }
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
            if (!gl) throw new Error("WebGL is not supported");
            this.context = gl;

            var vertexShaderSource = `#version 300 es
            in vec3 aPos;
            in vec2 aTexCoord;
            
            uniform mat4 uMatrix;

            out vec2 vTexCoord;
            
            void main() {
                gl_Position = uMatrix * vec4(aPos, 1);
                vTexCoord = aTexCoord;
            }            
            `;

            var fragShaderSource = `#version 300 es
            precision highp float;
            
            uniform sampler2D uTexture;
            in vec2 vTexCoord;
            out vec4 outColor;
            
            void main() {
                outColor = texture(uTexture, vTexCoord);
                if (outColor.a == .0) discard;
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
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([
                    255, 0, 255, 255,
                    0, 0, 0, 255,
                    0, 0, 0, 255,
                    255, 0, 255, 255,
                ]));

            var loadTexture = () => {
                requestAnimationFrame(() => {
                    this.parseTexture();

                    log("SkinRenderer", "Uploading texture data: " + this.skin.src);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.skin);
                    
                    // This is required
                    gl.generateMipmap(gl.TEXTURE_2D);
                });
            }

            if (this.skin.complete) {
                loadTexture();
            } else {
                this.skin.onload = () => loadTexture();
            }

            this.texture = tex;

            var program = this.program;
            var uniforms = this.uniforms;
            var attrs = this.attributes;
            uniforms.matrix = gl.getUniformLocation(program, "uMatrix");
            uniforms.texture = gl.getUniformLocation(program, "uTexture");
            attrs.pos = gl.getAttribLocation(program, "aPos");
            attrs.uv = gl.getAttribLocation(program, "aTexCoord");
            gl.uniform1i(uniforms.texture, tex);

            var vertexBuffer = gl.createBuffer();
            this.vertexBuffer = vertexBuffer;

            this.canvas = canvas;
            return canvas;
        }

        render() {
            var angle = (this.noAnim ? 195 : (Math.sin(performance.now() / 1000) * 30 + 180)) * Math.PI / 180;
            var camTx = Math.sin(angle) * 50;
            var camTy = 24;
            var camTz = Math.cos(angle) * 50;

            var animDuration = 160;
            var walkAnim = this.noAnim ? 0 : lerp(0, 1, Math.abs(Math.sin(this.seed + performance.now() / animDuration))) * Math.PI;
            var globalTranslate = [0, walkAnim, 0];

            /**
             * @typedef {[x: number, y: number, z: number, u: number, v: number]} Vertex
             * @param {number} x 
             * @param {number} y 
             * @param {number} z 
             * @param {number} u 
             * @param {number} v 
             * @returns {Vertex}
             */
            function createVertex(x, y, z, u, v) {
                return [x, y, z, u / 64, v / 64];
            }

            /**
             * @typedef {[a: Vertex, b: Vertex, c: Vertex]} Triangle
             * @typedef {Triangle[]} Cuboid
             * @param {[x: number, y: number, z: number]} position 
             * @param {[width: number, height: number, depth: number]} size
             * @param {[u: number, v: number]} uv
             * @param {number} dilation 
             * @param {{ grassUvMod?: boolean }?} options 
             * @returns {Cuboid}
             */
            function createCuboid([x, y, z], [width, height, depth], [u, v], dilation, options) {
                dilation ??= 0;
                options ??= {
                    grassUvMod: false
                };

                var dh = dilation / 2;
                var { grassUvMod } = options;

                var result = [
                    // Left
                    [
                        createVertex(x - dh, y + height + dh,   z + depth + dh,  u,          v + depth),
                        createVertex(x - dh, y - dh,            z + depth + dh,  u,          v + depth + height),
                        createVertex(x - dh, y + height + dh,   z - dh,          u + depth,  v + depth),
                    ],
                    [
                        createVertex(x - dh, y + height + dh,   z - dh,          u + depth,  v + depth),
                        createVertex(x - dh, y - dh,            z + depth + dh,  u,          v + depth + height),
                        createVertex(x - dh, y - dh,            z - dh,          u + depth,  v + depth + height),
                    ],

                    // Front
                    [
                        createVertex(x - dh,            y + height + dh,    z - dh, u + depth, v + depth),
                        createVertex(x - dh,            y - dh,             z - dh, u + depth, v + depth + height),
                        createVertex(x + width + dh,    y + height + dh,    z - dh, u + depth + width, v + depth),
                    ],
                    [
                        createVertex(x + width + dh,    y + height + dh,    z - dh, u + depth + width, v + depth),
                        createVertex(x - dh,            y - dh,             z - dh, u + depth, v + depth + height),
                        createVertex(x + width + dh,    y - dh,             z - dh, u + depth + width, v + depth + height),
                    ],

                    // Back
                    [
                        createVertex(x - dh,            y + height + dh,    z + depth + dh, u + depth * 2 + width * 2, v + depth),
                        createVertex(x + width + dh,    y + height + dh,    z + depth + dh, u + depth * 2 + width, v + depth),
                        createVertex(x - dh,            y - dh,             z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
                    ],
                    [
                        createVertex(x + width + dh,    y + height + dh,    z + depth + dh, u + depth * 2 + width, v + depth),
                        createVertex(x + width + dh,    y - dh,             z + depth + dh, u + depth * 2 + width, v + depth + height),
                        createVertex(x - dh,            y - dh,             z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
                    ],

                    // Right
                    [
                        createVertex(x + width + dh, y + height + dh,   z + depth + dh,  u + depth + width,          v + depth),
                        createVertex(x + width + dh, y + height + dh,   z - dh,          u + depth + width + depth,  v + depth),
                        createVertex(x + width + dh, y - dh,            z + depth + dh,  u + depth + width,          v + depth + height),
                    ],
                    [
                        createVertex(x + width + dh, y + height + dh,   z - dh,          u + depth + width + depth,  v + depth),
                        createVertex(x + width + dh, y - dh,            z - dh,          u + depth + width + depth,  v + depth + height),
                        createVertex(x + width + dh, y - dh,            z + depth + dh,  u + depth + width,          v + depth + height),
                    ],

                    // Top
                    [
                        createVertex(x - dh,         y + height + dh, z + depth + dh,   u + (grassUvMod ? 0 : depth),          v),
                        createVertex(x - dh,         y + height + dh, z - dh,           u + (grassUvMod ? 0 : depth),          v + depth),
                        createVertex(x + width + dh, y + height + dh, z + depth + dh,   u + (grassUvMod ? 0 : depth) + width,  v),
                    ],
                    [
                        createVertex(x - dh,         y + height + dh, z - dh,           u + (grassUvMod ? 0 : depth),          v + depth),
                        createVertex(x + width + dh, y + height + dh, z - dh,           u + (grassUvMod ? 0 : depth) + width,  v + depth),
                        createVertex(x + width + dh, y + height + dh, z + depth + dh,   u + (grassUvMod ? 0 : depth) + width,  v),
                    ],

                    // Bottom
                    [
                        createVertex(x - dh,         y - dh, z + depth + dh,   u + width + depth,          v),
                        createVertex(x + width + dh, y - dh, z + depth + dh,   u + width + depth + width,  v),
                        createVertex(x - dh,         y - dh, z - dh,           u + width + depth,          v + depth),
                    ],
                    [
                        createVertex(x - dh,         y - dh, z - dh,           u + width + depth,          v + depth),
                        createVertex(x + width + dh, y - dh, z + depth + dh,   u + width + depth + width,  v),
                        createVertex(x + width + dh, y - dh, z - dh,           u + width + depth + width,  v + depth),
                    ]
                ];

                result.center = [
                    x + width / 2,
                    y + height / 2,
                    z + depth / 2
                ];
                return result;
            }

            function transformBone(bone, mat) {
                if (bone.recursive) {
                    throw new Error("Recursive bone setting detected!");
                }

                mat ??= m4.translation(globalTranslate[0], globalTranslate[1], globalTranslate[2]);
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
                bone.children.forEach(b => transformBone(b, matrix));
                bone.recursive = false;
            }

            /**
             * @typedef {{}} Bone
             * @typedef {cuboids: Cuboid[], pivot: [x: number, y: number, z: number], rotation: [x: number, y: number, z: number], children: Bone[]} Bone
             * @param {Cuboid[]} cuboids 
             * @param {[x: number, y: number, z: number]} pivot 
             * @param {[x: number, y: number, z: number]} rotation 
             * @param {Bone[]} children 
             * @returns 
             */
            function createBone(cuboids, pivot, rotation, children) {
                pivot ??= [0, 0, 0];
                rotation ??= [0, 0, 0];
                children ??= [];
                return { cuboids, pivot, rotation, children };
            }

            var yOffset = -20;
            var anim = this.noAnim ? -Math.PI / 4 : lerp(-1, 1, Math.sin(this.seed + performance.now() / animDuration) / 2 + 0.5) * Math.PI / 2.5;
            var headAnim = this.noAnim ? -Math.PI / 4 : lerp(-1, 1, Math.sin(this.seed + performance.now() / animDuration * 2) / 2 + 0.5) * Math.PI / 2.5;
            var headRot = [-headAnim * 0.125, anim * 0.125, 0];
            var outerDilation = 0.5;

            var headBone = createBone([
                // Head (inner / outer)
                createCuboid([-4, 0, -4], [8, 8, 8], [0, 0], 0, { grassUvMod: !this.noGrass && this.modifyInnerHead }),
                createCuboid([-4, 0, -4], [8, 8, 8], [32, 0], outerDilation * 2, { grassUvMod: !this.noGrass && this.modifyOuterHead })
            ], [0, yOffset + 24, 0], headRot);

            var bones = [
                headBone,

                createBone([    
                    // Body (inner / outer)
                    createCuboid([-4, 0, -2], [8, 12, 4], [16, 16], 0.01),
                    createCuboid([-4, 0, -2], [8, 12, 4], [16, 32], 0.01 + outerDilation)
                ], [0, yOffset + 12, 0]),

                createBone([
                    // Left leg (inner / outer)
                    createCuboid([-2, -12, -2], [4, 12, 4], [0, 16], 0),
                    createCuboid([-2, -12, -2], [4, 12, 4], [0, 32], outerDilation),
                ], [-2, yOffset + 12, 0], [-anim, 0, 0]),

                createBone([
                    // Right leg (inner / outer)
                    createCuboid([-2, -12, -2], [4, 12, 4], [16, 48], 0),
                    createCuboid([-2, -12, -2], [4, 12, 4], [0, 48], outerDilation),
                ], [2, yOffset + 12, 0], [anim, 0, 0]),

                createBone([
                    // Left arm (inner / outer)
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [40, 16], 0),
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [40, 32], outerDilation),
                ], [this.isSlim ? -5 : -6, yOffset + 24, 0], [anim, 0, 0]),

                createBone([
                    // Right arm (inner / outer)
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [32, 48], 0),
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [48, 48], outerDilation),
                ], [6, yOffset + 24, 0], [-anim, 0, 0]),
            ];

            if (!this.noGrass && this.isGrass) {
                headBone.cuboids.push(
                    createCuboid([-0.5, 8, -0.5], [1, 4, 0], [62, 42], 0.001)
                );

                headBone.children.push(
                    createBone([
                        createCuboid([-1, -0.5, 0], [2, 1, 0], [60, 40], 0.001)
                    ], [0, 12, -0.5], [37.5 * Math.PI / 180, 0, 0], [
                        createBone([
                            createCuboid([-3, -1.5, 0], [3, 3, 0], [58, 32], 0.01)
                        ], [-1, 0, 0], [0, -17.5 * Math.PI / 180, 0]),
                        createBone([
                            createCuboid([0, -1.5, 0], [3, 3, 0], [58, 36], 0.01)
                        ], [1, 0, 0], [0, 17.5 * Math.PI / 180, 0])
                    ])
                );
            }

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
                return Math.sqrt(
                    Math.pow(a[0] - b[0], 2) + 
                    Math.pow(a[1] - b[1], 2) + 
                    Math.pow(a[2] - b[2], 2)
                );
            }


            /** @type {Bone[]} */
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
            // cuboids.push(createCuboid([-100, -23, -100], [200, 1, 200], [0, 0]));

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
            
            // Texture filters
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            var vertexBuffer = this.vertexBuffer;
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cuboids.flat(3)), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(attrs.pos);
            gl.enableVertexAttribArray(attrs.uv);
            var sizeFloat = Float32Array.BYTES_PER_ELEMENT;
            gl.vertexAttribPointer(attrs.pos, 3, gl.FLOAT, false, 5 * sizeFloat, 0);
            gl.vertexAttribPointer(attrs.uv, 2, gl.FLOAT, false, 5 * sizeFloat, 3 * sizeFloat);
            gl.drawArrays(gl.TRIANGLES, 0, cuboids.flat(2).length);
        }
    }

    $.SkinRenderer = SkinRenderer;
})(window);
