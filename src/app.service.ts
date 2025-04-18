import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  /**
   * Тестовая функция
   * @param {number} num - число для демонстрации
   * @returns {string} - фраза "Hello world!" с переданным числом
   * @returns {Promise<User[]>} Список пользователей.
   */
  getHello(num: number): string {
    return `Hello World! Number: ${num}`;
  }
}
