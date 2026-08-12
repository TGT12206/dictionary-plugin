export class Set_U {
    static union<T>(...sets: Set<T>[]): Set<T> {
        const output = new Set<T>();
        for (const set of sets) {
            for (const item of set) {
                output.add(item);
            }
        }
        return output;
    }
}