import * as StreamZip from 'node-stream-zip';
import { promises as fsPromises, existsSync, mkdirSync, rmSync } from 'fs';
import { App, normalizePath, Notice } from 'obsidian';
import * as path from 'path';

export class ZipExtractor {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Распаковывает ZIP-архив во временную директорию.
     * @param zipFilePath Полный путь к ZIP-файлу.
     * @param tempDirName Имя временной папки (будет создана в системной временной директории).
     * @returns Путь к созданной временной директории с распакованным содержимым или null в случае ошибки.
     */
    async extract(zipFilePath: string, tempDirName: string): Promise<string | null> {
        try {
            // Создаем уникальную временную директорию
            const os = require('os');
            const tempDirPathOs = os.tmpdir();
            const uniqueTempDir = path.join(tempDirPathOs, 'krisp-importer-temp', tempDirName + '_' + Date.now());

            // Создаем родительскую папку если не существует
                const parentTempDir = path.join(tempDirPathOs, 'krisp-importer-temp');
                if (!existsSync(parentTempDir)) {
                    mkdirSync(parentTempDir, { recursive: true });
                }

            // Создаем временную папку для этого архива
            if (!existsSync(uniqueTempDir)) {
                mkdirSync(uniqueTempDir, { recursive: true });
            }

            // Открываем ZIP-архив с node-stream-zip
            const zip = new StreamZip.async({ file: zipFilePath });

            try {
                // Получаем список всех файлов в архиве
                const entries = await zip.entries();

                // Извлекаем каждый файл
                for (const [entryName, entry] of Object.entries(entries)) {
                    if (!entry.isDirectory) {
                        const filePath = normalizePath(path.join(uniqueTempDir, entryName));

                        // Создаем директорию для файла если не существует
                    const dirName = path.dirname(filePath);
                    if (!existsSync(dirName)) {
                        mkdirSync(dirName, { recursive: true });
                    }

                        // Извлекаем файл
                        const fileData = await zip.entryData(entryName);
                    await fsPromises.writeFile(filePath, fileData);
                }
            }

            console.log(`Successfully extracted to ${uniqueTempDir}`);
            return uniqueTempDir;

            } finally {
                // Обязательно закрываем ZIP-архив
                await zip.close();
            }

        } catch (error) {
            new Notice('Error extracting ZIP file: ' + error.message);
            console.error('Error extracting ZIP file:', error);
            return null;
        }
    }

    \**
    ['* /**', '*  * Asynchronously removes a temporary directory and its contents.', '*  *', '*  * This function checks if the provided `tempDirPath` exists, then proceeds to remove', '*  * it recursively using `rmSync`. If an error occurs during removal, a notice is displayed,', '*  * and the error is logged. Non-critical errors are caught to prevent interruption of', '*  * further execution.', '*  *', '*  * @param tempDirPath - The path to the temporary directory that needs to be cleaned up.', '*  */']
    \*
    async cleanup(tempDirPath: string | null): Promise<void> {
        if (!tempDirPath) return;

        try {
            if (existsSync(tempDirPath)) {
                rmSync(tempDirPath, { recursive: true, force: true });
                console.log(`Successfully cleaned up temp directory: ${tempDirPath}`);
            }
        } catch (error) {
            new Notice('Error cleaning up temporary directory: ' + error.message);
            console.error('Error cleaning up temporary directory:', error);
            // Не критическая ошибка, продолжаем работу
        }
    }
}
