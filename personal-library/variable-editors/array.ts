import { ArrayEntryEditor } from "./array-entry";
import { GenericMapEditor } from "./generic-map";
import { Optional } from "personal-library/variable-editors/shorthand";
import { VariableEditorSetupInfo } from "./variable-editor";
import { View } from "obsidian";
import { MapEntry } from "./generic-map-entry";

export class ArrayEntry<T> extends MapEntry<number, T> {}
export abstract class ArrayEditor<T> extends GenericMapEditor<number, T, T[]> {
    abstract override CreateNewEntryEditor(args: VariableEditorSetupInfo<ArrayEntry<T>>): ArrayEntryEditor<T>;
    override value: T[];
    override entryEditors: Map<number, ArrayEntryEditor<T>>;
    
    GetEntry(index: number): ArrayEntry<T> {
        return new ArrayEntry(index, this.value[index]);
    }
    AddValue(newEntry: ArrayEntry<T>) {
        this.value.push(newEntry.value);
    }

    override async MoveInMap(view: View, oldKey: number, newKey: number) {
        if (!this.IsValidKey(newKey, oldKey)) return;

        const value = <T> this.value[oldKey];

        this.value.splice(oldKey, 1);
        this.value.splice(newKey, 0, value);

        this.RefreshDisplayedEntries(view);
    }
    override async ChangeValueInMap(view: View, index: number, newVal: T) {
        this.value[index] = newVal;
    }

    override IsValidKey(newKey: number, currentKey: Optional<number> = null): boolean {
        return !(newKey === currentKey || newKey > this.value.length || newKey < 0);
    }

    async ShiftEntryEditorsInRange(view: View, oldIndex: number, newIndex: number) {
        /** The direction that we need to shift things. */
        const direction = oldIndex < newIndex ? -1 : 1;

        const left = direction === -1 ? oldIndex + 1 : newIndex;
        const right = direction === -1 ? newIndex : oldIndex - 1;
        
        // avoids collisions
        if (direction === -1) {
            for (let i = left; i <= right; i++) {
                await this.entryEditors.get(i)?.ShiftIndex(view, direction);
            }
            return;
        }
        for (let i = right; i >= left; i--) {
            await this.entryEditors.get(i)?.ShiftIndex(view, direction);
        }
    }
}