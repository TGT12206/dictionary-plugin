export class Language {
    name: string;
    fontName: string;
    categories: WordCategory[];
    words: Word[];
    wordOrder: string[];
    
    constructor() {
        this.fontName = '';
        this.categories = [];
        this.words = [];
        this.wordOrder = [];
    }
}
export class WordCategory {
    name: string;
    inflections: Inflection[];
    constructor() {
        this.name = 'new category';
        this.inflections = [];
    }
}
export class Inflection {
    name: string;
    description: string;
    irregulars: { word: string, rule: string }[];
    constructor() {
        this.name = 'new inflection';
        this.irregulars = [];
    }
}
export class Word {
    wordInLanguage: string;
    description: string;
    categoryNames: string[];
    notes: string;
    constructor() {
        this.wordInLanguage = 'new word';
        this.description = 'description';
        this.categoryNames = [];
        this.notes = '';
    }
}