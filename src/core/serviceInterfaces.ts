import { TFile, App } from 'obsidian';
import { KrispImporterSettings, ParsedKrispData } from '../interfaces';
import { LogLevel } from './LoggingService';
import { PluginStatus } from './StatusBarService';

// ========================================================================================
// БАЗОВЫЕ ТИПЫ ДЛЯ ПЕРЕДАЧИ ДАННЫХ МЕЖДУ СЕРВИСАМИ
// ========================================================================================

export interface MeetingFolder {
    name: string;
    path: string;
    files: string[];
}

export interface ExtractionResult {
    tempDirPath: string;
    meetingFolders: MeetingFolder[];
}

export interface ParsingResult {
    parsedData: ParsedKrispData;
    audioFilePath: string;
    meetingFolderName: string;
}

export interface ImportResult {
    notePath?: string;
    audioDestPath?: string;
    noteFile?: TFile;
}

export interface ProcessingResult {
    importedCount: number;
    errorCount: number;
    lastCreatedNote: ImportResult | null;
}

export interface StreamingOptions {
    chunkSize?: number;
    maxMemoryUsage?: number;
    progressCallback?: (progress: number) => void;
}

// ========================================================================================
// ИНТЕРФЕЙСЫ ОСНОВНЫХ СЕРВИСОВ
// ========================================================================================

export interface INotificationService {
    showInfo(message: string): void;
    showError(message: string): void;
    showWarning(message: string): void;
    showBatchImportResult(imported: number, errors: number, skipped: number, zipFileName: string): void;
}

export interface ILoggingService {
    debug(category: string, message: string, details?: any): void;
    info(category: string, message: string, details?: any): void;
    warn(category: string, message: string, details?: any): void;
    error(category: string, message: string, details?: any): void;
    handleError(category: string, message: string, error: any): void;
    getLogs(level?: any): any[];
    clearLogs(): void;
    logZipProcessingStart(zipPath: string): void;
    logZipProcessingEnd(zipPath: string, success: boolean): void;
}

export interface IStatusBarService {
    setIdle(message?: string): void;
    setWatching(path: string): void;
    setProcessing(fileName?: string): void;
    setError(message: string): void;
    getCurrentStatus(): PluginStatus;
}

export interface IZipExtractor {
    extract(zipFilePath: string, tempDirName?: string): Promise<string | null>;
    cleanup(tempDirPath: string): Promise<void>;
}

export interface INoteParser {
    parseMeetingNotes(notesContent: string, transcriptContent: string, meetingFolderName: string): ParsedKrispData;
    parseTranscript(transcriptContent: string): { participants: string[], formattedTranscript: string, duration: string };

    // Новые методы для оптимизации больших файлов
    parseTranscriptStreaming(filePath: string, options?: StreamingOptions): Promise<{ participants: string[], formattedTranscript: string, duration: string }>;
    parseLargeFileContent(filePath: string, maxSizeBytes: number): Promise<string>;
}

export interface INoteCreator {
    createNote(parsedData: ParsedKrispData, originalAudioPath?: string): Promise<ImportResult>;
}

// ========================================================================================
// ИНТЕРФЕЙСЫ НОВЫХ СПЕЦИАЛИЗИРОВАННЫХ СЕРВИСОВ
// ========================================================================================

export interface IMeetingExtractionService {
    extractZipFile(zipFilePath: string): Promise<ExtractionResult>;
    discoverMeetingFolders(tempDirPath: string): Promise<MeetingFolder[]>;
    validateMeetingFolder(folderPath: string): Promise<boolean>;
    findAudioFiles(folderPath: string): Promise<string[]>;
}

export interface IMeetingParsingService {
    parseAllMeetings(meetingFolders: MeetingFolder[], tempDirPath: string): Promise<ParsingResult[]>;
    parseSingleMeeting(meetingFolder: MeetingFolder, tempDirPath: string): Promise<ParsingResult>;
    validateParsedData(parsedData: ParsedKrispData): boolean;
}

export interface IMeetingImportService {
    importParsedMeetings(parsingResults: ParsingResult[], settings: KrispImporterSettings): Promise<ProcessingResult>;
    importSingleMeeting(parsingResult: ParsingResult, settings: KrispImporterSettings): Promise<ImportResult>;
    handlePostImportActions(result: ProcessingResult, zipFilePath: string, settings: KrispImporterSettings): Promise<void>;
}

export interface IErrorHandlingService {
    handleExtractionError(error: any, context: string): void;
    handleParsingError(error: any, meetingName: string): void;
    handleImportError(error: any, meetingName: string): void;
    handleCriticalError(error: any, context: string): void;
    logError(category: string, message: string, error: any): void;
}

// ========================================================================================
// ИНТЕРФЕЙС ОРКЕСТРАТОРА
// ========================================================================================

export interface IProcessingOrchestrator {
    processZipFile(zipFilePath: string, settings: KrispImporterSettings): Promise<void>;
    processZipFileWithProgress(zipFilePath: string, settings: KrispImporterSettings, progressCallback?: (stage: string, progress: number) => void): Promise<void>;
    isReady(): boolean;
}

// ========================================================================================
// IOC КОНТЕЙНЕР ИНТЕРФЕЙСЫ
// ========================================================================================

export interface ServiceIdentifier<T = any> {
    name: string;
}

export interface IServiceContainer {
    register<T>(identifier: ServiceIdentifier<T>, factory: () => T): void;
    registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: () => T): void;
    registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void;
    resolve<T>(identifier: ServiceIdentifier<T>): T;
    isRegistered<T>(identifier: ServiceIdentifier<T>): boolean;
    getRegisteredServices(): string[];
    dispose(): void;
}

// ========================================================================================
// SERVICE IDENTIFIERS (токены для dependency injection)
// ========================================================================================

export const SERVICE_IDENTIFIERS = {
    // Основные сервисы
    App: { name: 'App' } as ServiceIdentifier<App>,
    NotificationService: { name: 'NotificationService' } as ServiceIdentifier<INotificationService>,
    LoggingService: { name: 'LoggingService' } as ServiceIdentifier<ILoggingService>,
    StatusBarService: { name: 'StatusBarService' } as ServiceIdentifier<IStatusBarService>,
    ZipExtractor: { name: 'ZipExtractor' } as ServiceIdentifier<IZipExtractor>,
    NoteParser: { name: 'NoteParser' } as ServiceIdentifier<INoteParser>,
    NoteCreator: { name: 'NoteCreator' } as ServiceIdentifier<INoteCreator>,

    // Новые специализированные сервисы
    MeetingExtractionService: { name: 'MeetingExtractionService' } as ServiceIdentifier<IMeetingExtractionService>,
    MeetingParsingService: { name: 'MeetingParsingService' } as ServiceIdentifier<IMeetingParsingService>,
    MeetingImportService: { name: 'MeetingImportService' } as ServiceIdentifier<IMeetingImportService>,
    ErrorHandlingService: { name: 'ErrorHandlingService' } as ServiceIdentifier<IErrorHandlingService>,

    // Оркестратор
    ProcessingOrchestrator: { name: 'ProcessingOrchestrator' } as ServiceIdentifier<IProcessingOrchestrator>,

    // Функции-провайдеры
    SettingsProvider: { name: 'SettingsProvider' } as ServiceIdentifier<() => KrispImporterSettings>
} as const;
