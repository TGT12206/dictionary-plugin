import { Language } from 'plugin-specific/language';
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { DictView, TGT_LANGUAGE_EXTENSION, VIEW_TYPE_TGT_LANGUAGE } from 'plugin-specific/language-view';
import 'personal-library/monkey-patches/array';
// import { Updater } from 'updaters/1-0_to_1-1';

export default class LanguagePlugin extends Plugin {
	async onload() {
		// for (const f of this.app.vault.getFiles()) {
		// 	if (f.extension !== TGT_LANGUAGE_EXTENSION) continue;
		// 	const lang = Object.assign(new Language(), JSON.parse(await this.app.vault.read(f)));
		// 	await this.app.vault.adapter.write(f.path, JSON.stringify(Updater.Update(lang)));
		// }

		this.registerView(
			VIEW_TYPE_TGT_LANGUAGE,
			(leaf) => new DictView(leaf)
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
					item.setTitle('New dictionary')
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