import { View } from "obsidian";
import { GenericMapEntryEditor, MapEntry } from "./generic-map-entry";
import { ArrayEditor } from "./array";
import { VariableEditorSetupInfo } from "./variable-editor";
import { IntegerEditor } from "./primitive";

export abstract class ArrayEntryEditor<T> extends GenericMapEntryEditor<number, T> {
    override parent: ArrayEditor<T>;
    override keyEditor: ArrayIndexEditor;
    get indexEditor(): ArrayIndexEditor {
        return this.keyEditor;
    }

    get index(): number {
        return this.value.key;
    }
    set index(newIndex: number) {
        this.value.key = newIndex;
    }
    
    protected override CreateKeyEditor(args: VariableEditorSetupInfo<number>): ArrayIndexEditor {
        const output = new ArrayIndexEditor(args);
        output.variableName = 'Index';
        return output;
    }

    override async RemoveFromMap(view: View) {
        const index = this.index;

        this.div.remove();
        this.parent.entryEditors.delete(this.index);
        this.parent.value.splice(index, 1);

        // Make all the editors ahead of this one shift their indices back by 1.
        for (let i = index; i < this.parent.value.length; i++) {
            const editorToShift = this.parent.entryEditors.get(i + 1);
            if (editorToShift !== undefined) editorToShift.ShiftIndex(view, -1);
        }
    }
    async ShiftIndex(view: View, direction: 1 | -1) {
        const oldIndex = this.index;
        const newIndex = this.index + direction;

        this.index = newIndex;
        
        this.parent.entryEditors.delete(oldIndex);
        this.parent.entryEditors.set(newIndex, this);

        this.keyEditor.value = newIndex;
        this.keyEditor.input.value = `${newIndex}`;

        await this.onKeyChange.TriggerUpdate(view, oldIndex);
    }
}

export class ArrayIndexEditor extends IntegerEditor {
    override parent: ArrayEntryEditor<any>;
    protected override Initialize_Variables(args: VariableEditorSetupInfo<number>): void {
        super.Initialize_Variables(args);
        this.eventName = 'change';
    }
    protected override IsValidValue(newValue: number): boolean {
        return this.parent.parent.IsValidKey(newValue, this.value);
    }
}