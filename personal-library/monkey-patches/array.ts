export {};

declare global {
    interface ArrayConstructor {
        From_Size<T>(size: number, value: T): T[];
        From_Range(end: number): number[];
        From_Range(start: number, end: number): number[];
    }
}

Object.defineProperty(Array, 'From_Size', {
    value: function<T>(size: number, value: T): T[] {
        return new Array(size).fill(value);
    },
    enumerable: false,
    writable: false,
    configurable: true
});
Object.defineProperty(Array, 'From_Range', {
    value: function(start: number, end?: number): number[] {
        const s = end === undefined ? 0 : start;
        const e = end === undefined ? start : end;
        
        const output = new Array();

        for (let i = s; i < e; i++) {
            output.push(i);
        }
        return output;
    },
    enumerable: false,
    writable: false,
    configurable: true
});