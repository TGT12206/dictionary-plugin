import { Language } from 'language';
import { LanguageView, TGT_LANGUAGE_EXTENSION, VIEW_TYPE_TGT_LANGUAGE } from 'language-view';
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';

export default class VideoNote extends Plugin {
	async onload() {

		this.registerView(
			VIEW_TYPE_TGT_LANGUAGE,
			(leaf) => new LanguageView(leaf)
		);

		this.registerExtensions([TGT_LANGUAGE_EXTENSION], VIEW_TYPE_TGT_LANGUAGE);

		this.addCommand({
			id: 'new-lang-dict',
			name: 'Create Language Dictionary',
			callback: async () => {
				const newFile = await this.app.vault.create('Unnamed.' + TGT_LANGUAGE_EXTENSION, JSON.stringify(new Language()));
				this.app.workspace.getLeaf('tab').openFile(newFile);
			}
		});

		this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem((item) => {
					item.setTitle('New Language Dictionary')
						.setIcon('book-type')
						.onClick(async () => {
							const newFile = await this.app.vault.create((file.parent === null ? '' : file.parent.path + '/') + 'Unnamed.' + TGT_LANGUAGE_EXTENSION, JSON.stringify(new Language()));
							this.app.workspace.getLeaf('tab').openFile(newFile);
						});
				});
            })
        );
	}

	onunload() {

	}

	async activateView(view_type: string) {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;

		leaf = workspace.getLeaf('tab');
		if (leaf === null) {
			new Notice("Failed to create view: workspace leaf was null");
			return;
		}
		await leaf.setViewState({ type: view_type, active: true });

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}