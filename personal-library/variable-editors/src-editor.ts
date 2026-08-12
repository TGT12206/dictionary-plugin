import { TFile, View } from "obsidian";
import { OUTER_DIV } from "personal-library/css-classes";
import { PathSuggest } from "personal-library/suggest/path-suggest";
import { StringLineEditor } from "personal-library/variable-editors/primitive";
import { VariableEditorSetupInfo } from "personal-library/variable-editors/variable-editor";

export abstract class SrcEditor extends StringLineEditor {
	acceptedExtensions: string[] | null;
	protected override Initialize_Variables(args: VariableEditorSetupInfo<string>): void {
		super.Initialize_Variables(args);
		this.isVertical = false;
		this.acceptedExtensions = null;
        this.eventName = 'change';
		this.variableName = 'Src';
	}
	protected override Create_HTML_Functionality(view: View): void {
		super.Create_HTML_Functionality(view);
		new PathSuggest(
			view,
			this.input,
			async (file) => {
				await this.ChangeValue(view, file.path);
				await this.UpdateVisualsAfterSelectingFile(view, file);
			},
			this.acceptedExtensions
		);
	}
	protected async UpdateVisualsAfterSelectingFile(view: View, file: TFile) {}
}