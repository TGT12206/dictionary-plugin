import { View } from "obsidian";
import { GenericMapEntryEditor, MapEntry } from "./generic-map-entry";
import { MapEditor } from "./map";
import { StringLineEditor } from "./primitive";
import { VariableEditorSetupInfo } from "./variable-editor";

export abstract class MapEntryEditor<V> extends GenericMapEntryEditor<string, V> {
    override parent: MapEditor<V>;
    override keyEditor: MapKeyEditor;
    
    protected override CreateKeyEditor(args: VariableEditorSetupInfo<string>): MapKeyEditor {
        const output = new MapKeyEditor(args);
        output.variableName = 'Key';
        return output;
    }

    override async RemoveFromMap(view: View) {
        this.div.remove();
        this.parent.entryEditors.delete(this.key);
        this.parent.displayedKeys = this.parent.displayedKeys.filter(k => k !== this.key);
        this.parent.value.delete(this.key);
    }
}

export class MapKeyEditor extends StringLineEditor {
    override parent: MapEntryEditor<any>;
    protected override Initialize_Variables(args: VariableEditorSetupInfo<string>): void {
        super.Initialize_Variables(args);
        this.eventName = 'change';
    }
    protected override IsValidValue(newValue: string): boolean {
        return this.parent.parent.IsValidKey(newValue, this.value);
    }
}
