import { FileInfo } from "../interface/native";
export declare class LibraryDownloader {
    private static file;
    private static path;
    private static readonly issueURL;
    static retrieveLibrary(file: FileInfo, libPath: string): Promise<boolean>;
    private static formatBytes;
    private static progress;
    private static download;
    private static extract;
    private static getLatest;
}
