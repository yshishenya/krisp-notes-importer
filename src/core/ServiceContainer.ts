import { IServiceContainer, ServiceIdentifier } from './serviceInterfaces';

type ServiceFactory<T = any> = () => T;
type ServiceLifetime = 'singleton' | 'transient';

interface ServiceRegistration<T = any> {
    factory: ServiceFactory<T>;
    lifetime: ServiceLifetime;
    instance?: T;
}

/**
 * IoC контейнер для управления зависимостями в плагине Krisp Notes Importer
 *
 * Поддерживает:
 * - Singleton регистрации (один экземпляр на весь жизненный цикл)
 * - Transient регистрации (новый экземпляр при каждом resolve)
 * - Lazy initialization (создание только при первом обращении)
 * - Циклическая детекция зависимостей
 * - Graceful disposal при выгрузке плагина
 */
export class ServiceContainer implements IServiceContainer {
    private registrations = new Map<string, ServiceRegistration>();
    private resolutionStack = new Set<string>();
    private disposed = false;

    /**
     * Регистрирует transient сервис (новый экземпляр при каждом resolve)
     */
    register<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>): void {
        this.validateNotDisposed();
        this.validateIdentifier(identifier);
        this.validateFactory(factory);

        this.registrations.set(identifier.name, {
            factory,
            lifetime: 'transient'
        });
    }

    /**
     * Регистрирует singleton сервис (один экземпляр на весь жизненный цикл)
     */
    registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>): void {
        this.validateNotDisposed();
        this.validateIdentifier(identifier);
        this.validateFactory(factory);

        this.registrations.set(identifier.name, {
            factory,
            lifetime: 'singleton'
        });
    }

    /**
     * Регистрирует существующий экземпляр как singleton
     */
    registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void {
        this.validateNotDisposed();
        this.validateIdentifier(identifier);

        if (instance === null || instance === undefined) {
            throw new Error(`Instance cannot be null or undefined for service '${identifier.name}'`);
        }

        this.registrations.set(identifier.name, {
            factory: () => instance,
            lifetime: 'singleton',
            instance
        });
    }

    /**
     * Разрешает зависимость и возвращает экземпляр сервиса
     */
    resolve<T>(identifier: ServiceIdentifier<T>): T {
        this.validateNotDisposed();
        this.validateIdentifier(identifier);

        // Проверяем циклические зависимости
        if (this.resolutionStack.has(identifier.name)) {
            const cycle = Array.from(this.resolutionStack).join(' -> ') + ' -> ' + identifier.name;
            throw new Error(`Circular dependency detected: ${cycle}`);
        }

        const registration = this.registrations.get(identifier.name);
        if (!registration) {
            throw new Error(`Service '${identifier.name}' is not registered`);
        }

        // Для singleton'ов возвращаем существующий экземпляр, если есть
        if (registration.lifetime === 'singleton' && registration.instance !== undefined) {
            return registration.instance;
        }

        // Создаем новый экземпляр
        this.resolutionStack.add(identifier.name);

        try {
            const instance = registration.factory();

            // Сохраняем экземпляр для singleton'ов
            if (registration.lifetime === 'singleton') {
                registration.instance = instance;
            }

            return instance;
        } catch (error) {
            throw new Error(`Failed to resolve service '${identifier.name}': ${error.message}`);
        } finally {
            this.resolutionStack.delete(identifier.name);
        }
    }

    /**
     * Проверяет, зарегистрирован ли сервис
     */
    isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
        return this.registrations.has(identifier.name);
    }

    /**
     * Возвращает список всех зарегистрированных сервисов
     */
    getRegisteredServices(): string[] {
        return Array.from(this.registrations.keys());
    }

    /**
     * Очищает все регистрации и освобождает ресурсы
     */
    dispose(): void {
        if (this.disposed) {
            return;
        }

        // Вызываем dispose для всех singleton экземпляров, если они его поддерживают
        for (const [serviceName, registration] of this.registrations) {
            if (registration.lifetime === 'singleton' && registration.instance) {
                try {
                    const instance = registration.instance as any;
                    if (typeof instance.dispose === 'function') {
                        instance.dispose();
                    }
                } catch (error) {
                    console.warn(`[ServiceContainer] Failed to dispose service '${serviceName}':`, error);
                }
            }
        }

        this.registrations.clear();
        this.resolutionStack.clear();
        this.disposed = true;
    }

    /**
     * Очищает конкретный singleton экземпляр (заставляет пересоздать при следующем resolve)
     */
    clearSingleton<T>(identifier: ServiceIdentifier<T>): void {
        this.validateNotDisposed();
        const registration = this.registrations.get(identifier.name);

        if (registration && registration.lifetime === 'singleton') {
            // Пытаемся вызвать dispose, если поддерживается
            if (registration.instance) {
                const instance = registration.instance as any;
                if (typeof instance.dispose === 'function') {
                    try {
                        instance.dispose();
                    } catch (error) {
                        console.warn(`[ServiceContainer] Failed to dispose singleton '${identifier.name}':`, error);
                    }
                }
            }

            delete registration.instance;
        }
    }

    /**
     * Заменяет регистрацию сервиса (полезно для тестирования)
     */
    replace<T>(identifier: ServiceIdentifier<T>, factory: ServiceFactory<T>, lifetime: ServiceLifetime = 'transient'): void {
        this.validateNotDisposed();

        // Очищаем существующую регистрацию, если есть
        if (this.isRegistered(identifier)) {
            this.clearSingleton(identifier);
        }

        this.registrations.set(identifier.name, {
            factory,
            lifetime
        });
    }

    // ========================================================================================
    // ПРИВАТНЫЕ МЕТОДЫ ВАЛИДАЦИИ
    // ========================================================================================

    private validateNotDisposed(): void {
        if (this.disposed) {
            throw new Error('ServiceContainer has been disposed');
        }
    }

    private validateIdentifier<T>(identifier: ServiceIdentifier<T>): void {
        if (!identifier || !identifier.name || typeof identifier.name !== 'string') {
            throw new Error('Service identifier must have a valid name');
        }
    }

    private validateFactory<T>(factory: ServiceFactory<T>): void {
        if (typeof factory !== 'function') {
            throw new Error('Service factory must be a function');
        }
    }
}

/**
 * Глобальный экземпляр контейнера для плагина
 * Используется как singleton во всем приложении
 */
export const globalServiceContainer = new ServiceContainer();
