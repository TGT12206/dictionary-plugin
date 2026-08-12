import { Map_U } from "personal-library/utility/map";
import { Set_U } from "personal-library/utility/set";

export class Dict {
    public font: string = '';
    public num_per_line: number = 5;
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
        }
        Map_U.Move(this.entries, o, n);
        for (const t of this.tokenize_entry(n)) {
            this.index.get(t)?.delete(n);
        }
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
                const e = <Entry> this.entries.get(r);
                for (const d of e.definitions) {
                    if (d.contains(query)) return true;
                }
                return false;
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
        const output: Dict = Object.assign(new Dict(), data);
        output.entries = new Map(data.entries);
        const categoryOrder = output.CategoryOrder;
        for (const e of output.entries.entries()) {
            e[1].categories.sort(categoryOrder);
        }
        output.index = new Map(data.index);
        for (const e of output.index.entries()) {
            output.index.set(e[0], new Set(e[1]));
        }
        return output;
    }
    get WordOrder(): (a: string, b: string) => number {
		const char_value = new Map<string, number>();
		for (let i = 0; i < this.order.length; i++) {
			char_value.set(this.order[i], i);
		}

		const order_fn = (a: string, b: string) => {
			let num1 = char_value.get(a);
			let num2 = char_value.get(b);

			num1 = num1 === undefined ? -1 : num1;
			num2 = num2 === undefined ? -1 : num2;

			if (num1 === -1 && num2 === -1) {
				return a < b ? -1 : a === b ? 0 : 1;
			}

			return num1 - num2;
		}

		return (a: string, b: string) => {
			const arr1 = a.split('');
			const arr2 = b.split('');
			const aIsSmaller = a.length < b.length;
			const min = aIsSmaller ? a.length : b.length;
			for (let i = 0; i < min; i++) {
				const currentDifference = order_fn(arr1[i], arr2[i]);
				if (currentDifference != 0) {
					return currentDifference;
				}
			}
			return aIsSmaller ? -1 : b.length === min ? 0 : 1;
		}
	}
    get CategoryOrder(): (a: string, b: string) => number {
		const char_value = new Map<string, number>();
		for (let i = 0; i < this.categories.length; i++) {
			char_value.set(this.categories[i], i);
		}

		return (a: string, b: string) => {
			let num1 = char_value.get(a);
			let num2 = char_value.get(b);

			num1 = num1 === undefined ? -1 : num1;
			num2 = num2 === undefined ? -1 : num2;

			if (num1 === -1 && num2 === -1) {
				return a < b ? -1 : a === b ? 0 : 1;
			}

			return num1 - num2;
		}
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