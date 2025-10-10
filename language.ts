export class Language {
    name: string;
    fontName: string;
    langColor: string;
    langBorderColor: string;
    langBackgroundColor: string;
    categories: WordCategory[];
    words: Word[];
    wordOrder: string[];
    
    constructor() {
        this.name = '';
        this.fontName = '';
        this.langColor = '#ffffff';
        this.langBorderColor = '#8a5cf5';
        this.langBackgroundColor = '#000000';
        this.categories = [];
        this.words = [];
        this.wordOrder = [];
    }
}
export class WordCategory {
    name: string;
    constructor() {
        this.name = 'new category';
    }
}
export class Word {
    wordInLanguage: string;
    categoryNames: string[];
    descriptions: string[];
    constructor() {
        this.wordInLanguage = 'new word';
        this.categoryNames = [];
        this.descriptions = ['description'];
    }
}