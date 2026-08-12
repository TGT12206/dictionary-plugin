import { View } from "obsidian";
import { ArrayEditor } from "personal-library/variable-editors/array";
import { ArrayEntryEditor } from "personal-library/variable-editors/array-entry";
import { MapEntry } from "personal-library/variable-editors/generic-map-entry";
import { String_Option_Editor, StringLineEditor } from "personal-library/variable-editors/primitive";
import { VariableEditor, VariableEditorSetupInfo } from "personal-library/variable-editors/variable-editor";
import { Dict, Entry } from "./dict";
import { UpdateNotification } from "personal-library/variable-editors/update-request";

export class Category_Array_Editor extends ArrayEditor<string> {
    words: Map<string, Entry>;
    protected Initialize_Variables(args: VariableEditorSetupInfo<string[]>): void {
        super.Initialize_Variables(args);
        this.isVertical = true;
    }
    protected Initialize_DOM_Elements(): void {
        super.Initialize_DOM_Elements();
        this.div.classList.add('wide');
    }
    override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<number, string>>): ArrayEntryEditor<string> {
        return new Category_Entry_Editor(args);
    }
    override CreateNewEntry(): MapEntry<number, string> {
        return new MapEntry(this.value.length, '');
    }
    override RecalculateDisplayedKeys(): number[] {
        return Array.From_Range(this.value.length);
    }
    RefreshDisplayedEntries(view: View): void {
        super.RefreshDisplayedEntries(view);
    }
    protected Provide_Entry_Context(entry: Category_Entry_Editor): void {
        super.Provide_Entry_Context(entry);
        entry.words = this.words;
    }
}
export class Category_Entry_Editor extends ArrayEntryEditor<string> {
    words: Map<string, Entry>;
    override entryValueEditor: StringLineEditor;
    protected override Initialize_DOM_Elements() {
        super.Initialize_DOM_Elements();
        this.div.classList.add('story-line-editor');
        this.div.classList.add('wide');
        this.keyEditorDiv = this.div.createDiv();
        this.entryValueEditorDiv = this.div.createDiv();
        this.InitializeDeleteButton(this.div);
    }
    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);
        this.ImplementDeleteButton(view);
    }
    protected override CreateEntryValueEditor(args: VariableEditorSetupInfo<string>): VariableEditor<string> {
        const e = new StringLineEditor(args);
        e.onChange.Register(this, async (view: View, notification: UpdateNotification) => {
            for (const word of this.words.values()) {
                const i = word.categories.findIndex((v) => v === notification.context);
                if (i !== undefined) word.categories[i] = this.value.value;
            }
        });
        return e;
    }
}
export class Category_Searcher extends ArrayEditor<string> {
    dict: Dict;
    protected Initialize_Variables(args: VariableEditorSetupInfo<string[]>): void {
        super.Initialize_Variables(args);
        this.isVertical = false;
    }
    protected Initialize_DOM_Elements(): void {
        super.Initialize_DOM_Elements();
        this.div.classList.add('wide');
    }
    override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<number, string>>): ArrayEntryEditor<string> {
        return new Category_Entry_Editor(args);
    }
    override CreateNewEntry(): MapEntry<number, string> {
        return new MapEntry(this.value.length, '');
    }
    override RecalculateDisplayedKeys(): number[] {
        return Array.From_Range(this.value.length);
    }
    RefreshDisplayedEntries(view: View): void {
        super.RefreshDisplayedEntries(view);
    }
}
export class Searched_Category extends ArrayEntryEditor<string> {
    override parent: Category_Searcher;
    protected override Initialize_DOM_Elements() {
        super.Initialize_DOM_Elements();
        this.div.classList.add('story-line-editor');
        this.div.classList.add('wide');
        this.entryValueEditorDiv = this.div.createDiv();
        this.InitializeDeleteButton(this.div);
    }
    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);
        this.ImplementDeleteButton(view);
    }
    protected override CreateEntryValueEditor(args: VariableEditorSetupInfo<string>): VariableEditor<string> {
        const e = new String_Option_Editor(args);
        e.options.length = 0;
        for (const c of this.parent.dict.categories) {
            e.options.push(c);
        }
        return e;
    }
}