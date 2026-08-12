import { MapEditor } from "personal-library/variable-editors/map";
import { Dict, Entry } from "./dict";
import { VariableEditor, VariableEditorSetupInfo } from "personal-library/variable-editors/variable-editor";
import { MapEntry } from "personal-library/variable-editors/generic-map-entry";
import { MapEntryEditor } from "personal-library/variable-editors/map-entry";
import { setIcon, View } from "obsidian";
import { String_Array_Editor, String_Entry_Editor } from "./string-array-editor";
import { String_Option_Editor, StringLineEditor } from "personal-library/variable-editors/primitive";
import { Optional } from "personal-library/variable-editors/shorthand";
import { CreateNewTextDiv } from "personal-library/html-utility";

export class Word_Map_Editor extends MapEditor<Entry> {
    dict: Dict;
    search: () => string[];
    edit_word: (e: MapEntry<string, Entry>) => void;
	protected Initialize_Variables(args: VariableEditorSetupInfo<Map<string, Entry>>): void {
		super.Initialize_Variables(args);
		this.isVertical = true;
	}
	override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<string, Entry>>) {
		return new Word_Entry_Editor(args);
	}
	override CreateNewEntry() {
		const e = new Entry();
        this.dict.add('', e);
        return new MapEntry('', e);
	};
    override IsValidKey(newKey: string, currentKey?: Optional<string>): boolean {
        return super.IsValidKey(newKey, currentKey) || newKey === '';
    }
	override RecalculateDisplayedKeys() {
		return this.search();
	};
    override async MoveInMap(view: View, oldKey: string, newKey: string) {
        if (oldKey === newKey) return;

        this.dict.rename(oldKey, newKey);
        this.displayedKeys.remove(oldKey);

        this.RefreshDisplayedEntries(view);
    }
    protected Provide_Entry_Context(entry: Word_Entry_Editor): void {
        super.Provide_Entry_Context(entry);
        entry.dict = this.dict;
        entry.edit_word = this.edit_word;
    }
}

