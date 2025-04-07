import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export class BaseGrpcClient {
  constructor(
    protected readonly client: ClientGrpc,
    protected readonly serviceName: string,
  ) {}
  protected getService<T extends object>(serviceName: string): T {
    return this.client.getService<T>(this.serviceName);
  }

  protected async callGrpcMethod<T>(
    method: (...args: any[]) => any,
    ...args: any[]
  ): Promise<T> {
    try {
      const response = await firstValueFrom(method(...args));
      return response as T;
    } catch (error) {
      if (error.details) {
        throw new Error(error.details);
      }
      throw error;
    }
  }
} 