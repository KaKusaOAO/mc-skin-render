import { clamp, createCanvasList, getPixelHex, lerp, log } from "./common";

export class AvatarRenderer {
    public skinPath: string;
    public skin!: HTMLImageElement;
    public resolution: number;
    public noGrass: boolean = false;

    constructor(skin: HTMLImageElement | string) {
        if (typeof skin === "string") {
            this.skinPath = skin;
        } else if (skin instanceof Image) {
            this.skinPath = skin.src;
            this.skin = skin;
        } else {
            throw new Error("Invalid skin argument")
        }

        this.resolution = 512;
    }

    public async createAvatarCanvas(): Promise<HTMLCanvasElement> {
        return new Promise((resolve, reject) => {
            if (this.skin) {
                if (this.skin.complete) {
                    resolve(this.createAvatarCanvasFromSkin(this.skin));
                    return;
                }
            } else {
                this.skin = new Image();
                this.skin.onload = () => {
                    resolve(this.createAvatarCanvasFromSkin(this.skin));
                };
                this.skin.onerror = err => {
                    var canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 64;
                    var ctx = canvas.getContext("2d")!;
                    ctx.fillStyle = "#f0f";
                    ctx.fillRect(0, 0, 64, 64);
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillRect(32, 32, 32, 32);
                    // @ts-ignore
                    resolve(this.createAvatarCanvasFromSkin(canvas));
                }
                this.skin.src = this.skinPath;
            }
        });
    }

    public createAvatarCanvasFromSkin(skin: HTMLImageElement): HTMLCanvasElement {
        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = this.resolution;

        var ctx = canvas.getContext("2d")!;
        this.drawAvatar(ctx, skin);
        return canvas;
    }

    public drawAvatar(ctx: CanvasRenderingContext2D, skin: HTMLImageElement) {
        var skinCanvas = document.createElement("canvas");
        var skinCtx = skinCanvas.getContext("2d")!;
        skinCtx.canvas.width = skin.width;
        skinCtx.canvas.height = skin.height;
        skinCtx.drawImage(skin, 0, 0);

        var grassData = skinCtx.getImageData(60, 0, 4, 1).data;
        var isGrass = false;
        if (!this.noGrass) {
            if (getPixelHex(grassData, 3) == 0xff3acb28 &&
                getPixelHex(grassData, 2) == 0xfff9ca8b &&
                getPixelHex(grassData, 1) == 0xffff859b) {
                isGrass = true;
                log("AvatarRenderer", `Applying grass modification for skin ${skin.src}...`);
            }
        }

        var canvasList = createCanvasList(3).map(c => {
            c.width = c.height = 8;
            return c;
        });

        var [inner, outer, outerBack] = canvasList;
        var [iCtx, oCtx, oBackCtx] = canvasList.map(c => c.getContext("2d")!);
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

            var [stemCtx, leafConnCtx, lLeafCtx, rLeafCtx] = stemCanvasList.map(c => c.getContext("2d")!);
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