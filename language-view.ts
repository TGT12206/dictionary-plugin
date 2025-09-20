import { setIcon, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import { Inflection, Language, Word, WordCategory } from './language';
import { HTMLHelper } from 'html-helper';

export const VIEW_TYPE_TGT_LANGUAGE = 'tgt-language-view';
export const TGT_LANGUAGE_EXTENSION = 'tgt-lang';

export class LanguageView extends TextFileView {
	language: Language;
	currentFileName: string;
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
	}

	getDisplayText() {
		return this.currentFileName;
	}

	override async setViewData(data: string, clear: boolean): Promise<void> {
		await this.Display(data);
	}

	getViewData(): string {
		return JSON.stringify(this.language);
	}

	clear(): void {
		return;
	}

	private async Display(data: string) {
		const plainObj = JSON.parse(data);
		this.language = Object.assign(new Language(), plainObj);
		this.contentEl.empty();
		const mainDiv = this.contentEl.createDiv('tgt-lang-main hbox');
		await this.CreateTabs(mainDiv);
	}

	private async CreateTabs(div: HTMLDivElement) {
		const tabDiv = div.createDiv('tgt-lang-tab-bar vbox');
		const displayDiv = div.createDiv();
		
		const fontInfo = tabDiv.createEl('button');
		const categories = tabDiv.createEl('button');
		const search = tabDiv.createEl('button');
		const add = tabDiv.createEl('button');
		
		setIcon(fontInfo, 'type');
		setIcon(categories, 'rows-3');
		setIcon(search, 'search');
		setIcon(add, 'plus');

		this.registerDomEvent(fontInfo, 'click', () => {
			this.ShowLayout(displayDiv);
		});
		this.registerDomEvent(categories, 'click', () => {
			this.ShowWordCategories(displayDiv, div);
		});
		this.registerDomEvent(search, 'click', () => {
			this.SearchWords(displayDiv);
		});
		this.registerDomEvent(add, 'click', () => {
			this.AddWord(displayDiv);
		});

		this.SearchWords(displayDiv);
	}

	private async ShowLayout(div: HTMLDivElement) {
		div.empty();
		div.className = 'tgt-lang-display vbox';
		HTMLHelper.CreateNewTextDiv(div, 'Font Name:');
		const fontName = div.createEl('input', { type: 'text', value: this.language.fontName } );
		this.registerDomEvent(fontName, 'change', () => {
			this.language.fontName = fontName.value;
		});
		HTMLHelper.CreateNewTextDiv(div, 'Custom Word Order:');
		const wordOrderDiv = div.createDiv('vbox');
		const refreshWordOrder = () => {
			wordOrderDiv.empty();
			HTMLHelper.CreateListEditor(
				wordOrderDiv, '', true,
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
					});
					HTMLHelper.CreateDeleteButton(div, this, this.language.wordOrder, index, refreshList);
				},
				async () => {
					refreshWordOrder();
				}
			);
		}
		refreshWordOrder();
	}

	private async ShowWordCategories(div: HTMLDivElement, mainDiv: HTMLDivElement) {
		const displayDiv = div;
		div.empty();
		div.className = 'tgt-lang-display vbox';
		HTMLHelper.CreateNewTextDiv(div, 'Word Categories');
		HTMLHelper.CreateListEditor(
			div.createDiv(), '', true,
			this,
			this.language.categories,
			() => { return new WordCategory() },
			(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
				this.ShowCategory(div, index, refreshList, displayDiv, mainDiv);
			},
			async () => {
				this.ShowWordCategories(displayDiv, mainDiv);
			}
		)
	}

	private async ShowCategory(div: HTMLDivElement, index: number, refreshList: () => Promise<void>, displayDiv: HTMLDivElement, mainDiv: HTMLDivElement) {
		div.empty();
		div.className = 'hbox';
		HTMLHelper.CreateShiftElementUpButton(div, this, this.language.categories, index, true, refreshList);
		HTMLHelper.CreateShiftElementDownButton(div, this, this.language.categories, index, true, refreshList);
		const name = HTMLHelper.CreateNewTextDiv(div, this.language.categories[index].name, 'pointer-hover tgt-lang-category');
		this.registerDomEvent(name, 'click', () => {
			this.ShowInflections(displayDiv, index, mainDiv);
		});
		HTMLHelper.CreateDeleteButton(div, this, this.language.categories, index, refreshList);
	}

	private async ShowInflections(div: HTMLDivElement, categoryIndex: number, mainDiv: HTMLDivElement) {
		div.empty();
		div.className = 'tgt-lang-display vbox';
		const categoryNameDiv = div.createDiv('hbox');
		const categoryName = categoryNameDiv.createEl('input', { type: 'text', value: this.language.categories[categoryIndex].name } );
		HTMLHelper.CreateNewTextDiv(categoryNameDiv, 'Inflections');
		this.registerDomEvent(categoryName, 'change', () => {
			const oldName = this.language.categories[categoryIndex].name;
			const newName = categoryName.value;
			for (let i = 0; i < this.language.words.length; i++) {
				const currWord = this.language.words[i];
				for (let j = 0; j < currWord.categoryNames.length; j++) {
					if (currWord.categoryNames[j] === oldName) {
						this.language.words[i].categoryNames[j] = newName;
					}
				}
			}
			this.language.categories[categoryIndex].name = newName;
		});

		HTMLHelper.CreateListEditor(
			div.createDiv(), '', true,
			this,
			this.language.categories[categoryIndex].inflections,
			() => { return new Inflection() },
			(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
				this.ShowInflection(div, index, refreshList, categoryIndex, mainDiv);
			},
			async () => {
				this.ShowInflections(div, categoryIndex, mainDiv);
			}
		)
	}

	private async ShowInflection(div: HTMLDivElement, index: number, refreshList: () => Promise<void>, categoryIndex: number, mainDiv: HTMLDivElement) {
		div.empty();
		div.className = 'vbox';
		const topDiv = div.createDiv('hbox');
		const buttonsDiv = topDiv.createDiv('hbox');
		const contentDiv = topDiv.createDiv('tgt-lang-inflection-div vbox');
		HTMLHelper.CreateShiftElementUpButton(buttonsDiv, this, this.language.categories[categoryIndex].inflections, index, true, refreshList);
		HTMLHelper.CreateShiftElementDownButton(buttonsDiv, this, this.language.categories[categoryIndex].inflections, index, true, refreshList);
		const name = contentDiv.createEl('input', { type: 'text', value: this.language.categories[categoryIndex].inflections[index].name } );
		const description = contentDiv.createEl('textarea', { text: this.language.categories[categoryIndex].inflections[index].description } );
		const irregularButtonDiv = contentDiv.createDiv('hbox');
		const showIrregularsButton = irregularButtonDiv.createEl('button', { text: 'Show Irregulars' } );
		HTMLHelper.CreateDeleteButton(topDiv, this, this.language.categories[categoryIndex].inflections, index, refreshList);

		this.registerDomEvent(name, 'change', () => {
			this.language.categories[categoryIndex].inflections[index].name = name.value;
		});
		this.registerDomEvent(description, 'input', () => {
			HTMLHelper.AutoAdjustTextArea(div, description, false);
		});
		this.registerDomEvent(description, 'change', () => {
			this.language.categories[categoryIndex].inflections[index].description = description.value;
		});

		HTMLHelper.AutoAdjustTextArea(div, description, false);

		const inflectionIndex = index;

		const showIrregulars = () => {
			const listDiv = mainDiv.createDiv('tgt-lang-irregulars-list-wrapper vbox');
			const exitButton = listDiv.createEl('button');
			exitButton.className = 'exit-button';
			setIcon(exitButton, 'x');
			this.registerDomEvent(exitButton, 'click', () => {
				listDiv.remove();
			});
			HTMLHelper.CreateListEditor(
				listDiv.createDiv(), 'tgt-lang-irregulars-list', true,
				this,
				this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars,
				() => { return '' },
				(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
					div.className = 'tgt-lang-word';
					HTMLHelper.CreateShiftElementUpButton(
						div, this,
						this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars,
						index, false, refreshList
					);
					HTMLHelper.CreateShiftElementDownButton(
						div, this,
						this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars,
						index, false, refreshList
					);
					HTMLHelper.CreateNewTextDiv(div, 'Irregular Word');
					const word = div.createEl('input', { type: 'text', value: this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars[index].word } );
					HTMLHelper.CreateNewTextDiv(div, 'Irregular Form');
					const rule = div.createEl('input', { type: 'text', value: this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars[index].rule } );

					this.registerDomEvent(word, 'change', () => {
						this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars[index].word = word.value;
					});
					this.registerDomEvent(rule, 'change', () => {
						this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars[index].rule = rule.value;
					});

					HTMLHelper.CreateDeleteButton(
						div, this,
						this.language.categories[categoryIndex].inflections[inflectionIndex].irregulars,
						index, refreshList
					);
				},
				async () => {
					listDiv.remove();
					showIrregulars();
				}
			)
		}
		this.registerDomEvent(showIrregularsButton, 'click', () => {
			showIrregulars();
		});
	}

	private async SearchWords(div: HTMLDivElement) {
		const displayDiv = div;
		div.empty();
		div.className = 'tgt-lang-display vbox';
		const searchBar = div.createDiv('vbox');
		const listDiv = div.createDiv();

		const wordOrder = new Map<string, number>();
		for (let i = 0; i < this.language.wordOrder.length; i++) {
			wordOrder.set(this.language.wordOrder[i], i);
		}

		const customCompare = this.LoadCustomWordOrder();

		this.language.words.sort((a: Word, b: Word) => { return customCompare(a.wordInLanguage, b.wordInLanguage) });

		const results: number[] = [];
		const categories: string[] = [];

		const categoryOrder = new Map;
		for (let i = 0; i < this.language.categories.length; i++) {
			categoryOrder.set(this.language.categories[i], i);
		}
		
		const refreshList = () => {
			HTMLHelper.CreateList(
				listDiv, 'tgt-lang-word-list', true,
				results,
				(div: HTMLDivElement, index: number) => {
					this.ShowWord(div, results[index], async () => { this.SearchWords(displayDiv) }, categoryOrder);
				}
			)
		}

		const innerSearchBar = searchBar.createDiv('hbox');
		const term = innerSearchBar.createEl('input');
		const icon = innerSearchBar.createEl('div');
		setIcon(icon, 'search');
		const wordCount = innerSearchBar.createEl('div');
		const categoryDiv = searchBar.createDiv('hbox');

		const search = () => {
			results.length = 0;
			const searchTerm = term.value;
			for (let i = 0; i < this.language.words.length; i++) {
				const currWord = this.language.words[i];
				const entireWordString =
					currWord.wordInLanguage + '\n'
					currWord.description + '\n'
					currWord.notes;
				
				if (searchTerm === '' || entireWordString.contains(searchTerm)) {
					let wordCategories = '';
					for (let j = 0; j < currWord.categoryNames.length; j++) {
						wordCategories += currWord.categoryNames[j] + '\n';
					}
					let matches = true;
					for (let j = 0; matches && j < categories.length; j++) {
						if (!wordCategories.contains(categories[j])) {
							matches = false;
						}
					}
					if (categories.length === 0 || matches) {
						results.push(i);
					}
				}
			}
			wordCount.textContent = results.length + ' results';
			refreshList();
		}

		const makeCategoryListEditor = () => {
			categoryDiv.empty();
			categories.length = 0;
			HTMLHelper.CreateListEditor(
				categoryDiv, '', false, this, categories,
				() => { return '' },
				(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
					const select = div.createEl('select');
					for (let i = 0; i < this.language.categories.length; i++) {
						const category = this.language.categories[i].name;
						select.createEl('option', { text: category, value: category } );
						if (select.value === '' && i === 0) {
							select.value = category;
						}
					}
					categories[index] === '' ? 0 === 0 : select.value = categories[index];
					this.registerDomEvent(select, 'change', () => {
						categories[index] = select.value;
					});
					HTMLHelper.CreateDeleteButton(div, this, categories, index, refreshList);
				},
				async () => { search() }
			);
		}

		makeCategoryListEditor();
		this.registerDomEvent(term, 'input', () => {
			search();
		});
		
		search();
	}

	private async ShowWord(div: HTMLDivElement, index: number, refreshList: () => Promise<void>, customOrder: Map<string, number>) {
		div.empty();
		div.className = 'tgt-lang-word vbox';
		const currWord = this.language.words[index];
		const topDiv = div.createDiv('hbox');
		const word = topDiv.createDiv('pointer-hover');
		const editButton = topDiv.createEl('button');
		setIcon(editButton, 'pencil');
		word.textContent = currWord.wordInLanguage;
		word.style.fontFamily = this.language.fontName;
		currWord.categoryNames.sort(
			(a: string, b: string) => {
				let num1 = customOrder.get(a);
				let num2 = customOrder.get(b);

				num1 = num1 === undefined ? -1 : num1;
				num2 = num2 === undefined ? -1 : num2;

				return num1 - num2;
			}
		);
		HTMLHelper.CreateList(
			div.createDiv(), '', false,
			currWord.categoryNames,
			(div: HTMLDivElement, index: number) => {
				div.textContent = currWord.categoryNames[index];
			}
		);
		div.createEl('div', { text: currWord.description } );
		div.createEl('div', { text: currWord.notes } );
		this.registerDomEvent(word, 'click', () => {
			navigator.clipboard.writeText(currWord.wordInLanguage);
		});
		this.registerDomEvent(editButton, 'click', () => {
			this.EditWord(div, index, refreshList, customOrder);
		});
	}

	private async EditWord(div: HTMLDivElement, wordIndex: number, refreshList: () => Promise<void>, customOrder: Map<string, number>) {
		div.empty();
		div.className = 'tgt-lang-word vbox';
		HTMLHelper.CreateNewTextDiv(div, 'Word:');
		const word = div.createEl('input', { type: 'text', value: this.language.words[wordIndex].wordInLanguage } );
		HTMLHelper.CreateNewTextDiv(div, 'Categories:');
		const categoryList = div.createDiv();
		
		const makeCategoryListEditor = () => {
			categoryList.empty();
			HTMLHelper.CreateListEditor(
				categoryList, '', false, this, this.language.words[wordIndex].categoryNames,
				() => { return '' },
				(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
					HTMLHelper.CreateShiftElementUpButton(
						div, this,
						this.language.words[wordIndex].categoryNames,
						index, false, refreshList
					)
					HTMLHelper.CreateShiftElementDownButton(
						div, this,
						this.language.words[wordIndex].categoryNames,
						index, false, refreshList
					)
					const select = div.createEl('select');
					for (let i = 0; i < this.language.categories.length; i++) {
						const category = this.language.categories[i].name;
						select.createEl('option', { text: category, value: category } );
						if (select.value === '' && i === 0) {
							select.value = category;
						}
					}
					select.value = this.language.words[wordIndex].categoryNames[index];
					this.registerDomEvent(select, 'change', () => {
						this.language.words[wordIndex].categoryNames[index] = select.value;
					});
					HTMLHelper.CreateDeleteButton(div, this, this.language.words[wordIndex].categoryNames, index, refreshList);
				},
				async () => { makeCategoryListEditor() }
			);
		}

		makeCategoryListEditor();

		HTMLHelper.CreateNewTextDiv(div, 'Description:');
		const description = div.createEl('textarea', { text: this.language.words[wordIndex].description } );
		HTMLHelper.CreateNewTextDiv(div, 'Extra Notes:');
		const notes = div.createEl('textarea', { text: this.language.words[wordIndex].notes } );
		const buttonDiv = div.createDiv('hbox');
		const save = buttonDiv.createEl('button', { text: 'save' } );
		HTMLHelper.CreateDeleteButton(buttonDiv, this, this.language.words, wordIndex, refreshList);

		word.style.fontFamily = this.language.fontName;

		HTMLHelper.AutoAdjustTextArea(div, description, false);
		HTMLHelper.AutoAdjustTextArea(div, notes, false);

		this.registerDomEvent(description, 'input', () => {
			HTMLHelper.AutoAdjustTextArea(div, description, false);
		});
		this.registerDomEvent(notes, 'input', () => {
			HTMLHelper.AutoAdjustTextArea(div, notes, false);
		});
		this.registerDomEvent(save, 'click', () => {
			const wordName = word.value;

			this.language.words[wordIndex].description = description.value;
			this.language.words[wordIndex].notes = notes.value;

			if (this.language.words[wordIndex].wordInLanguage !== wordName) {
				this.language.words[wordIndex].wordInLanguage = wordName;
				refreshList();
			} else {
				this.ShowWord(div, wordIndex, refreshList, customOrder);
			}
		});
	}

	private async AddWord(div: HTMLDivElement) {
		const newWord = new Word();
		div.empty();
		div.className = 'tgt-lang-display vbox';
		HTMLHelper.CreateNewTextDiv(div, 'New Word:');
		const word = div.createEl('input', { type: 'text' } );
		HTMLHelper.CreateNewTextDiv(div, 'Categories:');
		const categoryList = div.createDiv();
		
		const makeCategoryListEditor = () => {
			categoryList.empty();
			HTMLHelper.CreateListEditor(
				categoryList, '', false, this, newWord.categoryNames,
				() => { return new WordCategory() },
				(div: HTMLDivElement, index: number, refreshList: () => Promise<void>) => {
					const select = div.createEl('select');
					for (let i = 0; i < this.language.categories.length; i++) {
						const category = this.language.categories[i].name;
						select.createEl('option', { text: category, value: category } );
						if (i === 0) {
							select.value = category;
						}
					}
					this.registerDomEvent(select, 'change', () => {
						newWord.categoryNames[index] = select.value;
					});
					HTMLHelper.CreateDeleteButton(div, this, newWord.categoryNames, index, refreshList);
				},
				async () => { makeCategoryListEditor() }
			);
		}

		makeCategoryListEditor();

		HTMLHelper.CreateNewTextDiv(div, 'Description:');
		const description = div.createEl('textarea');
		HTMLHelper.CreateNewTextDiv(div, 'Extra Notes:');
		const notes = div.createEl('textarea');
		const add = div.createEl('button', { text: 'save' } );

		word.style.fontFamily = this.language.fontName;

		HTMLHelper.AutoAdjustTextArea(div, description, false);
		HTMLHelper.AutoAdjustTextArea(div, notes, false);
		
		this.registerDomEvent(description, 'input', () => {
			HTMLHelper.AutoAdjustTextArea(div, description, false);
		});
		this.registerDomEvent(notes, 'input', () => {
			HTMLHelper.AutoAdjustTextArea(div, notes, false);
		});
		this.registerDomEvent(add, 'click', () => {
			const wordName = word.value;

			newWord.wordInLanguage = wordName;
			newWord.description = description.value;
			newWord.notes = notes.value;

			this.language.words.push(newWord);

			this.AddWord(div);
		});
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
}
