import { TFile, View } from 'obsidian';
import { PathSuggest } from './path-suggest';
import { MediaLoader } from 'personal-library/media-loader';

export class MediaPathSuggest extends PathSuggest {
    constructor(
        view: View,
        public inputEl: HTMLInputElement,
        public OnSelect: (value: TFile) => Promise<void>,
        public loader: MediaLoader,
        public mediaDiv: HTMLDivElement
    ) {
        super(view, inputEl, OnSelect, MediaLoader.validFileTypes);
    }

    protected override async ClassSpecificOnSelect(file: TFile) {
        MediaLoader.load(this.mediaDiv, this.vault, file.path);
    }
}
abstract class ImagePathSuggest extends PathSuggest {
    constructor(
        view: View,
        public inputEl: HTMLInputElement,
        public OnSelect: (value: TFile) => Promise<void>,
        public loader: MediaLoader,
        public img: HTMLImageElement
    ) {
        super(view, inputEl, OnSelect, MediaLoader.imageFileTypes);
    }

    protected override async ClassSpecificOnSelect(file: TFile) {
        MediaLoader.loadImage(this.img, this.vault, file.path);
    }
}
abstract class VideoPathSuggest extends PathSuggest {
    constructor(
        view: View,
        public inputEl: HTMLInputElement,
        public OnSelect: (value: TFile) => Promise<void>,
        public loader: MediaLoader,
        public vid: HTMLVideoElement
    ) {
        super(view, inputEl, OnSelect, MediaLoader.imageFileTypes);
    }

    protected override async ClassSpecificOnSelect(file: TFile) {
        MediaLoader.loadVideo(this.vid, this.vault, file.path);
    }
}
abstract class AudioPathSuggest extends PathSuggest {
    constructor(
        view: View,
        public inputEl: HTMLInputElement,
        public OnSelect: (value: TFile) => Promise<void>,
        public loader: MediaLoader,
        public aud: HTMLAudioElement
    ) {
        super(view, inputEl, OnSelect, MediaLoader.imageFileTypes);
    }

    protected override async ClassSpecificOnSelect(file: TFile) {
        MediaLoader.loadAudio(this.aud, this.vault, file.path);
    }
}