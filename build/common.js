export function createCanvasList(amount) {
    var arr = [];
    for (var i = 0; i < amount; i++) {
        arr.push(document.createElement("canvas"));
    }
    return arr;
}
export function getPixel(data, index) {
    index *= 4;
    return [
        data[index],
        data[index + 1],
        data[index + 2],
        data[index + 3]
    ];
}
export function vLShift(n, shift) {
    n = Math.floor(n);
    for (var i = 0; i < shift; i++) {
        n *= 2;
    }
    return n;
}
export function log(name, ...args) {
    var fn = console.log.bind(console, `%c %c ${name} %c `, "background: #f8a; font-weight: bold;", "background: #f58; color: #fff; font-weight: bold;", "background: #f8a; font-weight: bold;");
    fn.apply(console, args);
}
export function clamp(val, min, max) {
    return val > max ? max : (val < min ? min : val);
}
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}
export function getPixelHex(data, index) {
    // return in ARGB
    var c = getPixel(data, index);
    var hex = vLShift(c[3], 24) + vLShift(c[0], 16) + vLShift(c[1], 8) + c[2];
    return hex;
}
//# sourceMappingURL=common.js.map