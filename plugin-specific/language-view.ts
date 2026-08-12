import { setIcon, TextFileView, WorkspaceLeaf } from 'obsidian';
import { HTMLHelper } from 'html-helper';
import { Dict, Entry } from './dict';
import { HBOX, VBOX } from 'personal-library/css-classes';
import { String_Array_Editor } from './string-array-editor';
import { Category_Array_Editor, Category_Searcher } from './category-editor';
import { Entry_Editor, KeyEditor, Word_Map_Editor } from './word-editor';
import { MapEntry } from 'personal-library/variable-editors/generic-map-entry';

export const VIEW_TYPE_TGT_LANGUAGE = 'tgt-language-view';
export const TGT_LANGUAGE_EXTENSION = 'tgt-lang';

export class DictView extends TextFileView {
	dict: Dict;
	div: HTMLDivElement
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_TGT_LANGUAGE;
	}

	override async setViewData(data: string, clear: boolean): Promise<void> {
		this.Display(data);
	}

	getViewData(): string {
		return JSON.stringify(this.dict);
	}

	clear(): void {
		return;
	}

	private Display(data: string) {
		this.dict = Dict.fromJSON(data);
		this.SortWordCategories();
		this.contentEl.empty();
		this.div = this.contentEl.createDiv(`tgt-lang-main ${HBOX}`);
		this.SetUserDefinedCSSProperties();
		this.CreateTabs();
	}

	//#region Display Helper Functions
	private SortWordCategories() {
		const categoryOrder = new Map<string, number>();
		for (let i = 0; i < this.dict.categories.length; i++) {
			categoryOrder.set(this.dict.categories[i], i);
		}
		const compareFunction = (a: string, b: string) => {
			let num1 = categoryOrder.get(a);
			let num2 = categoryOrder.get(b);

			num1 = num1 === undefined ? -1 : num1;
			num2 = num2 === undefined ? -1 : num2;

			return num1 - num2;
		}
		for (const e of this.dict.entries.entries()) {
			e[1].categories.sort(compareFunction);
		}
	}

	private SetUserDefinedCSSProperties() {
		this.div.style.setProperty('--tx', this.dict.tx);
		this.div.style.setProperty('--bd', this.dict.bd);
		this.div.style.setProperty('--bg', this.dict.bg);
	}
	//#endregion Display Helper Functions

	private CreateTabs() {
		const tabDiv = this.div.createDiv(`tgt-lang-tab-bar tgt-lang-box ${VBOX}`);
		const displayDiv = this.div.createDiv();
		
		const fontInfo = tabDiv.createEl('button');
		const categories = tabDiv.createEl('button');
		const search = tabDiv.createEl('button');
		
		setIcon(fontInfo, 'type');
		setIcon(categories, 'rows-3');
		setIcon(search, 'search');

		this.registerDomEvent(fontInfo, 'click', () => { this.ShowLayoutTab(displayDiv) });
		this.registerDomEvent(categories, 'click', () => { this.ShowWordCategoriesTab(displayDiv) });
		this.registerDomEvent(search, 'click', () => { this.ShowSearchTab(displayDiv) });

		this.ShowSearchTab(displayDiv);
	}

	//#region Layout Tab
	private ShowLayoutTab(div: HTMLDivElement) {
		div.empty();
		div.className = `tgt-lang-display tgt-lang-box ${VBOX}`;
		HTMLHelper.CreateNewTextDiv(div, 'Language font:');
		const fontName = div.createEl('input', { type: 'text', value: this.dict.font } );
		this.registerDomEvent(fontName, 'change', () => {
			this.dict.font = fontName.value;
			this.requestSave();
		});

		HTMLHelper.CreateNewTextDiv(div, '# of results per row:');
		const num = div.createEl('input', { type: 'number', value: `${this.dict.num_per_line}` } );
		this.registerDomEvent(num, 'change', () => {
			this.dict.num_per_line = parseInt(num.value);
			this.requestSave();
		});

		this.ShowDictionaryColorEditor(div);

		const wordOrderLabelDiv = div.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(wordOrderLabelDiv, 'Custom Word Order:');
		const e = new String_Array_Editor({
			value: this.dict.order,
			parent: null,
			div: div,
			view: this,
			SetValue: async (newValue: string[]) => { this.dict.order = newValue },
			Save: async () => { this.requestSave() }
		});
		e.Build(this);
	}

	private ShowDictionaryColorEditor(editorDiv: HTMLDivElement) {
		const saveAndChangeColors = () => {
			this.dict.tx = langColor.value;
			this.dict.bd = langBorderColor.value;
			this.dict.bg = langBackgroundColor.value;

			this.SetUserDefinedCSSProperties();

			this.requestSave();
		}

		const labelDiv1 = editorDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(labelDiv1, 'This Dictionary\'s Text Color:');
		const langColor = editorDiv.createEl('input', { type: 'color', value: this.dict.tx } );
		this.registerDomEvent(langColor, 'change', () => { saveAndChangeColors() });

		const labelDiv2 = editorDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(labelDiv2, 'This Dictionary\'s Border Color:');
		const langBorderColor = editorDiv.createEl('input', { type: 'color', value: this.dict.bd } );
		this.registerDomEvent(langBorderColor, 'change', () => { saveAndChangeColors() });

		const labelDiv3 = editorDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(labelDiv3, 'This Dictionary\'s Background Colors:');
		const langBackgroundColor = editorDiv.createEl('input', { type: 'color', value: this.dict.bg } );
		this.registerDomEvent(langBackgroundColor, 'change', () => { saveAndChangeColors() });

		HTMLHelper.CreateColorSwapButton(labelDiv1, this,
			{ name: 'text', el: langColor },
			{ name: 'border', el: langBorderColor },
			false, async () => { saveAndChangeColors() }
		);
		HTMLHelper.CreateColorSwapButton(labelDiv2, this,
			{ name: 'border', el: langBorderColor },
			{ name: '1st background', el: langBackgroundColor },
			false, async () => { saveAndChangeColors() }
		);
		HTMLHelper.CreateColorSwapButton(labelDiv3, this,
			{ name: '1st background', el: langBackgroundColor },
			{ name: 'text', el: langColor },
			false, async () => { saveAndChangeColors() }
		);
	}
	//#endregion Layout Tab

	//#region Word Categories Tab
	private ShowWordCategoriesTab(div: HTMLDivElement) {
		div.empty();
		HTMLHelper.CreateNewTextDiv(div, 'Word Categories');
		const e = new Category_Array_Editor({
			value: this.dict.categories,
			parent: null,
			div: div,
			view: this,
			SetValue: async (newValue: string[]) => { this.dict.categories = newValue },
			Save: async () => { this.requestSave() }
		});
		e.words = this.dict.entries;
		e.Build(this);
	}
	//#endregion Word Categories Tab

	//#region Search Tab
	private ShowSearchTab(div: HTMLDivElement) {
		div.empty();
		div.className = 'tgt-lang-display vbox';
		const searchBar = div.createDiv('vbox outer-div');
		const listDiv = div.createDiv();

		this.CreateSearchUI(div, searchBar, listDiv);
	}

	//#region Search Helper Functions
	private LoadCustomWordOrder() {
		const char_value = new Map<string, number>();
		for (let i = 0; i < this.dict.order.length; i++) {
			char_value.set(this.dict.order[i], i);
		}

		const order_fn = (a: string, b: string) => {
			let num1 = char_value.get(a);
			let num2 = char_value.get(b);

			num1 = num1 === undefined ? -1 : num1;
			num2 = num2 === undefined ? -1 : num2;

			if (num1 === -1 && num2 === -1) {
				return a < b ? -1 : a === b ? 0 : 1;
			}

			return num1 - num2;
		}

		return (a: string, b: string) => {
			const arr1 = a.split('');
			const arr2 = b.split('');
			const aIsSmaller = a.length < b.length;
			const min = aIsSmaller ? a.length : b.length;
			for (let i = 0; i < min; i++) {
				const currentDifference = order_fn(arr1[i], arr2[i]);
				if (currentDifference != 0) {
					return currentDifference;
				}
			}
			return aIsSmaller ? -1 : b.length === min ? 0 : 1;
		}
	}

	private CreateSearchUI(div: HTMLDivElement, searchBarDiv: HTMLDivElement, listDiv: HTMLDivElement) {
		let categories: string[] = [];

		const searchBar = searchBarDiv.createDiv('hbox');
		const term = searchBar.createEl('input', { type: 'text' } );
		term.focus();
		const searchButton = searchBar.createEl('button');
		setIcon(searchButton, 'search');
		const wordCount = searchBar.createEl('div');
		const filtersDiv = searchBarDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(filtersDiv, 'Look for words with no category');
		const noCategory = filtersDiv.createEl('input', { type: 'checkbox' } );
		const c = new Category_Searcher({
			value: categories,
			parent: null,
			div: filtersDiv.createDiv(),
			view: this,
			SetValue: async (newValue: string[]) => { categories = newValue },
			Save: async () => {}
		});
		c.dict = this.dict;
		c.Build(this);
		const order = this.LoadCustomWordOrder();

		const find_results = () => {
			const results = this.dict.search(term.value, noCategory.checked ? null : categories);
			results.sort((a, b) => order(a, b));
			const numResults = results.length;
			const newWordCount = numResults + ' result' + (numResults === 1 ? '' : 's');
			wordCount.textContent = newWordCount;
			HTMLHelper.AutoAdjustWidth(searchBar, wordCount, newWordCount);
			return results;
		}
		
		const l = new Word_Map_Editor({
			value: this.dict.entries,
			parent: null,
			div: listDiv,
			view: this,
			SetValue: async (newValue: Map<string, Entry>) => { this.dict.entries = newValue },
			Save: async () => { this.requestSave() }
		});
		l.itemsPerLine = this.dict.num_per_line;
		l.dict = this.dict;
		l.search = find_results;
		l.edit_word = (entry: MapEntry<string, Entry>) => { this.EditWord(div, entry) }
		l.Build(this);

		this.registerDomEvent(searchButton, 'click', () => { l.RefreshDisplayedEntries(this) });
		this.registerDomEvent(term, 'keydown', (e) => { e.key === 'Enter' ? l.RefreshDisplayedEntries(this) : false; });
	}

	private EditWord(div: HTMLDivElement, entry: MapEntry<string, Entry>) {
		div.empty();
		const k = new KeyEditor({
			value: entry.key,
			parent: null,
			div: div.createDiv(),
			view: this,
			SetValue: async (newValue: string) => {
				this.dict.rename(entry.key, newValue);
				entry.key = newValue;
			},
			Save: async () => { this.requestSave() }
		});
		const e = new Entry_Editor({
			value: entry.value,
			parent: null,
			div: div.createDiv(),
			view: this,
			SetValue: async (newValue: Entry) => { entry.value = newValue },
			Save: async () => { this.requestSave() }
		});
        
		const dl_btn = div.createEl('button');
        dl_btn.classList.add('remove-button');
        setIcon(dl_btn, 'trash-2');

		e.key_editor = k;
		k.dict = this.dict;
		e.dict = this.dict;
		k.Build(this);
		e.Build(this);

		this.registerDomEvent(dl_btn, 'click', async () => {
			this.dict.remove(entry.key);
			this.requestSave();
			this.ShowSearchTab(div);
		});
	}
}
