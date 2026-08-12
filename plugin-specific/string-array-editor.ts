import { View } from "obsidian";
import { ArrayEditor } from "personal-library/variable-editors/array";
import { ArrayEntryEditor } from "personal-library/variable-editors/array-entry";
import { MapEntry } from "personal-library/variable-editors/generic-map-entry";
import { StringLineEditor } from "personal-library/variable-editors/primitive";
import { VariableEditor, VariableEditorSetupInfo } from "personal-library/variable-editors/variable-editor";

export class String_Array_Editor extends ArrayEditor<string> {
	protected Initialize_Variables(args: VariableEditorSetupInfo<string[]>): void {
		super.Initialize_Variables(args);
		this.isVertical = true;
	}
	protected Initialize_DOM_Elements(): void {
		super.Initialize_DOM_Elements();
        this.div.classList.add('wide');
	}
    override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<number, string>>): ArrayEntryEditor<string> {
        return new String_Entry_Editor(args);
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
export class String_Entry_Editor extends ArrayEntryEditor<string> {
	override entryValueEditor: StringLineEditor;
    protected override Initialize_DOM_Elements() {
		super.Initialize_DOM_Elements();
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
        return new StringLineEditor(args);
    }
}