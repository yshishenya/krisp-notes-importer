import { App, Plugin } from 'obsidian';
import { IServiceContainer, SERVICE_IDENTIFIERS } from './serviceInterfaces';
import { KrispImporterSettings } from '../interfaces';

// Основные сервисы
import { NotificationService } from './NotificationService';
import { LoggingService, LogLevel } from './LoggingService';
import { StatusBarService } from './StatusBarService';
import { ZipExtractor } from './ZipExtractor';
import { NoteParser } from './NoteParser';
import { NoteCreator } from './NoteCreator';

// Новые специализированные сервисы
import { MeetingExtractionService } from './MeetingExtractionService';
import { MeetingParsingService } from './MeetingParsingService';
import { MeetingImportService } from './MeetingImportService';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ProcessingOrchestrator } from './ProcessingOrchestrator';

/**
 * Конфигурация IoC контейнера для плагина Krisp Notes Importer
 *
 * Здесь регистрируются все сервисы с их зависимостями в правильном порядке.
 * Использует dependency injection pattern для лучшей архитектуры и тестируемости.
 */
export class ServiceConfiguration {
    /**
     * Настраивает и регистрирует все сервисы в контейнере
     */
        static configure(
        container: IServiceContainer,
        app: App,
        settingsProvider: () => KrispImporterSettings,
        plugin: Plugin
    ): void {
        // =====================================================================================
        // РЕГИСТРАЦИЯ БАЗОВЫХ ЗАВИСИМОСТЕЙ
        // =====================================================================================

        // App экземпляр Obsidian
        container.registerInstance(SERVICE_IDENTIFIERS.App, app);

        // Провайдер настроек
        container.registerInstance(SERVICE_IDENTIFIERS.SettingsProvider, settingsProvider);

        // =====================================================================================
        // РЕГИСТРАЦИЯ ОСНОВНЫХ СЕРВИСОВ (БЕЗ ЗАВИСИМОСТЕЙ)
        // =====================================================================================

        // NotificationService - без зависимостей
        container.registerSingleton(SERVICE_IDENTIFIERS.NotificationService, () => {
            return new NotificationService();
        });

                // LoggingService - без зависимостей
        container.registerSingleton(SERVICE_IDENTIFIERS.LoggingService, () => {
            return new LoggingService(LogLevel.INFO) as any;
        });

        // StatusBarService - зависит только от plugin
        container.registerSingleton(SERVICE_IDENTIFIERS.StatusBarService, () => {
            return new StatusBarService(plugin);
        });

        // ZipExtractor - зависит только от App
        container.registerSingleton(SERVICE_IDENTIFIERS.ZipExtractor, () => {
            const app = container.resolve(SERVICE_IDENTIFIERS.App);
            return new ZipExtractor(app);
        });

        // NoteParser - без зависимостей
        container.registerSingleton(SERVICE_IDENTIFIERS.NoteParser, () => {
            return new NoteParser();
        });

        // =====================================================================================
        // РЕГИСТРАЦИЯ СЕРВИСОВ СО СЛОЖНЫМИ ЗАВИСИМОСТЯМИ
        // =====================================================================================

        // ErrorHandlingService - зависит от базовых сервисов
        container.registerSingleton(SERVICE_IDENTIFIERS.ErrorHandlingService, () => {
            const notificationService = container.resolve(SERVICE_IDENTIFIERS.NotificationService);
            const loggingService = container.resolve(SERVICE_IDENTIFIERS.LoggingService);
            const statusBarService = container.resolve(SERVICE_IDENTIFIERS.StatusBarService);

            return new ErrorHandlingService(notificationService, loggingService, statusBarService);
        });

        // NoteCreator - зависит от App и настроек (создается при каждом использовании)
        container.register(SERVICE_IDENTIFIERS.NoteCreator, () => {
            const app = container.resolve(SERVICE_IDENTIFIERS.App);
            const settingsProvider = container.resolve(SERVICE_IDENTIFIERS.SettingsProvider);
            const settings = settingsProvider();

            return new NoteCreator(app, settings);
        });

        // =====================================================================================
        // РЕГИСТРАЦИЯ СПЕЦИАЛИЗИРОВАННЫХ СЕРВИСОВ
        // =====================================================================================

        // MeetingExtractionService
        container.registerSingleton(SERVICE_IDENTIFIERS.MeetingExtractionService, () => {
            const zipExtractor = container.resolve(SERVICE_IDENTIFIERS.ZipExtractor);
            const errorHandlingService = container.resolve(SERVICE_IDENTIFIERS.ErrorHandlingService);

            return new MeetingExtractionService(zipExtractor, errorHandlingService);
        });

        // MeetingParsingService
        container.registerSingleton(SERVICE_IDENTIFIERS.MeetingParsingService, () => {
            const noteParser = container.resolve(SERVICE_IDENTIFIERS.NoteParser);
            const errorHandlingService = container.resolve(SERVICE_IDENTIFIERS.ErrorHandlingService);

            return new MeetingParsingService(noteParser, errorHandlingService);
        });

        // MeetingImportService
        container.registerSingleton(SERVICE_IDENTIFIERS.MeetingImportService, () => {
            const app = container.resolve(SERVICE_IDENTIFIERS.App);
            const noteCreator = container.resolve(SERVICE_IDENTIFIERS.NoteCreator);
            const notificationService = container.resolve(SERVICE_IDENTIFIERS.NotificationService);
            const errorHandlingService = container.resolve(SERVICE_IDENTIFIERS.ErrorHandlingService);

            return new MeetingImportService(app, noteCreator, notificationService, errorHandlingService);
        });

        // =====================================================================================
        // РЕГИСТРАЦИЯ ГЛАВНОГО ОРКЕСТРАТОРА
        // =====================================================================================

        // ProcessingOrchestrator - главный координатор всех сервисов
        container.registerSingleton(SERVICE_IDENTIFIERS.ProcessingOrchestrator, () => {
            const extractionService = container.resolve(SERVICE_IDENTIFIERS.MeetingExtractionService);
            const parsingService = container.resolve(SERVICE_IDENTIFIERS.MeetingParsingService);
            const importService = container.resolve(SERVICE_IDENTIFIERS.MeetingImportService);
            const errorHandlingService = container.resolve(SERVICE_IDENTIFIERS.ErrorHandlingService);
            const notificationService = container.resolve(SERVICE_IDENTIFIERS.NotificationService);
            const zipExtractor = container.resolve(SERVICE_IDENTIFIERS.ZipExtractor);
            const statusBarService = container.resolve(SERVICE_IDENTIFIERS.StatusBarService);
            const loggingService = container.resolve(SERVICE_IDENTIFIERS.LoggingService);

            return new ProcessingOrchestrator(
                extractionService,
                parsingService,
                importService,
                errorHandlingService,
                notificationService,
                zipExtractor,
                statusBarService,
                loggingService
            );
        });
    }

