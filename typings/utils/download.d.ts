export declare class Download {
    private temp;
    private file;
    private path;
    private issueURL;
    constructor(file: {
        name: string;
        downloadName: string;
    }, libPath: string);
    init(): Promise<void>;
    private formatBytes;
    private progress;
    private download;
    private extract;
    private getLatest;
}
