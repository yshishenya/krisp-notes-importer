import * as JSZip from 'jszip';
import { promises as fsPromises, existsSync, mkdirSync, rmSync } from 'fs'; // Используем fs.promises для асинхронных операций
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
            const data = await fsPromises.readFile(zipFilePath);
            const zip = await JSZip.loadAsync(data);

            // Использование системной временной директории Obsidian (если доступно и безопасно)
            // или создание своей временной папки.
            // Для простоты создадим подпапку в папке плагина, если это разрешено.
            // Важно: обеспечить очистку этой папки!
            // Более надежный подход - использовать os.tmpdir() из Node.js,
            // но это может потребовать дополнительных разрешений или адаптации для Obsidian.

            // Пока что создадим временную папку относительно корня хранилища, если это безопаснее
            // или используем системную временную директорию, если это возможно через адаптер Obsidian

            // Давайте создадим временную папку внутри папки плагина, так как это более контролируемо
            // и Obsidian обычно разрешает плагинам писать в их собственные директории.
            // const pluginDataDir = this.app.vault.configDir + "/plugins/" + this.app.manifest.id;
            // Это неверно, configDir это .obsidian, а не сама папка плагина
            // Используем adapter.getResourcePath('.') чтобы получить путь к папке плагина не получится, это для чтения.

            // Самый простой и надежный способ создать временную папку - использовать системную временную директорию Node.js
            // Для этого нужен доступ к 'os' модулю, который может быть не всегда доступен напрямую в Obsidian.
            // Попробуем создать ее внутри vault, но это не идеально для временных файлов.
            // Лучше использовать системную временную папку.
            // Так как мы в Node.js окружении (esbuild), 'os' должен быть доступен.
            // Однако, для кроссплатформенности и безопасности в Obsidian, лучше использовать API Obsidian если оно есть для этого.
            // Если нет, то можно попробовать создать временную папку в директории плагина (если она доступна для записи).

            // Упрощенный вариант: создаем временную папку в корне хранилища (требует осторожности и очистки)
            // Это не лучший вариант, так как загрязняет корень.

            // Давайте остановимся на создании временной папки в системной временной директории,
            // если это возможно, или будем использовать более контролируемое место.
            // Для Obsidian плагинов, которые работают в Node.js контексте esbuild, `os.tmpdir()` должен быть доступен.
            // Но fs API из 'fs' может быть ограничен. Obsidian предоставляет `app.vault.adapter`.

            // Если мы используем `original-fs` через адаптер Obsidian, то `os.tmpdir()` может не работать как ожидается.
            // Поэтому, создадим временную папку внутри папки плагина.
            // Это требует, чтобы плагин мог писать в свою директорию.
            // Это не всегда так для упакованных плагинов.

            // Используем временную директорию, предоставляемую OS, через Node.js 'os' и 'path' модули
            // Это наиболее стандартный подход для Node.js приложений.
            const os = require('os'); // Потребует 'os' в whitelist, если он есть
            const tempDirPathOs = os.tmpdir();
            const uniqueTempDir = path.join(tempDirPathOs, 'krisp-importer-temp', tempDirName + '_' + Date.now());

            if (!existsSync(uniqueTempDir)) {
                // fsPromises.mkdir(uniqueTempDir, { recursive: true }); // Не работает с fs из Obsidian adapter
                // Используем синхронное создание папки, так как это критично для дальнейших операций
                // и происходит один раз.
                // Для рекурсивного создания лучше использовать более надежный метод или библиотеку.
                // Но для простоты, создадим сначала родительскую, потом дочернюю.
                const parentTempDir = path.join(tempDirPathOs, 'krisp-importer-temp');
                if (!existsSync(parentTempDir)) {
                    mkdirSync(parentTempDir, { recursive: true });
                }
                mkdirSync(uniqueTempDir, { recursive: true });
            }

            for (const filename in zip.files) {
                if (!zip.files[filename].dir) { // Пропускаем директории
                    const fileData = await zip.files[filename].async('nodebuffer');
                    const filePath = normalizePath(path.join(uniqueTempDir, filename));
                    // Убедимся, что директория для файла существует
                    const dirName = path.dirname(filePath);
                    if (!existsSync(dirName)) {
                        mkdirSync(dirName, { recursive: true });
                    }
                    await fsPromises.writeFile(filePath, fileData);
                }
            }
            console.log(`Successfully extracted to ${uniqueTempDir}`);
            return uniqueTempDir;
        } catch (error) {
            new Notice('Error extracting ZIP file: ' + error.message);
            console.error('Error extracting ZIP file:', error);
            return null;
        }
    }

    /**
     * Удаляет временную директорию и ее содержимое.
     * @param tempDirPath Путь к временной директории.
     */
    async cleanup(tempDirPath: string | null): Promise<void> {
        if (!tempDirPath) return;

        try {
            if (existsSync(tempDirPath)) {
                // await fsPromises.rm(tempDirPath, { recursive: true, force: true }); // rm из Node.js, может не работать с адаптером
                rmSync(tempDirPath, { recursive: true, force: true }); // Используем синхронную версию для простоты и надежности очистки
                console.log(`Successfully cleaned up temp directory: ${tempDirPath}`);
            }
        } catch (error) {
            new Notice('Error cleaning up temporary directory: ' + error.message);
            console.error('Error cleaning up temporary directory:', error);
            // Не критическая ошибка, продолжаем работу
        }
    }
}
