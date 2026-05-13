// “hilo invisible” que une middleware de logging ↔ subscriber de TypeORM 
// para que la auditoría sepa requestId y userId sin inyectar Request en el subscriber.

import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextData = {
  requestId: string;
  userId?: number;
  method?: string;
  path?: string;
};

export const RequestContext = new AsyncLocalStorage<RequestContextData>();

export function getRequestContext(): RequestContextData | undefined {
  return RequestContext.getStore();
}
