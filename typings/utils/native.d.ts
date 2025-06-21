/**
 * Loads and handles functionality related to shared library management.
 */
import { TlsNativeLibrary } from "../interface/native";
export declare class LibraryHandler {
    private static path;
    static validateFile(): Promise<void>;
    static retrieveLibrary(): TlsNativeLibrary;
    private static retrieveFileInfo;
}
