import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { ConfigService } from '@nestjs/config';

// Получаем DSN из переменных окружения
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Инициализация Sentry для мониторинга ошибок и производительности
 * @param configService Опциональный ConfigService для получения конфигурации
 */
export function initSentry(SENTRY_DNS): void {
  // const SENTRY_DSN = configService?.get<string>("SENTRY_DNS");
  // Если DSN не указан, выходим из функции
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN не указан. Мониторинг ошибок отключен.');
    return;
  }

  try {
    // Инициализация Sentry
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      integrations: [
        // Добавляем интеграцию для профилирования
        nodeProfilingIntegration(),
      ],
      // Настройка трассировки
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,
      // Настройка профилирования
      profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
      // Дополнительные настройки
      debug: ENVIRONMENT !== 'production',
      beforeSend(event) {
        // Можно добавить дополнительную логику перед отправкой события
        return event;
      },
    });

    console.log(`Sentry инициализирован в режиме: ${ENVIRONMENT}`);
  } catch (error) {
    console.error('Ошибка при инициализации Sentry:', error);
  }
}

/**
 * Захват необработанных исключений
 */
export function captureUnhandledExceptions(): void {
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
    console.error('Необработанное исключение:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    Sentry.captureException(reason);
    console.error('Необработанное отклонение промиса:', reason);
  });
}

// Экспортируем функцию для использования в других модулях
export default {
  initSentry,
  captureUnhandledExceptions,
};
