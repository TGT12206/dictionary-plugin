import { ItemView, setIcon } from "obsidian";

export class HTMLHelper {
    static AutoAdjustTextInput(cleanDiv: HTMLDivElement, input: HTMLInputElement, isVertical: boolean) {
        const tempEl = cleanDiv.createEl('div', { text: input.value } );
        tempEl.style.position = 'absolute';
        tempEl.style.whiteSpace = 'nowrap';
        tempEl.style.visibility = 'hidden';
        tempEl.style.font = input.style.font;
        tempEl.style.fontSize = input.style.fontSize;
        tempEl.style.writingMode = input.style.writingMode;
        tempEl.style.textOrientation = input.style.textOrientation;
        tempEl.style.padding = '1vh';
        const temp = tempEl.getBoundingClientRect();

        if (isVertical) {
            input.style.width = 'fit-content';
            input.style.height = temp.height + 'px';
        } else {
            input.style.height = 'fit-content';
            input.style.width = temp.width + 'px';
        }

        tempEl.remove();
    }
    static AutoAdjustTextArea(cleanDiv: HTMLDivElement, area: HTMLTextAreaElement, isVertical: boolean) {
        const tempEl = cleanDiv.createEl('div', { text: area.value } );
        tempEl.style.position = 'absolute';
        tempEl.style.whiteSpace = 'pre-wrap';
        tempEl.style.visibility = 'hidden';
        tempEl.style.font = area.style.font;
        tempEl.style.fontSize = area.style.fontSize;
        tempEl.style.writingMode = area.style.writingMode;
        tempEl.style.textOrientation = area.style.textOrientation;
        const currAreaRect = area.getBoundingClientRect();
        if (isVertical) {
            tempEl.style.height = currAreaRect.height + 'px';
        } else {
            tempEl.style.width = currAreaRect.width + 'px';
        }
        tempEl.style.padding = '1vh';
        const temp = tempEl.getBoundingClientRect();

        if (isVertical) {
            area.style.width = temp.width + 'px';
        } else {
            area.style.height = temp.height + 'px';
        }
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
            await objUIMaker(div.createDiv(), i);
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
        for (let i = 0; i < mainArray.length; i++) {
            await objUIMaker(div.createDiv(), i, async () => {
                this.CreateListEditor(
                    div, extraDivClasses, listIsVertical,
                    view,
                    mainArray, newObjMaker, objUIMaker,
                    refreshPage
                );
            },
            refreshPage);
        }
        const addButton = div.createEl('button', { text: '+' } );
        view.registerDomEvent(addButton, 'click', () => {
            mainArray.push( newObjMaker() );
            this.CreateListEditor(
                div, extraDivClasses, listIsVertical,
                view,
                mainArray, newObjMaker, objUIMaker,
                refreshPage
            );
        });
    }
    static async CreateShiftElementUpButton(
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
    static async CreateShiftElementDownButton(
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
    static async CreateDeleteButton(
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
}