export class Map_U {
    private static Insert<K, V>(m: Map<K, V>, k: K, v: V): V {
        m.set(k, v);
        return v;
    }
    static Get_Or_Insert<K, V>(m: Map<K, V>, k: K, v: V): V {
        return m.get(k) ?? this.Insert(m, k, v);
    }
    static Move<K, V>(m: Map<K, V>, o: K, n: K) {
        if (m.has(n)) throw new Error('Cannot move to a key that is already used');
        const v = m.get(o);
        if (v === undefined) throw new Error('Cannot move from a key that is not used');
        m.set(n, v);
    }
}