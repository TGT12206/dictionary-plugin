import { setIcon, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import { Language, Word, WordCategory } from './language';
import { HTMLHelper } from 'html-helper';

export const VIEW_TYPE_TGT_LANGUAGE = 'tgt-language-view';
export const TGT_LANGUAGE_EXTENSION = 'tgt-lang';

export class LanguageView extends TextFileView {
	language: Language;
	currentFileName: string;
	mainDiv: HTMLDivElement;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_TGT_LANGUAGE;
	}

	override async onLoadFile(file: TFile): Promise<void> {
		this.currentFileName = file.basename;
		super.onLoadFile(file);
	}

	override async onRename(file: TFile): Promise<void> {
		this.currentFileName = file.basename;
		this.language.name = this.currentFileName;
		this.requestSave();
	}

	getDisplayText() {
		return this.currentFileName;
	}

	override async setViewData(data: string, clear: boolean): Promise<void> {
		this.Display(data);
	}

	getViewData(): string {
		return JSON.stringify(this.language);
	}

	clear(): void {
		return;
	}

	private Display(data: string) {
		this.ParseAndReassignData(data);
		this.SortCategoriesOfWords();
		this.contentEl.empty();
		this.mainDiv = this.contentEl.createDiv('tgt-lang-main hbox');
		this.SetUserDefinedCSSProperties();
		this.CreateTabs();
	}

	//#region Display Helper Functions
	private ParseAndReassignData(data: string) {
		const plainObj = JSON.parse(data);
		this.language = new Language();
		Object.assign(this.language, plainObj);
	}

	private SortCategoriesOfWords() {
		const categoryOrder = new Map<string, number>();
		for (let i = 0; i < this.language.categories.length; i++) {
			categoryOrder.set(this.language.categories[i].name, i);
		}
		const compareFunction = (a: string, b: string) => {
			let num1 = categoryOrder.get(a);
			let num2 = categoryOrder.get(b);

			num1 = num1 === undefined ? -1 : num1;
			num2 = num2 === undefined ? -1 : num2;

			return num1 - num2;
		}
		for (let i = 0; i < this.language.words.length; i++) {
			this.language.words[i].categoryNames.sort(compareFunction);
		}
	}

	private SetUserDefinedCSSProperties() {
		this.mainDiv.style.color = this.language.langColor;
		this.mainDiv.style.borderColor = this.language.langBorderColor;
		this.mainDiv.style.backgroundColor = this.language.langBackgroundColor;
	}
	//#endregion Display Helper Functions

	private CreateTabs() {
		const tabDiv = this.mainDiv.createDiv('tgt-lang-tab-bar vbox');
		const displayDiv = this.mainDiv.createDiv();
		
		const fontInfo = tabDiv.createEl('button');
		const categories = tabDiv.createEl('button');
		const search = tabDiv.createEl('button');
		const add = tabDiv.createEl('button');
		
		setIcon(fontInfo, 'type');
		setIcon(categories, 'rows-3');
		setIcon(search, 'search');
		setIcon(add, 'plus');

		this.registerDomEvent(fontInfo, 'click', () => { this.ShowLayoutTab(displayDiv) });
		this.registerDomEvent(categories, 'click', () => { this.ShowWordCategoriesTab(displayDiv) });
		this.registerDomEvent(search, 'click', () => { this.ShowSearchTab(displayDiv) });
		this.registerDomEvent(add, 'click', () => { this.ShowAddWordsTab(displayDiv) });

		this.ShowSearchTab(displayDiv);
	}

	//#region Layout Tab
	private ShowLayoutTab(div: HTMLDivElement) {
		div.empty();
		div.className = 'tgt-lang-display vbox';
		HTMLHelper.CreateNewTextDiv(div, 'Font Name:');
		const fontName = div.createEl('input', { type: 'text', value: this.language.fontName } );
		this.registerDomEvent(fontName, 'change', () => {
			this.language.fontName = fontName.value;
			this.requestSave();
		});
		fontName.focus();

		this.ShowDictionaryColorEditor(div);

		const wordOrderLabelDiv = div.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(wordOrderLabelDiv, 'Custom Word Order:');
		const resortButton = wordOrderLabelDiv.createEl('button', { text: 'Reorder Words' } );
		this.ShowWordOrderEditor(div.createDiv());

		this.registerDomEvent(resortButton, 'click', () => {
			this.ResortWords();
		});
	}

	private ShowDictionaryColorEditor(editorDiv: HTMLDivElement) {
		const saveAndChangeColors = () => {
			this.language.langColor = langColor.value;
			this.language.langBorderColor = langBorderColor.value;
			this.language.langBackgroundColor = langBackgroundColor.value;

			this.SetUserDefinedCSSProperties();

			this.requestSave();
		}

		const labelDiv1 = editorDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(labelDiv1, 'This Dictionary\'s Text Color:');
		const langColor = editorDiv.createEl('input', { type: 'color', value: this.language.langColor } );
		this.registerDomEvent(langColor, 'change', () => { saveAndChangeColors() });

		const labelDiv2 = editorDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(labelDiv2, 'This Dictionary\'s Border Color:');
		const langBorderColor = editorDiv.createEl('input', { type: 'color', value: this.language.langBorderColor } );
		this.registerDomEvent(langBorderColor, 'change', () => { saveAndChangeColors() });

		const labelDiv3 = editorDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(labelDiv3, 'This Dictionary\'s Background Colors:');
		const langBackgroundColor = editorDiv.createEl('input', { type: 'color', value: this.language.langBackgroundColor } );
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

	private ShowWordOrderEditor(editorDiv: HTMLDivElement) {
		HTMLHelper.CreateListEditor(
			editorDiv, '', true,
			this,
			this.language.wordOrder,
			() => { return '' },
			(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
				div.className = 'hbox';
				HTMLHelper.CreateShiftElementUpButton(div, this, this.language.wordOrder, index, true, refreshList);
				HTMLHelper.CreateShiftElementDownButton(div, this, this.language.wordOrder, index, true, refreshList);
				const input = div.createEl('input', { type: 'text', value: this.language.wordOrder[index] } );
				input.style.fontFamily = this.language.fontName;
				this.registerDomEvent(input, 'change', () => {
					this.language.wordOrder[index] = input.value;
					this.requestSave();
				});
				HTMLHelper.CreateDeleteButton(div, this, this.language.wordOrder, index, refreshList);
			},
			async () => {
				this.requestSave();
				this.ShowWordOrderEditor(editorDiv);
			}
		);
	}
	//#endregion Layout Tab

	//#region Word Categories Tab
	private ShowWordCategoriesTab(div: HTMLDivElement) {
		const displayDiv = div;
		HTMLHelper.CreateNewTextDiv(div, 'Word Categories');
		HTMLHelper.CreateListEditor(
			displayDiv, 'tgt-lang-display', true,
			this,
			this.language.categories,
			() => { return new WordCategory() },
			(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
				this.ShowCategoryInList(div, index, refreshList, displayDiv);
			},
			async () => { this.ShowWordCategoriesTab(displayDiv) }
		)
	}

	private ShowCategoryInList(div: HTMLDivElement, index: number, refreshList: () => Promise<void>, displayDiv: HTMLDivElement) {
		div.empty();
		div.className = 'hbox';
		HTMLHelper.CreateShiftElementUpButton(div, this, this.language.categories, index, true, refreshList);
		HTMLHelper.CreateShiftElementDownButton(div, this, this.language.categories, index, true, refreshList);
		this.ShowCategoryNameEditor(div, index);
		HTMLHelper.CreateDeleteButton(div, this, this.language.categories, index, refreshList);
	}

	private ShowCategoryNameEditor(div: HTMLDivElement, categoryIndex: number) {
		const categoryName = div.createEl('input', { type: 'text', value: this.language.categories[categoryIndex].name } );
		categoryName.focus();

		const renameCategory = (oldName: string, newName: string) => {
			this.language.categories[categoryIndex].name = newName;
			// loop through all the words to find and rename this category in them
			for (let w = 0; w < this.language.words.length; w++) {
				const currWord = this.language.words[w];
				for (let c = 0; c < currWord.categoryNames.length; c++) {
					if (currWord.categoryNames[c] === oldName) {
						this.language.words[w].categoryNames[c] = newName;
					}
				}
			}
		}

		this.registerDomEvent(categoryName, 'change', () => {
			const oldName = this.language.categories[categoryIndex].name;
			const newName = categoryName.value;
			renameCategory(oldName, newName);
		});
	}
	//#endregion Word Categories Tab

	//#region Search Tab
	private ShowSearchTab(div: HTMLDivElement) {
		div.empty();
		div.className = 'tgt-lang-display vbox';
		const searchBar = div.createDiv('vbox');
		const listDiv = div.createDiv();

		this.CreateSearchUI(div, searchBar, listDiv);
	}

	//#region Search Helper Functions
	private ResortWords() {
		const customWordOrder = this.LoadCustomWordOrder();
		const compareFunction = (a: Word, b: Word) => { return customWordOrder(a.wordInLanguage, b.wordInLanguage) };
		this.language.words.sort(compareFunction);
	}

	private LoadCustomWordOrder() {
		const wordOrder = new Map<string, number>();
		for (let i = 0; i < this.language.wordOrder.length; i++) {
			wordOrder.set(this.language.wordOrder[i], i);
		}

		const charOrder = (a: string, b: string) => {
			let num1 = wordOrder.get(a);
			let num2 = wordOrder.get(b);

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
				const currentDifference = charOrder(arr1[i], arr2[i]);
				if (currentDifference != 0) {
					return currentDifference;
				}
			}
			return aIsSmaller ? -1 : b.length === min ? 0 : 1;
		}
	}

	private CreateSearchUI(mainDiv: HTMLDivElement, searchBarDiv: HTMLDivElement, listDiv: HTMLDivElement) {
		const results: number[] = [];
		const categories: string[] = [];

		const searchBar = searchBarDiv.createDiv('hbox');
		const term = searchBar.createEl('input', { type: 'text' } );
		term.focus();
		const searchButton = searchBar.createEl('button');
		setIcon(searchButton, 'search');
		const wordCount = searchBar.createEl('div');
		const filtersDiv = searchBarDiv.createDiv('hbox');
		HTMLHelper.CreateNewTextDiv(filtersDiv, 'Look for words with no category');
		const noCategory = filtersDiv.createEl('input', { type: 'checkbox' } );
		HTMLHelper.CreateNewTextDiv(filtersDiv, 'Look for words with duplicate names');
		const lookForDuplicates = filtersDiv.createEl('input', { type: 'checkbox' } );
		this.ShowCategoryListOfWordEditor(filtersDiv.createDiv(), categories);

		const refreshResults = async () => {
			HTMLHelper.CreateList(
				listDiv, 'tgt-lang-word-list', true,
				results,
				(div: HTMLDivElement, index: number) => {
					this.ShowWord(mainDiv, div, results[index], refreshResults, Search);
				}
			)
		}

		const Search = async () => {
			this.FindMatches(term.value, noCategory.checked, lookForDuplicates.checked, categories, results);
			const numResults = results.length;
			const newWordCount = numResults + ' result' + (numResults === 1 ? '' : 's');
			wordCount.textContent = newWordCount;
			HTMLHelper.AutoAdjustWidth(searchBar, wordCount, newWordCount);
			refreshResults();
		}

		this.registerDomEvent(searchButton, 'click', () => { Search() });
		this.registerDomEvent(term, 'keydown', (e) => { e.key === 'Enter' ? Search() : false; });
		
		Search();
	}

	private FindMatches(searchTerm: string, lookForNoCategory: boolean, lookForDuplicates: boolean, categories: string[], matchingIndexes: number[]) {
		matchingIndexes.length = 0;

		if (lookForDuplicates) {
			this.SearchForDuplicates(searchTerm, matchingIndexes);
			for (let i = matchingIndexes.length - 1; i >= 0; i--) {
				if (!this.CheckIfWordMatches(this.language.words[matchingIndexes[i]], searchTerm, lookForNoCategory, categories)) {
					matchingIndexes.splice(i, 1);
				}
			}
			return;
		}

		for (let i = 0; i < this.language.words.length; i++) {
			if (this.CheckIfWordMatches(this.language.words[i], searchTerm, lookForNoCategory, categories)) {
				matchingIndexes.push(i);
			}
		}
	}

	private SearchForDuplicates(searchTerm: string, matchingIndexes: number[]) {
		let justAddedDuplicate = false;
		for (let i = 0; i < this.language.words.length - 1; i++) {
			const currWord = this.language.words[i];
			const nextWord = this.language.words[i + 1];
			if (currWord.wordInLanguage !== nextWord.wordInLanguage) {
				justAddedDuplicate = false;
				continue;
			}

			if (searchTerm === '') {
				if (!justAddedDuplicate) {
					matchingIndexes.push(i);
				}
				matchingIndexes.push(i + 1);
				justAddedDuplicate = true;
				continue;
			}

			let entireWordString = currWord.wordInLanguage;
			for (let j = 0; j < currWord.descriptions.length; j++) {
				entireWordString += currWord.descriptions[j] + '\n';
			}

			if (entireWordString.contains(searchTerm)) {
				if (!justAddedDuplicate) {
					matchingIndexes.push(i);
				}
				matchingIndexes.push(i + 1);
				justAddedDuplicate = true;
			}
		}
	}
	
	private CheckIfWordMatches(currWord: Word, searchTerm: string, lookForNoCategory: boolean, categories: string[]): boolean {
		const includeAllFromCategory = searchTerm === '';

		if (!includeAllFromCategory) {
			let entireWordString = currWord.wordInLanguage;
			for (let i = 0; i < currWord.descriptions.length; i++) {
				entireWordString += currWord.descriptions[i] + '\n';
			}
			if (!entireWordString.contains(searchTerm)) {
				return false;
			}
		}

		if (lookForNoCategory) {
			return currWord.categoryNames.length === 0;
		}

		if (categories.length === 0) {
			return true;
		}

		let wordCategories = '';
		for (let i = 0; i < currWord.categoryNames.length; i++) {
			wordCategories += currWord.categoryNames[i] + '\n';
		}

		let matches = true;
		for (let i = 0; matches && i < categories.length; i++) {
			if (!wordCategories.contains(categories[i])) {
				matches = false;
			}
		}

		return matches;
	}
	
	//#endregion Search Helper Functions

	private ShowWord(mainDiv: HTMLDivElement, div: HTMLDivElement, index: number, refreshList: () => Promise<void>, refreshListOnDelete: () => Promise<void>) {
		div.empty();
		div.className = 'tgt-lang-word vbox';
		const currWord = this.language.words[index];

		this.CreateWordTopDiv(mainDiv, div, index, refreshList, refreshListOnDelete);

		this.ShowCategoryListOfWord(div.createDiv(), currWord.categoryNames);
		this.ShowWordDescriptionList(div.createDiv(), currWord.descriptions);
	}

	private CreateWordTopDiv(mainDiv: HTMLDivElement, div: HTMLDivElement, index: number, refreshList: () => Promise<void>, refreshListOnDelete: () => Promise<void>) {
		const topDiv = div.createDiv('hbox');
		
		const currWord = this.language.words[index];
		
		const word = HTMLHelper.CreateNewTextDiv(topDiv, currWord.wordInLanguage, 'pointer-hover');
		const editButton = topDiv.createEl('button');

		word.style.fontFamily = this.language.fontName;
		
		setIcon(editButton, 'pencil');

		this.registerDomEvent(word, 'click', () => {
			navigator.clipboard.writeText(currWord.wordInLanguage);
		});
		this.registerDomEvent(editButton, 'click', () => {
			this.ShowWordEditor(mainDiv.createDiv(), 'tgt-lang-popup', index, refreshList, refreshListOnDelete, mainDiv);
		});
	}
	//#endregion Search Tab

	//#region Add Words Tab
	private ShowAddWordsTab(div: HTMLDivElement) {
		this.ShowWordEditor(div, 'tgt-lang-display');
	}

	//#region Add Words Helper Functions
	private ShowWordEditor(div: HTMLDivElement, extraDivClasses: string, existingWordIndex = -1, refreshList: () => Promise<void> = async () => {}, refreshListOnDelete: () => Promise<void> = async () => {}, mainDiv: HTMLDivElement | undefined = undefined) {
		div.empty();
		div.className = 'vbox ' + extraDivClasses;
		if (existingWordIndex > -1) {
			div.style.backgroundColor = this.mainDiv.style.backgroundColor;
		}

		const creatingNewWord = existingWordIndex === -1;

		let isDuplicate = false;
		const duplicateIndicator = div.createDiv();

		let nameChanged = false;
		const wordToEdit = creatingNewWord ? new Word() : this.language.words[existingWordIndex];
		if (creatingNewWord) {
			wordToEdit.wordInLanguage = '';
		}

		HTMLHelper.CreateNewTextDiv(div, 'New Word:');
		const word = div.createEl('input', { type: 'text', value: creatingNewWord ? '' : wordToEdit.wordInLanguage } );
		word.focus();

		HTMLHelper.CreateNewTextDiv(div, 'Categories:');
		this.ShowCategoryListOfWordEditor(div.createDiv(), wordToEdit.categoryNames);

		HTMLHelper.CreateNewTextDiv(div, 'Descriptions:');
		this.ShowWordDescriptionListEditor(div.createDiv(), wordToEdit.descriptions);

		word.style.fontFamily = this.language.fontName;
		
		const checkIfUnique = () => {
			for (let i = 0; !isDuplicate && i < this.language.words.length; i++) {
				isDuplicate = this.language.words[i].wordInLanguage === wordToEdit.wordInLanguage;
			}
			duplicateIndicator.textContent = isDuplicate ? 'Name is duplicate' : 'Name is unique';
		}

		if (creatingNewWord) {
			duplicateIndicator.textContent = 'Name is unique';
		} else {
			checkIfUnique();
		}

		this.registerDomEvent(word, 'change', () => {
			nameChanged = true;
			wordToEdit.wordInLanguage = word.value;
			checkIfUnique();
		});

		if (creatingNewWord) {
			const saveButton = div.createEl('button', { text: 'save' } );
			this.registerDomEvent(saveButton, 'click', () => {
				this.language.words.push(wordToEdit);
				this.ResortWords();
				this.requestSave();
				this.ShowAddWordsTab(div);
			});
		} else {
			const buttonDiv = div.createDiv('hbox');

			const saveButton = buttonDiv.createEl('button', { text: 'save' } );
			HTMLHelper.CreateDeleteButton(buttonDiv, this, this.language.words, existingWordIndex, async () => { 
				div.remove();
				refreshListOnDelete();
			});

			this.registerDomEvent(saveButton, 'click', () => {
				div.remove();
				if (nameChanged) {
					this.ResortWords();
				}
				this.requestSave();
				return refreshList();
			});
		}
	}

	private ShowWordDescriptionList(div: HTMLDivElement, descriptions: string[]) {
		const makeUI = (div: HTMLDivElement, index: number) => {
			this.ShowWordDescriptionInList(div, descriptions, index);
		}

		HTMLHelper.CreateList(div, '', true, descriptions, makeUI);
	}

	private ShowWordDescriptionInList(div: HTMLDivElement, descriptions: string[], index: number) {
		div.classList.add('tgt-lang-word-description');
		HTMLHelper.AddTextToDiv(div, descriptions[index]);
	}

	private ShowWordDescriptionListEditor(div: HTMLDivElement, descriptions: string[]) {
		const makeNewDescription = () => { return '' }
		const makeUI = (div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
			this.ShowWordDescriptionInListEditor(div, descriptions, index, refreshList);
		}
		const refreshList = async () => { this.ShowWordDescriptionListEditor(div, descriptions) }

		HTMLHelper.CreateListEditor(div, '', true, this, descriptions, makeNewDescription, makeUI, refreshList);
	}

	private ShowWordDescriptionInListEditor(div: HTMLDivElement, descriptions: string[], index: number, refreshList: () => Promise<void>) {
		HTMLHelper.CreateShiftElementUpButton(div, this, descriptions, index, true, refreshList);
		HTMLHelper.CreateShiftElementDownButton(div, this, descriptions, index, true, refreshList);

		const textArea = div.createEl('textarea', { text: descriptions[index] } );
		
		HTMLHelper.CreateDeleteButton(div, this, descriptions, index, refreshList);
		
		this.registerDomEvent(textArea, 'input', () => {
			HTMLHelper.AutoAdjustHeight(div, textArea, textArea.value);
		});
		this.registerDomEvent(textArea, 'change', () => {
			descriptions[index] = textArea.value;
		});

		HTMLHelper.AutoAdjustHeight(div, textArea, textArea.value);
	}

	private ShowCategoryListOfWord(div: HTMLDivElement, list: string[]) {
		div.empty();
		const makeUI = (div: HTMLDivElement, index: number) => {
			this.ShowCategoryOfWordInList(div, list, index);
		}
		HTMLHelper.CreateList(div, 'tgt-lang-category-list', false, list, makeUI);
	}

	private ShowCategoryOfWordInList(div: HTMLDivElement, list: string[], index: number) {
		div.className = 'hbox';
		HTMLHelper.AddTextToDiv(div, list[index]);
	}

	private ShowCategoryListOfWordEditor(div: HTMLDivElement, list: string[]) {
		div.empty();

		const makeNewCategory = () => { return '' }
		const makeUI = (div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
			this.ShowCategoryOfWordInListEditor(div, list, index, refreshList);
		}
		const refreshList = async () => { this.ShowCategoryListOfWordEditor(div, list) };

		HTMLHelper.CreateListEditor(div, 'tgt-lang-category-list', false, this, list, makeNewCategory, makeUI, refreshList);
	}

	private ShowCategoryOfWordInListEditor(div: HTMLDivElement, list: string[], index: number, refreshList: () => Promise<void>) {
		div.className = 'hbox';
		const select = div.createEl('select');
		for (let i = 0; i < this.language.categories.length; i++) {
			const category = this.language.categories[i].name;
			select.createEl('option', { text: category, value: category } );
			if (i === 0) {
				const isNewCategory = list[index] === '';
				select.value = isNewCategory ? category : list[index];
				list[index] = isNewCategory ? category : list[index];
			}
		}
		this.registerDomEvent(select, 'change', () => { list[index] = select.value });
		HTMLHelper.CreateDeleteButton(div, this, list, index, refreshList);
	}
	//#endregion Add Words Helper Functions
	//#endregion Add Words Tab

}
