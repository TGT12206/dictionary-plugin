import { UpdateTrigger } from "personal-library/variable-editors/update-request";
import { GenericMapEditor } from "./generic-map";
import { VariableEditor, VariableEditorSetupInfo } from "./variable-editor";
import { setIcon, View } from "obsidian";
import { Optional } from "personal-library/variable-editors/shorthand";
import { OUTER_DIV } from "personal-library/css-classes";

export class MapEntry<K, V> {
    constructor(
        public key: K,
        public value: V
    ) {}
}

export abstract class GenericMapEntryEditor<K, V> extends VariableEditor<MapEntry<K, V>> {
    override parent: GenericMapEditor<K, V, any>;
    deleteButton: Optional<HTMLButtonElement>;

    keyEditorDiv: Optional<HTMLDivElement>;
    keyEditor: VariableEditor<K>;
    
    entryValueEditorDiv: Optional<HTMLDivElement>;
    entryValueEditor: VariableEditor<V>;

    get key(): K {
        return this.value.key;
    }
    set key(newKey: K) {
        this.value.key = newKey;
    }

    /** This entry has moved to a new key */
    onKeyChange: UpdateTrigger;

    /** This entry has moved to a new key */
    onEntryValueChange: UpdateTrigger;

    /** This entry has been deleted */
    onDelete: UpdateTrigger;

    protected override Initialize_Variables(args: VariableEditorSetupInfo<MapEntry<K, V>>): void {
        super.Initialize_Variables(args);
        this.onKeyChange = new UpdateTrigger(this);
        this.onEntryValueChange = new UpdateTrigger(this);
        this.onDelete = new UpdateTrigger(this);
        this.deleteButton = null;
    }

    protected override Initialize_DOM_Elements(): void {
        super.Initialize_DOM_Elements();
        this.div.classList.add(OUTER_DIV);
    }

    protected override Construct_Children(view: View): void {
        super.Construct_Children(view);
        this.ConstructKeyEditor(view);
        this.ConstructEntryValueEditor(view);
    }
    
    override Build(view: View): void {
        super.Build(view);
        if (this.keyEditorDiv !== null) this.keyEditor.Build(view);
        if (this.entryValueEditorDiv !== null) this.entryValueEditor.Build(view);
    }

    private ConstructKeyEditor(view: View) {
        if (this.keyEditorDiv === null) return;

        const args: VariableEditorSetupInfo<K> = {
            parent: this,
            value: this.key,
            div: this.keyEditorDiv,
            view: view,
            SetValue: async (k: K) => await this.UpdateKey(view, k),
            Save: this.Save
        }
        this.keyEditor = this.CreateKeyEditor(args);
    }

    private ConstructEntryValueEditor(view: View) {
        if (this.entryValueEditorDiv === null) return;

        const args: VariableEditorSetupInfo<V> = {
            parent: this,
            value: this.value.value,
            div: this.entryValueEditorDiv,
            view: view,
            SetValue: async (v: V) => {
                await this.UpdateEntryValue(view, v);
            },
            Save: this.Save
        }
        this.entryValueEditor = this.CreateEntryValueEditor(args);
    }

    protected abstract CreateKeyEditor(args: VariableEditorSetupInfo<K>): VariableEditor<K>;
    protected abstract CreateEntryValueEditor(args: VariableEditorSetupInfo<V>): VariableEditor<V>;

    /**
     * Creates a button with a trash can.
     */
    protected InitializeDeleteButton(
        div: HTMLDivElement
    ) {
        this.deleteButton = div.createEl('button');
        this.deleteButton.classList.add('remove-button');
        setIcon(this.deleteButton, 'trash-2');
    }

    /**
     * Creates a button that deletes the entry from the map.
     */
    protected ImplementDeleteButton(
        view: View
    ) {
        if (this.deleteButton === null) return;
        view.registerDomEvent(this.deleteButton, 'click', async () => {
            await this.Remove(view);
        });
    }

    async Remove(view: View) {
        const key = this.value.key;
        
        await this.RemoveFromMap(view);
        await this.Save();

        await this.parent.onEntryDeletion.TriggerUpdate(view, key);
        await this.onDelete.TriggerUpdate(view, key);
    }

    abstract RemoveFromMap(view: View): Promise<void>;

    private async UpdateKey(view: View, newKey: K) {
        const oldKey = this.key;
        await this.parent.MoveInMap(view, oldKey, newKey);
        this.key = newKey;
        await this.onKeyChange.TriggerUpdate(view, oldKey);
    }
    private async UpdateEntryValue(view: View, newValue: V) {
        const oldValue = this.value.value;
        await this.parent.ChangeValueInMap(view, this.value.key, newValue);
        this.value.value = newValue;
        await this.onEntryValueChange.TriggerUpdate(view, oldValue);
    }
}