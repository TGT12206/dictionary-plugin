export function BoxClass(isVertical: boolean) {
    return isVertical ? 'vbox' : 'hbox';
}

export function CreateNewTextDiv(parentDiv: HTMLDivElement, text: string, classes: string = ''): HTMLDivElement {
    const newDiv = parentDiv.createEl('div', { text: text, cls: 'text-div ' + classes } );
    return newDiv;
}