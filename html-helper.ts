import { ItemView, setIcon } from "obsidian";

export class HTMLHelper {
    static AutoAdjustWidth(cleanDiv: HTMLDivElement, el: HTMLElement, text: string) {
        const tempEl = cleanDiv.createEl('div', { text: text } );
        tempEl.style.position = 'absolute';
        tempEl.style.whiteSpace = 'pre-wrap';
        tempEl.style.visibility = 'hidden';
        tempEl.style.font = el.style.font;
        tempEl.style.fontSize = el.style.fontSize;
        tempEl.style.writingMode = el.style.writingMode;
        tempEl.style.textOrientation = el.style.textOrientation;
        tempEl.style.padding = '1vh';
        const temp = tempEl.getBoundingClientRect();

        el.style.width = temp.width + 'px';

        tempEl.remove();
    }
    static AutoAdjustHeight(cleanDiv: HTMLDivElement, el: HTMLElement, text: string) {
        const tempEl = cleanDiv.createEl('div', { text: text } );
        tempEl.style.position = 'absolute';
        tempEl.style.whiteSpace = 'pre-wrap';
        tempEl.style.visibility = 'hidden';
        tempEl.style.font = el.style.font;
        tempEl.style.fontSize = el.style.fontSize;
        tempEl.style.writingMode = el.style.writingMode;
        tempEl.style.textOrientation = el.style.textOrientation;
        tempEl.style.padding = '1vh';
        const temp = tempEl.getBoundingClientRect();

        el.style.height = temp.height + 'px';

        tempEl.remove();
    }
    static AddTextToDiv(div: HTMLDivElement, text: string) {
        div.textContent = text;
    }
    static CreateNewTextDiv(parentDiv: HTMLDivElement, text: string, classes: string = ''): HTMLDivElement {
        const newDiv = parentDiv.createEl('div', { text: text } );
        newDiv.className = classes;
        return newDiv;
    }
    static async CreateList(
        div: HTMLDivElement,
        extraDivClasses: string,
        listIsVertical: boolean,
        mainArray: any[],
        objUIMaker: (
            div: HTMLDivElement,
            index: number
        ) => (void | Promise<void>)
    ) {
        div.empty();
        div.className = (listIsVertical ? 'vbox' : 'hbox') + ' ' + extraDivClasses;
        for (let i = 0; i < mainArray.length; i++) {
            objUIMaker(div.createDiv(!listIsVertical ? 'vbox' : 'hbox'), i);
        }
    }
    static async CreateListEditor(
        div: HTMLDivElement,
        extraDivClasses: string,
        listIsVertical: boolean,
        view: ItemView,
        mainArray: any[],
        newObjMaker: () => (any | Promise<any>),
        objUIMaker: (
            div: HTMLDivElement,
            index: number,
            refreshList: () => Promise<void>,
            refreshPage: () => Promise<void>
        ) => (void | Promise<void>),
        refreshPage: () => Promise<void>
    ) {
        div.empty();
        div.className = (listIsVertical ? 'vbox' : 'hbox') + ' ' + extraDivClasses;
        const listDiv = div.createDiv((listIsVertical ? 'vbox' : 'hbox') + ' ' + extraDivClasses);

        const refreshList = async () => {
            this.CreateListEditor(
                div, extraDivClasses, listIsVertical,
                view,
                mainArray, newObjMaker, objUIMaker,
                refreshPage
            );
        }
        
        for (let i = 0; i < mainArray.length; i++) {
            objUIMaker(listDiv.createDiv(!listIsVertical ? 'vbox' : 'hbox'), i, refreshList, refreshPage);
        }
        const addButton = div.createEl('button');
        setIcon(addButton, 'plus');
        view.registerDomEvent(addButton, 'click', async () => {
            const index = mainArray.length;
            mainArray.push( await newObjMaker() );
            await objUIMaker(listDiv.createDiv(!listIsVertical ? 'vbox' : 'hbox'), index, refreshList, refreshPage);
        });
    }
    static CreateColorSwapButton(
        parentDiv: HTMLDivElement,
        view: ItemView,
        color1: { name: string, el: HTMLInputElement },
        color2: { name: string, el: HTMLInputElement },
        isVertical: boolean = false,
        afterSwap: () => Promise<void>
    ) {
		const div = parentDiv.createDiv(isVertical ? 'vbox' : 'hbox');
        
        const obj1Name = this.CreateNewTextDiv(div, color1.name);
        const swapButton = div.createEl('button')
        const obj2Name = this.CreateNewTextDiv(div, color2.name);

		setIcon(swapButton, isVertical ? 'arrow-down-up' : 'arrow-left-right');

        obj1Name.style.writingMode = isVertical ? 'vertical-lr' : 'unset';
        obj2Name.style.writingMode = isVertical ? 'vertical-lr' : 'unset';

        obj1Name.style.textOrientation = isVertical ? 'upright' : 'unset';
        obj2Name.style.textOrientation = isVertical ? 'upright' : 'unset';

		view.registerDomEvent(swapButton, 'click', () => {
            const temp = color1.el.value;
            color1.el.value = color2.el.value;
            color2.el.value = temp;
            afterSwap();
		});
    }
    static CreateShiftElementUpButton(
        div: HTMLDivElement,
        view: ItemView,
        mainArray: any[],
        index: number,
        listIsVertical: boolean,
        refreshList: () => Promise<void>
    ) {
		const upButton = div.createEl('button');
		setIcon(upButton, listIsVertical ? 'arrow-big-up' : 'arrow-big-left');
		view.registerDomEvent(upButton, 'click', () => {
			if (index > 0) {
				const temp = mainArray.splice(index, 1);
				mainArray.splice(index - 1, 0, temp[0]);
				refreshList();
			}
		});
    }
    static CreateShiftElementDownButton(
        div: HTMLDivElement,
        view: ItemView,
        mainArray: any[],
        index: number,
        listIsVertical: boolean,
        refreshList: () => Promise<void>
    ) {
		const downButton = div.createEl('button');
		setIcon(downButton, listIsVertical ? 'arrow-big-down' : 'arrow-big-right');
		view.registerDomEvent(downButton, 'click', () => {
			if (index < mainArray.length) {
				const temp = mainArray.splice(index, 1);
				mainArray.splice(index + 1, 0, temp[0]);
				refreshList();
			}
		});
    }
    static CreateDeleteButton(
        div: HTMLDivElement,
        view: ItemView,
        mainArray: any[],
        index: number,
        refreshList: () => Promise<void>
    ) {
		const deleteButton = div.createEl('button');
        deleteButton.className = 'remove-button';
        setIcon(deleteButton, 'trash-2');
		view.registerDomEvent(deleteButton, 'click', () => {
			mainArray.splice(index, 1);
			refreshList();
		});
    }
    static CreateExitButton(
        div: HTMLDivElement,
        view: ItemView,
        beforeExit: () => Promise<void> = async () => {},
        afterExit: () => Promise<void> = async () => {}
    ) {
		const exitButton = div.createEl('button');
        exitButton.className = 'exit-button';
        setIcon(exitButton, 'x');
		view.registerDomEvent(exitButton, 'click', async () => {
            await beforeExit();
            div.remove();
            afterExit();
		});
    }
}