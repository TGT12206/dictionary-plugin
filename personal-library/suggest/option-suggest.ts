import { AbstractInputSuggest, prepareFuzzySearch, View } from "obsidian";

export class Option_Suggest extends AbstractInputSuggest<string> {
    constructor(
        view: View,
        public inputEl: HTMLInputElement,
        public OnSelect: (str: string) => Promise<void>,
        public getOptions: () => string[]
    ) {
        super(view.app, inputEl);
    }
    protected getSuggestions(query: string): string[] | Promise<string[]> {
        const fuzzyMatcher = prepareFuzzySearch(query);
        return this.getOptions()
            .map(o => {
                const result = fuzzyMatcher(o);
                return result ? { file: o, score: result.score, matches: result.matches } : null;
            })
            .filter(result => result !== null)
            .sort((a, b) => b.score - a.score)
            .map(result => result.file);
    }
    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }
    protected async ClassSpecificOnSelect(str: string) {}
    override async selectSuggestion(str: string, evt: MouseEvent | KeyboardEvent): Promise<void> {
        try {
            await this.OnSelect(str);
            await this.ClassSpecificOnSelect(str);
            this.setValue(str);
        } finally {
            this.close();
        }
    }
}