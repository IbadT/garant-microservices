import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  /**
   * Тестовая функция
   * @param {number} a - первое число
   * @returns {string} - фраза "Hello world!"
   * @returns {Promise<User[]>} Список пользователей.
   */
  getHello(num: number): string {
    return 'Hello World!';
  }
}