export class Word_Entry_Editor extends MapEntryEditor<Entry> {
    dict: Dict;
    word_div: HTMLDivElement;
    edit_btn: HTMLButtonElement;
    edit_word: (e: MapEntry<string, Entry>) => void;
    override entryValueEditor: Entry_Editor;
    protected override Initialize_Variables(args: VariableEditorSetupInfo<MapEntry<string, Entry>>): void {
        super.Initialize_Variables(args);
        this.isVertical = true;
    }
	protected override Initialize_DOM_Elements() {
		super.Initialize_DOM_Elements();
		this.div.classList.add('wide');
		this.div.classList.add('tgt-lang-word');
        this.div.classList.add('tgt-lang-box');
		this.div.classList.add('vbox');

        this.keyEditorDiv?.remove();
        this.keyEditorDiv = null;
        
        this.entryValueEditorDiv?.remove();
        this.entryValueEditorDiv = null;

        this.word_div = CreateNewTextDiv(this.div, this.key, 'pointer-hover tgt-lang-box');

        this.edit_btn = this.div.createEl('button');
        setIcon(this.edit_btn, 'pencil');

        let categories = '';
        for (const c of this.value.value.categories) {
            categories += `, ${c}`;
        }
        CreateNewTextDiv(this.div, categories.substring(2), 'tgt-lang-box');

        for (const d of this.value.value.definitions) {
            CreateNewTextDiv(this.div, d);
        }
	}
	protected override Create_HTML_Functionality(view: View): void {
		super.Create_HTML_Functionality(view);
        this.word_div.style.fontFamily = this.dict.font;
        view.registerDomEvent(this.word_div, 'click', () => { navigator.clipboard.writeText(this.key); });
        view.registerDomEvent(this.edit_btn, 'click', () => { this.edit_word(this.value) });
	}
	protected override CreateEntryValueEditor(args: VariableEditorSetupInfo<Entry>): Entry_Editor {
		return new Entry_Editor(args);
	}
}
export class KeyEditor extends StringLineEditor {
    dict: Dict;
    validityIndicator: HTMLDivElement;
    protected override Initialize_Variables(args: VariableEditorSetupInfo<string>): void {
        super.Initialize_Variables(args);
        this.eventName = 'change';
    }
    protected override Initialize_DOM_Elements(): void {
        this.div.classList.add('tgt-lang-box')
        super.Initialize_DOM_Elements();
        this.validityIndicator = this.div.createDiv();
    }
    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);
        view.registerDomEvent(this.input, 'input', () => { this.UpdateValidityIndicator } );
        this.UpdateValidityIndicator();
    }
    async ChangeValue(view: View, newValue: string): Promise<void> {
        await super.ChangeValue(view, newValue);
        this.UpdateValidityIndicator();
    }
    protected IsValidValue(newValue: string): boolean {
        return !this.dict.entries.has(newValue);
    }
    protected UpdateValidityIndicator() {
        const unique = this.value === this.input.value || this.IsValidValue(this.input.value);
        this.validityIndicator.textContent = unique ? 'is a unique word' : 'already exists';
    }
}
export class Entry_Editor extends VariableEditor<Entry> {
    dict: Dict;
    key_editor: KeyEditor;
    category_div: HTMLDivElement;
    definition_div: HTMLDivElement;
    category_editor: Word_Category_Editor;
    definition_editor: Definition_Editor;
    protected override Initialize_DOM_Elements(): void {
        super.Initialize_DOM_Elements();
        this.category_div = this.div.createDiv('tgt-lang-box');
        this.definition_div = this.div.createDiv('tgt-lang-box');
        this.isVertical = true;
    }
    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);
        this.category_editor = new Word_Category_Editor({
			value: this.value.categories,
			parent: this,
			div: this.category_div,
			view: view,
			SetValue: async (newValue: string[]) => { this.value.categories = newValue },
			Save: this.Save
        });
        this.definition_editor = new Definition_Editor({
			value: this.value.definitions,
			parent: this,
			div: this.definition_div,
			view: view,
			SetValue: async (newValue: string[]) => { this.value.definitions = newValue },
			Save: this.Save
        });
    }
    Build(view: View): void {
        super.Build(view);
        this.category_editor.dict = this.dict;
        this.definition_editor.dict = this.dict;
        this.category_editor.Build(view);
        this.definition_editor.Build(view);
    }
}
export class Word_Category_Editor extends String_Array_Editor {
    override parent: Entry_Editor;
    dict: Dict;
    protected override Initialize_Variables(args: VariableEditorSetupInfo<string[]>): void {
        super.Initialize_Variables(args);
        this.isVertical = false;
    }
    override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<number, string>>): Word_Category_Selector {
        return new Word_Category_Selector(args);
    }
}
export class Word_Category_Selector extends String_Entry_Editor {
    override parent: Word_Category_Editor;
	override entryValueEditor: String_Option_Editor;
    protected override Initialize_DOM_Elements() {
		super.Initialize_DOM_Elements();
        this.keyEditorDiv?.remove();
        this.keyEditorDiv = null;
	}
	protected override Create_HTML_Functionality(view: View): void {
		super.Create_HTML_Functionality(view);
		this.ImplementDeleteButton(view);
	}
    protected override CreateEntryValueEditor(args: VariableEditorSetupInfo<string>): String_Option_Editor {
        return new String_Option_Editor(args);
    }
    override Build(view: View): void {
        this.entryValueEditor.options.length = 0;
        for (const c of this.parent.dict.categories) {
            this.entryValueEditor.options.push(c);
        }
        super.Build(view);
    }
}
export class Definition_Editor extends String_Array_Editor {
    override parent: Entry_Editor;
    dict: Dict;
    override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<number, string>>): Definition_Entry_Editor {
        return new Definition_Entry_Editor(args);
    }
}
export class Definition_Entry_Editor extends String_Entry_Editor {
    override parent: Definition_Editor;
	override entryValueEditor: StringLineEditor;
    protected override Initialize_DOM_Elements() {
		super.Initialize_DOM_Elements();
        this.keyEditorDiv?.remove();
        this.keyEditorDiv = null;
	}
	protected override Create_HTML_Functionality(view: View): void {
		super.Create_HTML_Functionality(view);
		this.ImplementDeleteButton(view);
	}
    protected override CreateEntryValueEditor(args: VariableEditorSetupInfo<string>): VariableEditor<string> {
        let first = args.SetValue;
        let second = async (val: string) => {
            await this.parent.dict.re_index(this.parent.parent.key_editor.value, async () => { await first(val); } );
        }
        args.SetValue = second;
        const e = super.CreateEntryValueEditor(args);
        return e;
    }
}