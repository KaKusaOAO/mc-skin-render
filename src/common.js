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
