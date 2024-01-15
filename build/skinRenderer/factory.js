import { WebGLSkinRenderer } from "./webgl.js";
import { WebGPUSkinRenderer } from "./webgpu.js";
export const SkinRendererFactory = {
    createPreferred(skin, slim) {
        if (!navigator.gpu) {
            return SkinRendererFactory.createWebGL(skin, slim);
        }
        return SkinRendererFactory.createWebGPU(skin, slim);
    },
    async createWebGL(skin, slim) {
        return new WebGLSkinRenderer(skin, slim);
    },
    async createWebGPU(skin, slim) {
        return new WebGPUSkinRenderer(skin, slim);
    }
};
//# sourceMappingURL=factory.js.map