import { View } from "obsidian";
import { Optional } from "./shorthand";
import { BoxClass } from "../html-utility";
import { UpdateTrigger } from "personal-library/variable-editors/update-request";
import { OUTER_DIV } from "personal-library/css-classes";

export interface VariableEditorSetupInfo<T> {
    value: T;
    div: HTMLDivElement;
    view: View;
    parent: Optional<VariableEditor<any>>;
    SetValue: (newValue: T) => Promise<void>;
    Save: () => Promise<void>;
}

export abstract class VariableEditor<T> {
    /**
     * The value of the variable being handled by this editor.
     */
    value: T;

    div: HTMLDivElement;
    parent: Optional<VariableEditor<any>>;

    private varName: string;

    /**
     * A human readable name for the variable. DisplayName() can be used to display it as text.
     */
    get variableName(): string {
        return this.varName;
    }
    set variableName(newName: string) {
        this.varName = newName;
        this.DisplayName();
    }
    nameDiv: Optional<HTMLDivElement>;

    private isV: boolean;

    /**
     * Whether or not the editor layout is vertical.
     */
    get isVertical(): boolean {
        return this.isV;
    }
    set isVertical(v: boolean) {
        if (this.div === undefined) {
            this.isV = v;
            return;
        }
        
        const classList = this.div.classList;

        const oldClass = BoxClass(this.isV);
        if (classList.contains(oldClass)) classList.remove(oldClass);

        this.isV = v;
        classList.add(BoxClass(v));
    }

    constructor(args: VariableEditorSetupInfo<T>) {
        this.Initialize_Variables(args);
        this.Initialize_DOM_Elements();
        this.Construct_Children(args.view);
    }

    /**
     * Use a reference to the "actual" variable to update its value.
     * This only sets the value and does not save it. ChangeValue is used to set, request updates, and save.
     */
    SetValue: (newValue: T) => Promise<void>;

    /**
     * After updating all the values, this function is called to save those changes.
     */
    Save: () => Promise<void>;
    
    /** Triggered whenever the value of this editor is changed. */
    onChange: UpdateTrigger;
    
    /**
     * Any initial/default values should be added here, otherwise they won't
     * be initialized in time to be used in other functions.
     * 
     * This is called in the constructor of VariableEditor. Remember to call
     * the super of this function when implementing it in a subclass.
     */
    protected Initialize_Variables(args: VariableEditorSetupInfo<T>) {
        this.div = args.div;
        this.parent = args.parent;
        this.value = args.value;
        this.SetValue = args.SetValue;
        this.Save = args.Save;
        this.varName = '';
        this.onChange = new UpdateTrigger(this);
        this.nameDiv = null;
        this.isV = false;
    }

    /**
     * This is called in the constructor.
     * 
     * Any DOM elements that are used by this subclass should be created here.
     * Any interactive or data driven properties of DOM elements
     * that are used by this subclass should also be given their values
     * event handlers here.
     */
    protected Initialize_DOM_Elements() {
        this.nameDiv = this.div.createDiv();
		this.div.classList.add(BoxClass(this.isVertical));
		this.div.classList.add(OUTER_DIV);
        this.DisplayName();
    }

    /**
     * This is called in the constructor.
     * 
     * Any child editors that this editor is responsible for should be constructed
     * here.
     */
    protected Construct_Children(view: View) {}

    /**
     * This is called in the Build step.
     * 
     * For all children editors, supply them with necessary context.
     * 
     * For example, provide a reference to another editor or div that
     * is not handled directly by the child editor. This way, future
     * changes to a UI layout do not require extensive changes to
     * unrelated editors.
     */
    protected Provide_Context() {}

    /**
     * This is called in the Build step.
     * 
     * For all the other editors this editor expects to receive update notifications from,
     * attach this editor in the other editor's triggers.
     */
    protected Attach_To_Triggers() {}

    /**
     * This is called in the Build step.
     * 
     * Any DOM elements that are used by this subclass should be created here.
     * Any interactive or data driven properties of DOM elements
     * that are used by this subclass should also be given their values
     * event handlers here.
     */
    protected Create_HTML_Functionality(view: View) {}

    /**
     * For all children editors this editor has, build them too.
     */
    Build(view: View) {
        this.Provide_Context();
        this.Attach_To_Triggers();
        this.Create_HTML_Functionality(view);
    }

    /**
     * Unregister any applicable event handlers, scope events, etc.
     */
    async Unregister_And_Close() {}

    /**
     * Set the new value, request updates, and save.
     */
    async ChangeValue(view: View, newValue: T): Promise<void> {
        const oldValue = this.value;
        await this.SetValue(newValue);
        await this.onChange.TriggerUpdate(view, oldValue);
        await this.Save();
        this.value = newValue;
    }
    
    /**
     * Creates a div that displays the name of the variable.
     */
    protected DisplayName() {
        if (this.nameDiv === null) return;
        if (this.variableName === '') {
            this.nameDiv.remove();
            return;
        }
        
        this.nameDiv.textContent = this.variableName + ':';
    }
}