    /**
     * Проверяет что все необходимые сервисы зарегистрированы
     */
    static validateConfiguration(container: IServiceContainer): boolean {
        const requiredServices = [
            SERVICE_IDENTIFIERS.App,
            SERVICE_IDENTIFIERS.SettingsProvider,
            SERVICE_IDENTIFIERS.NotificationService,
            SERVICE_IDENTIFIERS.LoggingService,
            SERVICE_IDENTIFIERS.StatusBarService,
            SERVICE_IDENTIFIERS.ZipExtractor,
            SERVICE_IDENTIFIERS.NoteParser,
            SERVICE_IDENTIFIERS.NoteCreator,
            SERVICE_IDENTIFIERS.ErrorHandlingService,
            SERVICE_IDENTIFIERS.MeetingExtractionService,
            SERVICE_IDENTIFIERS.MeetingParsingService,
            SERVICE_IDENTIFIERS.MeetingImportService,
            SERVICE_IDENTIFIERS.ProcessingOrchestrator
        ];

        for (const serviceId of requiredServices) {
            if (!container.isRegistered(serviceId)) {
                console.error(`[ServiceConfiguration] Required service not registered: ${serviceId.name}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Освобождает все ресурсы и очищает контейнер
     */
    static dispose(container: IServiceContainer): void {
        try {
            container.dispose();
            console.log('[ServiceConfiguration] Service container disposed successfully');
        } catch (error) {
            console.error('[ServiceConfiguration] Error disposing service container:', error);
        }
    }

    /**
     * Получает список всех зарегистрированных сервисов для диагностики
     */
    static getRegisteredServices(container: IServiceContainer): string[] {
        return container.getRegisteredServices();
    }

    /**
     * Тестирует что основные сервисы создаются без ошибок
     */
    static async testServiceCreation(container: IServiceContainer): Promise<boolean> {
        try {
            // Тестируем создание ключевых сервисов
            const orchestrator = container.resolve(SERVICE_IDENTIFIERS.ProcessingOrchestrator);
            const extractionService = container.resolve(SERVICE_IDENTIFIERS.MeetingExtractionService);
            const parsingService = container.resolve(SERVICE_IDENTIFIERS.MeetingParsingService);
            const importService = container.resolve(SERVICE_IDENTIFIERS.MeetingImportService);

            // Проверяем что оркестратор готов к работе
            if (typeof orchestrator.isReady === 'function' && !orchestrator.isReady()) {
                console.error('[ServiceConfiguration] ProcessingOrchestrator is not ready');
                return false;
            }

            console.log('[ServiceConfiguration] All services created successfully');
            return true;
        } catch (error) {
            console.error('[ServiceConfiguration] Failed to create services:', error);
            return false;
        }
    }
}
