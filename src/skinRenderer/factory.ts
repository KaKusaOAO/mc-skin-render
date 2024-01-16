import { SkinRenderer } from "./base.js";
import { WebGLSkinRenderer } from "./webgl.js";
import { WebGPUSkinRenderer } from "./webgpu.js";

export const SkinRendererFactory = { 
    createPreferred(skin: HTMLImageElement | string, slim: boolean): Promise<SkinRenderer> {
        if (!navigator.gpu) {
            return SkinRendererFactory.createWebGL(skin, slim);
        }

        return SkinRendererFactory.createWebGPU(skin, slim);
    },

    async createWebGL(skin: HTMLImageElement | string, slim: boolean): Promise<WebGLSkinRenderer> {
        return new WebGLSkinRenderer(skin, slim);
    },

    async createWebGPU(skin: HTMLImageElement | string, slim: boolean): Promise<WebGPUSkinRenderer> {
        return new WebGPUSkinRenderer(skin, slim);
    }
}