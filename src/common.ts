export function createCanvasList(amount: number) {
    var arr = [];
    for (var i = 0; i < amount; i++) {
        arr.push(document.createElement("canvas"));
    }
    return arr;
}

export type PixelColor = [r: number, g: number, b: number, a: number];

export function getPixel(data: Uint8ClampedArray, index: number): PixelColor {
    index *= 4;
    return [
        data[index],
        data[index + 1],
        data[index + 2],
        data[index + 3]
    ];
}

export function vLShift(n: number, shift: number) {
    n = Math.floor(n);
    for (var i = 0; i < shift; i++) {
        n *= 2;
    }
    return n;
}

export function log(name: string, ...args: any[]) {
    var fn = console.log.bind(console,
        `%c %c ${name} %c `,
        "background: #f8a; font-weight: bold;",
        "background: #f58; color: #fff; font-weight: bold;",
        "background: #f8a; font-weight: bold;"
    );
    fn.apply(console, args);
}

export function warn(name: string, ...args: any[]) {
    var fn = console.warn.bind(console,
        `%c %c ${name} %c `,
        "background: #f8a; font-weight: bold;",
        "background: #f58; color: #fff; font-weight: bold;",
        "background: #f8a; font-weight: bold;"
    );
    fn.apply(console, args);
}

export function clamp(val: number, min: number, max: number) {
    return val > max ? max : (val < min ? min : val);
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * clamp(t, 0, 1);
}

export function getPixelHex(data: Uint8ClampedArray, index: number): number {
    // return in ARGB
    var c = getPixel(data, index);
    var hex = vLShift(c[3], 24) + vLShift(c[0], 16) + vLShift(c[1], 8) + c[2];
    return hex;
}