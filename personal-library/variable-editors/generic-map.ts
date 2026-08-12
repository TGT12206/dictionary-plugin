import { Optional } from "personal-library/variable-editors/shorthand";
import { VariableEditor, VariableEditorSetupInfo } from "./variable-editor";
import { GenericMapEntryEditor, MapEntry } from "./generic-map-entry";
import { setIcon, View } from "obsidian";
import { BoxClass } from "personal-library/html-utility";
import { UpdateTrigger } from "personal-library/variable-editors/update-request";

export type GenericMap<K, V> = Map<K, V> | V[];

/**
 * Creates a visual representation of a map of items
 */
export abstract class GenericMapEditor<K, V, mapType extends GenericMap<K, V>> extends VariableEditor<mapType> {
    mapDiv: HTMLDivElement;
    addButton: Optional<HTMLButtonElement>;

    /** If this is > 1, then the entries are arranged in a grid */
    itemsPerLine: number;

    entryEditors: Map<K, GenericMapEntryEditor<K, V>>;

    abstract CreateNewEntryEditor(args: VariableEditorSetupInfo<MapEntry<K, V>>): GenericMapEntryEditor<K, V>;
    abstract CreateNewEntry(): MapEntry<K, V>;

    abstract RecalculateDisplayedKeys(): K[];
    displayedKeys: K[];

    get isGrid(): boolean {
        return this.itemsPerLine > 1;
    }

    /**
     * If true, entries may be inserted or deleted.
     * 
     * defaults to true
     */
    volatileEntries: boolean;

    /** Triggered whenever a new entry has been added to the map */
    onEntryCreation: UpdateTrigger;

    /** Triggered whenever an entry has been removed from the map */
    onEntryDeletion: UpdateTrigger;

    /**
     * Triggered whenever this editor is being refreshed. New editors are
     * created for whatever entries are displayed next.
     */
    onVisibleEntryRefresh: UpdateTrigger;

    protected override Initialize_Variables(args: VariableEditorSetupInfo<mapType>): void {
        super.Initialize_Variables(args);
        this.volatileEntries = true;
        this.itemsPerLine = 1;
        this.entryEditors = new Map();
        this.displayedKeys = [];
        this.onEntryCreation = new UpdateTrigger(this);
        this.onEntryDeletion = new UpdateTrigger(this);
        this.onVisibleEntryRefresh = new UpdateTrigger(this);
    }

    protected override Initialize_DOM_Elements() {
        super.Initialize_DOM_Elements();
        this.div.classList.add(BoxClass(this.isVertical));

        if (this.volatileEntries) {
            this.mapDiv = this.div.createDiv(BoxClass(this.isVertical));
        } else {
            this.mapDiv = this.div;
            this.addButton = null;
        }

        this.div.classList.add('outer-div');
        this.mapDiv.classList.add('outer-div');
        this.mapDiv.classList.add('scroll');

        if (this.isGrid) {
            this.mapDiv.classList.add('grid');
            this.mapDiv.style.setProperty(
                '--num-lines',
                'repeat(' + this.itemsPerLine + ', 1fr)'
            );
        }
    }

    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);
        if (this.volatileEntries) this.CreateAddButton(view);
        this.RefreshDisplayedEntries(view);
    }

    protected CreateAddButton(view: View) {
        this.addButton = this.div.createEl('button', { cls: 'add-button' } );
        setIcon(this.addButton, 'plus');
        if (this.isGrid) {
            this.addButton.detach();
            this.mapDiv.before(this.addButton);
        }

        view.registerDomEvent(this.addButton, 'click', async () => {
            if (this.CreateNewEntry === null) return;

            const newEntry = this.CreateNewEntry();
            this.AddValue(newEntry);
            
            await this.Save();

            this.RefreshDisplayedEntries(view);

            await this.onEntryCreation.TriggerUpdate(view, null);
        });
    }

    RefreshDisplayedEntries(view: View) {
        const prevKeys = this.displayedKeys;
        this.displayedKeys = this.RecalculateDisplayedKeys();

        let displayedEntries = this.displayedKeys.map(k => this.GetEntry(k));

        this.entryEditors.clear();
        this.mapDiv.empty();

        for (const entry of displayedEntries) {
            this.Editor_From_Entry(view, entry);
        }
        this.onVisibleEntryRefresh.TriggerUpdate(view, prevKeys);
    }

    protected Editor_From_Entry(view: View, entry: MapEntry<K, V>) {
        const args: VariableEditorSetupInfo<MapEntry<K, V>> = {
            parent: this,
            value: entry,
            div: this.mapDiv.createDiv('outer-div scroll'),
            view: view,
            SetValue: async (e2: MapEntry<K, V>) => this.MoveInMap(view, entry.key, e2.key),
            Save: this.Save
        }
        const editor = this.CreateNewEntryEditor(args);
        this.entryEditors.set(entry.key, editor);
        this.Provide_Entry_Context(editor);
        editor.Build(view);
        return editor;
    }

    abstract GetEntry(key: K): MapEntry<K, V>;
    abstract AddValue(newEntry: MapEntry<K, V>): void;
    abstract MoveInMap(view: View, oldKey: K, newKey: K): Promise<void>;
    abstract ChangeValueInMap(view: View, key: K, newVal: V): Promise<void>;

    /** Whether or not the new key is valid (maybe it's already taken) */
    abstract IsValidKey(newKey: K, currentKey: Optional<K>): boolean;
    protected Provide_Entry_Context(entry: GenericMapEntryEditor<K, V>) {}
}