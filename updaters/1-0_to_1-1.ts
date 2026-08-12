import { Dict, Entry } from "plugin-specific/dict";
import { Language } from "plugin-specific/language";

export class Updater {
    static Update(lang: Language): Dict {
        const dict = new Dict();

        dict.font = lang.fontName;
        dict.tx = lang.langColor;
        dict.bd = lang.langBorderColor;
        dict.bg = lang.langBackgroundColor;
        dict.categories = lang.categories.map((c) => c.name);
        dict.order = lang.wordOrder;
        for (const word of lang.words) {
            const e = new Entry();
            e.categories = word.categoryNames;
            e.definitions = word.descriptions;
            dict.add(word.wordInLanguage, e);
        }

        return dict;
    }
}