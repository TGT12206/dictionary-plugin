import { Notice, Vault } from "obsidian";

export class MediaLoader {
    static customClasses: string[] = ['story-media'];

    static get validFileTypes() {
        const output: string[] = [];
        
        const imgTypes = this.imageFileTypes;
        const vidTypes = this.videoFileTypes;
        const audTypes = this.audioFileTypes;

        for (let i = 0; i < imgTypes.length; i++) {
            output.push(imgTypes[i]);
        }
        for (let i = 0; i < vidTypes.length; i++) {
            output.push(vidTypes[i]);
        }
        for (let i = 0; i < audTypes.length; i++) {
            output.push(audTypes[i]);
        }
        return output;
    }

    static isValid(extension: string) {
        return this.validFileTypes.contains(extension.toLowerCase());
    }
    static isImage(extension: string) {
        return this.imageFileTypes.contains(extension.toLowerCase());
    }
    static isVideo(extension: string) {
        return this.videoFileTypes.contains(extension.toLowerCase());
    }
    static isAudio(extension: string) {
        return this.audioFileTypes.contains(extension.toLowerCase());
    }

    static get imageFileTypes() {
        return [
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'avif', 'heic', 'ico'
        ]
    };

    static get videoFileTypes() {
        return [
            'mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'flv', 'mpg', 'mpeg'
        ]
    };

    static get audioFileTypes() {
        return [
            'mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'aiff', 'wma'
        ]
    };

    static load(mediaDiv: HTMLDivElement, vault: Vault, path: string) {
        mediaDiv.empty();
        const src = this.getSrc(vault, path);
        
        const extension = path.split('.').last();

        if (extension === undefined) {
            new Notice('No extension found in ' + path);
            throw new Error('No extension found in ' + path);
        }

        let mediaEl;
        if (MediaLoader.isImage(extension)) {
            mediaEl = mediaDiv.createEl('img');
        } else if (MediaLoader.isVideo(extension)) {
            mediaEl = mediaDiv.createEl('video');
            mediaEl.loop = true;
        } else {
            mediaEl = mediaDiv.createEl('audio');
            mediaEl.loop = true;
        }
        for (const className of this.customClasses) {
            mediaEl.classList.add(className);
        }
        mediaEl.src = src;
    }

    static getSrc(vault: Vault, path: string) {
        const tFile = vault.getFileByPath(path);
        if (tFile === null) {
            throw new Error('File not found at ' + path);
        }
        const url = vault.getResourcePath(tFile);
        return url;
    }

    private static loadSpecific(
        el: HTMLImageElement | HTMLVideoElement | HTMLAudioElement,
        vault: Vault,
        path: string,
        validExtension: (extension: string) => boolean,
        type: string
    ) {
        const src = this.getSrc(vault, path);
        
        const extension = path.split('.').last();

        if (extension === undefined) {
            new Notice('No extension found in ' + path);
            throw new Error('No extension found in ' + path);
        }
        if (!validExtension(extension)) {
            new Notice(path + ' is not a supported ' + type + ' extension');
            throw new Error(path + ' is not a supported ' + type + ' extension');
        }
        el.src = src;
    }

    static loadImage(img: HTMLImageElement, vault: Vault, path: string) {
        this.loadSpecific(img, vault, path, MediaLoader.isImage, 'image');
    }
    static loadVideo(vid: HTMLVideoElement, vault: Vault, path: string) {
        this.loadSpecific(vid, vault, path, MediaLoader.isVideo, 'video');
    }
    static loadAudio(aud: HTMLAudioElement, vault: Vault, path: string) {
        this.loadSpecific(aud, vault, path, MediaLoader.isAudio, 'audio');
    }
}