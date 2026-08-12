import { View } from "obsidian";
import { VariableEditor, VariableEditorSetupInfo } from "./variable-editor";
import { Option_Suggest } from "personal-library/suggest/option-suggest";

export type Primitive = string | number | boolean | bigint | symbol;

export abstract class PrimitiveEditor<P extends Primitive> extends VariableEditor<P> {
    eventName: keyof HTMLElementEventMap;
    input: HTMLElement;
    protected Initialize_Variables(args: VariableEditorSetupInfo<P>): void {
        super.Initialize_Variables(args);
        this.eventName = 'input';
    }
    protected override Initialize_DOM_Elements(): void {
        super.Initialize_DOM_Elements();

        this.input = this.CreateInput();
        this.SetInputValue(this.value);
    }
    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);

        view.registerDomEvent(this.input, this.eventName, async () => {
            const val = this.GetInputValue();
            await this.ChangeValue(view, val);
        });
    }
    override async ChangeValue(view: View, newValue: P) {
        if (!this.IsValidValue(newValue)) return this.SetInputValue(this.value);
        this.SetInputValue(newValue);
        await super.ChangeValue(view, newValue);
    }
    protected abstract CreateInput(): HTMLElement;
    protected abstract IsValidValue(newValue: P): boolean;
    protected abstract SetInputValue(newValue: P): void;
    protected abstract GetInputValue(): P;
}
export class StringLineEditor extends PrimitiveEditor<string> {
    override input: HTMLInputElement;
    protected override CreateInput(): HTMLElement {
        return this.div.createEl('input', { type: 'text' } );
    }
    protected override IsValidValue(newValue: string): boolean {
        return true;
    }
    protected override SetInputValue(newValue: string): void {
        this.input.value = newValue;
    }
    protected override GetInputValue(): string {
        return this.input.value;
    }
}
export class StringParagraphEditor extends PrimitiveEditor<string> {
    override input: HTMLTextAreaElement;
    protected override CreateInput(): HTMLElement {
        return this.div.createEl('textarea');
    }
    protected override IsValidValue(newValue: string): boolean {
        return true;
    }
    protected override SetInputValue(newValue: string): void {
        this.input.value = newValue;
    }
    protected override GetInputValue(): string {
        return this.input.value;
    }
}
export class ColorEditor extends PrimitiveEditor<string> {
    override input: HTMLInputElement;
    protected Initialize_Variables(args: VariableEditorSetupInfo<string>): void {
        super.Initialize_Variables(args);
        this.eventName = 'change';
    }
    protected override CreateInput(): HTMLElement {
        return this.div.createEl('input', { type: 'color' } );
    }
    protected override IsValidValue(newValue: string): boolean {
        return true;
    }
    protected override SetInputValue(newValue: string): void {
        this.input.value = newValue;
    }
    protected override GetInputValue(): string {
        return this.input.value;
    }
}
export class FloatEditor extends PrimitiveEditor<number> {
    override input: HTMLInputElement;
    protected override Initialize_Variables(args: VariableEditorSetupInfo<number>): void {
        super.Initialize_Variables(args);
        this.eventName = 'change';
    }
    protected override CreateInput(): HTMLElement {
        return this.div.createEl('input', { type: 'text' } );
    }
    protected override IsValidValue(newValue: number): boolean {
        return true;
    }
    protected override SetInputValue(newValue: number): void {
        this.input.value = newValue + '';
    }
    protected override GetInputValue(): number {
        return parseFloat(this.input.value);
    }
}
export class IntegerEditor extends PrimitiveEditor<number> {
    override input: HTMLInputElement;
    protected override CreateInput(): HTMLElement {
        return this.div.createEl('input', { type: 'text' } );
    }
    protected override IsValidValue(newValue: number): boolean {
        return newValue.toString() === newValue.toFixed(0);
    }
    protected override SetInputValue(newValue: number): void {
        this.input.value = newValue + '';
    }
    protected override GetInputValue(): number {
        return parseInt(this.input.value);
    }
}
export class BooleanEditor extends PrimitiveEditor<boolean> {
    override input: HTMLInputElement;
    get disabled(): boolean {
        return this.input.disabled;
    }
    set disabled(new_val: boolean) {
        this.input.disabled = new_val;
    }
    protected override CreateInput(): HTMLElement {
        return this.div.createEl('input', { type: 'checkbox' } );
    }
    protected override IsValidValue(newValue: boolean): boolean {
        return !this.disabled;
    }
    protected override SetInputValue(newValue: boolean): void {
        this.input.checked = newValue;
    }
    protected override GetInputValue(): boolean {
        return this.input.checked;
    }
}
export class String_Option_Editor extends StringLineEditor {
    options: string[];
    protected override Initialize_Variables(args: VariableEditorSetupInfo<string>): void {
        super.Initialize_Variables(args);
        this.isVertical = false;
        this.options = [];
        this.eventName = 'change';
    }
    protected override Create_HTML_Functionality(view: View): void {
        super.Create_HTML_Functionality(view);
        new Option_Suggest(
            view,
            this.input,
            async (str) => {
                await this.ChangeValue(view, str);
                await this.UpdateAfterSelecting(view, str);
            },
            this.options
        );
    }
    protected async UpdateAfterSelecting(view: View, str: string) {}
}