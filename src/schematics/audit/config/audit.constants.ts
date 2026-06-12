export const AUDIT_EXCLUDE = Symbol('AUDIT_EXCLUDE');

/**
 * Decorador para excluir campos de la auditoría
 * @example
 * ```ts
 * @Entity()
 * export class User {
 *   @AuditExclude()
 *   password: string;
 * }
 * ```
 */
export function AuditExclude(): PropertyDecorator {
  return (target: any, key: string | symbol) => {
    const ctor = target.constructor;
    const existing: Set<string | symbol> =
      Reflect.getMetadata(AUDIT_EXCLUDE, ctor) ?? new Set();
    existing.add(key);
    Reflect.defineMetadata(AUDIT_EXCLUDE, existing, ctor);
  };
}

/**
 * Decorador para excluir entidades completas de la auditoría
 * @example
 * ```ts
 * @Entity()
 * @AuditExcludeEntity()
 * export class TemporaryData {
 *   // Esta entidad no será auditada
 * }
 * ```
 */
export function AuditExcludeEntity(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(AUDIT_EXCLUDE, true, target);
  };
}
