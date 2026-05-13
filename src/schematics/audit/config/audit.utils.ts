import 'reflect-metadata';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { AUDIT_EXCLUDE } from './audit.constants';

/** Request tras FlexibleJwtAuthGuard (request.user con id normalizado). */
export type RequestWithAuditUser = Request & {
  user?: { id?: number | string; sub?: number | string; email?: string };
};

/**
 * Obtiene el ID de usuario para auditoría.
 * 1) `request.user` (los guards se ejecutan antes que los interceptores).
 * 2) Si falta, verifica el Bearer con la misma lógica que FlexibleJwtAuthGuard (JWT_SECRET → id, ACCESS_TOKEN_SECRET → sub).
 */
export function resolveAuditUserId(request: RequestWithAuditUser): number {
  const fromUser = request.user?.id ?? request.user?.sub;
  if (fromUser != null && fromUser !== '') {
    const n = Number(fromUser);
    if (!Number.isNaN(n) && n > 0) {
      return n;
    }
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return 0;
  }
  const token = authHeader.slice(7);

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (typeof decoded !== 'string' && decoded != null) {
        const id = (decoded as { id?: unknown }).id;
        if (id != null) {
          const n = Number(id);
          if (!Number.isNaN(n) && n > 0) {
            return n;
          }
        }
      }
    } catch {
      // Intentar siguiente secret
    }
  }

  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  if (accessSecret) {
    try {
      const decoded = jwt.verify(token, accessSecret);
      if (typeof decoded !== 'string' && decoded != null) {
        const sub = (decoded as { sub?: unknown }).sub;
        if (sub != null) {
          const n = Number(sub);
          if (!Number.isNaN(n) && n > 0) {
            return n;
          }
        }
      }
    } catch {
      // Sin usuario identificable
    }
  }

  return 0;
}

export function toPlainForAudit(target: Function | string, entity: any) {
  if (!entity || typeof entity !== 'object') return entity ?? null;
  const raw =
    typeof target === 'function'
      ? Reflect.getMetadata(AUDIT_EXCLUDE, target)
      : undefined;
  const excluded: Set<string | symbol> =
    raw instanceof Set ? raw : new Set();

  const plain: Record<string, any> = {};
  for (const [k, v] of Object.entries(entity)) {
    if (!excluded.has(k)) {
      // Evita ciclos y objetos gigantes (relations lazy)
      if (typeof v === 'object' && v !== null) {
        // Solo toma id si parece entidad relacionada
        if ('id' in (v as any)) plain[k] = { id: (v as any).id };
        else plain[k] = v;
      } else {
        plain[k] = v;
      }
    }
  }
  return plain;
}

/** Comparación estable para decidir si un UPDATE no aporta cambios visibles tras exclusiones de auditoría. */
function stableStringifyForAudit(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyForAudit(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringifyForAudit(obj[k])}`).join(',')}}`;
}

export function areAuditSnapshotsEqual(a: unknown, b: unknown): boolean {
  return stableStringifyForAudit(a) === stableStringifyForAudit(b);
}
