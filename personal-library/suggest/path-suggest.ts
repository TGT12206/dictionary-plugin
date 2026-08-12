import { AbstractInputSuggest, prepareFuzzySearch, TFile, View } from "obsidian";

export class PathSuggest extends AbstractInputSuggest<TFile> {
    get vault() {
        return this.app.vault;
    }

    protected async ClassSpecificOnSelect(file: TFile) {}

    constructor(
        view: View,
        public inputEl: HTMLInputElement,
        public OnSelect: (file: TFile) => Promise<void>,
        public accepedExtensions: string[] | null
    ) {
        super(view.app, inputEl);
    }

    getSuggestions(inputStr: string): TFile[] {
        const fuzzyMatcher = prepareFuzzySearch(inputStr);
        const allFiles = this.vault.getFiles();
        return allFiles.filter(
                file => {
                    return this.accepedExtensions === null ? true : this.accepedExtensions.contains(file.extension);
                }
            )
            .map(file => {
                const result = fuzzyMatcher(file.path);
                return result ? { file, score: result.score, matches: result.matches } : null;
            })
            .filter(result => result !== null)
            .sort((a, b) => b.score - a.score)
            .map(result => result.file);
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    override async selectSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent): Promise<void> {
        try {
            await this.OnSelect(file);
            await this.ClassSpecificOnSelect(file);
            this.setValue(file.path);
        } finally {
            this.close();
        }
    }
}