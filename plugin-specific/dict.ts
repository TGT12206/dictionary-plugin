import { Map_U } from "personal-library/utility/map";
import { Set_U } from "personal-library/utility/set";

export class Dict {
    public font: string = '';
    public tx: string = '#ffffff';
    public bd: string = '#8a5cf5';
    public bg: string = '#000000';
    public categories: string[] = [];
    public entries: Map<string, Entry> = new Map();
    public index: Map<string, Set<string>> = new Map();
    public order: string[] = [];
    static tokenize_str(s: string): Set<string> {
        const tokens = new Set<string>();
        if (s.length === 0) return tokens;
        tokens.add(`s(${s.charAt(0)}`);
        for (let i = 0; i < s.length - 1; i++) {
            tokens.add(`${s.charAt(i)}${s.charAt(i + 1)}`);
        }
        tokens.add(`${s.charAt(s.length - 1)})e`);
        return tokens;
    }
    tokenize_entry(word: string) {
        const e = this.entries.get(word);
        if (e === undefined) throw new Error(`Word ${word} not found`);
        return Set_U.union(
            Dict.tokenize_str(word),
            Set_U.union(...e.definitions.map(d => Dict.tokenize_str(d)))
        );
    }
    add(word: string, e: Entry) {
        this.entries.set(word, e);
        for (const t of this.tokenize_entry(word)) {
            Map_U.Get_Or_Insert(this.index, t, new Set()).add(word);
        }
    }
    remove(word: string) {
        for (const t of this.tokenize_entry(word)) {
            this.index.get(t)?.delete(word);
        }
        this.entries.delete(word);
    }
    rename(o: string, n: string) {
        for (const t of this.tokenize_entry(o)) {
            this.index.get(t)?.delete(o);
            this.index.get(t)?.add(n);
        }
        Map_U.Move(this.entries, o, n);
    }
    async re_index(w: string, change: () => Promise<void>) {
        const old = this.tokenize_entry(w);
        for (const t of old) {
            this.index.get(t)?.delete(w);
        }
        await change();
        for (const t of this.tokenize_entry(w)) {
            this.index.get(t)?.add(w);
        }
    }
    search(query: string, categories: string[] | null): string[] {
        const results: Set<string> = new Set();

        if (query === '') {
            for (const e of this.entries) {
                if (this.check_candidate(e[0], categories)) results.add(e[0]);
            }
        } else {
            const tokens = Dict.tokenize_str(query);
            for (const t of tokens) {
                const potential_matches = this.index.get(t);
                if (potential_matches !== undefined) {
                    for (const k of potential_matches) {
                        if (this.check_candidate(k, categories)) results.add(k);
                    }
                }
            }
        }

        return [...results]
            .filter(r => {
                if (query === '') return true;
                if (r.contains(query)) return true;
                return (<Entry> this.entries.get(r)).definitions.contains(query);
            });
    }
    private check_candidate(c: string, categories: string[] | null) {
        let matches = true;
        const e = <Entry> this.entries.get(c);
        if (categories === null) return e.categories.length === 0;
        for (const c of categories) {
            if (!e.categories.includes(c)) matches = false;
        }
        return matches;
    }
    toJSON() {
        return {
            font: this.font,
            tx: this.tx,
            bd: this.bd,
            bg: this.bg,
            categories: this.categories,
            entries: [...this.entries.entries()],
            index: [...this.index.entries()].map(e => [e[0], [...e[1]]])
        }
    }
    static fromJSON(json: string) {
        const data = JSON.parse(json);
        const output = Object.assign(new Dict(), data);
        output.entries = new Map(data.entries);
        output.index = new Map(data.index);
        for (const e of output.index.entries()) {
            output.index.set(e[0], new Set(e[1]));
        }
        return output;
    }
}
export class Entry {
    categories: string[];
    definitions: string[];
    constructor() {
        this.categories = [];
        this.definitions = ['definition'];
    }
}