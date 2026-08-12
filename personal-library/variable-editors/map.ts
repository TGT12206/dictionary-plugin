import { Optional } from "personal-library/variable-editors/shorthand";
import { GenericMap, GenericMapEditor } from "./generic-map";
import { MapEntry } from "./generic-map-entry";
import { MapEntryEditor } from "./map-entry";
import { VariableEditorSetupInfo } from "./variable-editor";
import { View } from "obsidian";

export function GenerateUniqueStringKey(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Creates a visual representation of a map of items
 */
export abstract class MapEditor<V> extends GenericMapEditor<string, V, Map<string, V>> {
    abstract override CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<string, V>>): MapEntryEditor<V>;
    override value: Map<string, V>;
    override entryEditors: Map<string, MapEntryEditor<V>>;
    
    GetEntry(key: string): MapEntry<string, V> {
        const val = this.value.get(key);
        if (val === undefined) throw new Error(key + ' not found');
        return new MapEntry(key, val);
    }
    AddValue(newEntry: MapEntry<string, V>) {
        if (this.IsValidKey(newEntry.key)) this.value.set(newEntry.key, newEntry.value);
    }
    override async MoveInMap(view: View, oldKey: string, newKey: string) {
        if (oldKey === newKey) return;

        const value = <V> this.value.get(oldKey);
        const editor = this.entryEditors.get(oldKey);

        this.value.delete(oldKey);
        this.displayedKeys.remove(oldKey);
        this.entryEditors.delete(oldKey);
        
        this.value.set(newKey, value);
        if (editor !== undefined) {
            this.entryEditors.set(newKey, editor);
            editor.onKeyChange.TriggerUpdate(view, oldKey);
        }

        this.RefreshDisplayedEntries(view);
    }
    override async ChangeValueInMap(view: View, key: string, newVal: V) {
        this.value.set(key, newVal);
    }

    override IsValidKey(newKey: string, currentKey: Optional<string> = null): boolean {
        return !(newKey === currentKey || this.value.has(newKey));
    }
}