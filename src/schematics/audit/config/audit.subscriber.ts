import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  SoftRemoveEvent,
  RecoverEvent,
  UpdateEvent,
} from 'typeorm';
import { getRequestContext } from './request-context';
import { areAuditSnapshotsEqual, toPlainForAudit } from './audit.utils';
import { AuditActionEnum } from 'src/common/enums/audit-action-enum';
import { AUDIT_EXCLUDE } from './audit.constants';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLog } from '../entities/audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  // —— INSERT ——
  async afterInsert(e: InsertEvent<any>) {
    // Evitar múltiples ejecuciones para la misma entidad
    if (e.entity && e.entity._auditProcessed) {
      return;
    }

    if (this.shouldAudit(e.metadata.target)) {
      try {
        await this.writeLog(e, AuditActionEnum.CREATE, undefined, e.entity);

        // Marcar como procesado para evitar duplicados
        if (e.entity) {
          e.entity._auditProcessed = true;
        }
      } catch (error) {
        console.error('Error en audit afterInsert:', error);
        // No lanzar el error para no interrumpir la operación principal
      }
    }
  }

  // —— UPDATE ——
  async beforeUpdate(e: UpdateEvent<any>) {
    if (this.shouldAudit(e.metadata.target)) {
      try {
        await this.writeLog(
          e,
          AuditActionEnum.UPDATE,
          e.databaseEntity,
          e.entity,
        );
      } catch (error) {
        console.error('Error en audit beforeUpdate:', error);
        // No lanzar el error para no interrumpir la operación principal
      }
    }
  }

  // —— DELETE dura ——
  async beforeRemove(e: RemoveEvent<any>) {
    if (this.shouldAudit(e.metadata.target)) {
      try {
        await this.writeLog(
          e,
          AuditActionEnum.DELETE,
          e.databaseEntity,
          undefined,
        );
      } catch (error) {
        console.error('Error en audit beforeRemove:', error);
        // No lanzar el error para no interrumpir la operación principal
      }
    }
  }

  // —— SOFT DELETE ——
  async beforeSoftRemove(e: SoftRemoveEvent<any>) {
    if (this.shouldAudit(e.metadata.target)) {
      try {
        await this.writeLog(
          e,
          AuditActionEnum.SOFT_DELETE,
          e.databaseEntity,
          undefined,
        );
      } catch (error) {
        console.error('Error en audit beforeSoftRemove:', error);
        // No lanzar el error para no interrumpir la operación principal
      }
    }
  }

  // —— RESTORE ——
  async beforeRecover(e: RecoverEvent<any>) {
    if (this.shouldAudit(e.metadata.target)) {
      try {
        await this.writeLog(
          e,
          AuditActionEnum.RESTORE,
          undefined,
          e.databaseEntity,
        );
      } catch (error) {
        console.error('Error en audit beforeRecover:', error);
        // No lanzar el error para no interrumpir la operación principal
      }
    }
  }

  /**
   * `@AuditExcludeEntity()` guarda `true` en metadata (excluir toda la entidad).
   * `@AuditExclude()` en propiedades guarda un `Set` de claves: la entidad SÍ se audita.
   */
  private shouldAudit(target: Function | string): boolean {
    if (typeof target === 'string') {
      return true;
    }
    const meta = Reflect.getMetadata(AUDIT_EXCLUDE, target);
    if (meta === true) {
      return false;
    }
    return true;
  }

  private getUserIdFromToken(): number | null {
    try {
      // Intentar obtener el token del contexto de la request
      const ctx = getRequestContext();

      if (ctx?.userId != null) {
        return ctx.userId;
      }

      return null;
    } catch (error) {
      console.warn(
        'Error al obtener userId:',
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  private async writeLog(
    e:
      | InsertEvent<any>
      | UpdateEvent<any>
      | RemoveEvent<any>
      | SoftRemoveEvent<any>
      | RecoverEvent<any>,
    action: AuditActionEnum,
    before: any,
    after: any,
  ) {
    const ctx = getRequestContext();
    const meta = e.metadata;
    const entityName = meta.name;

    // intenta obtener el id primario
    const idCols = meta.primaryColumns;
    let entityId: number = 0;

    // Para INSERT, usar e.entity que ya tiene el ID generado
    // Para otros eventos, usar la lógica existente
    let candidate;
    if (action === AuditActionEnum.CREATE) {
      candidate = (e as InsertEvent<any>).entity;
    } else {
      candidate = (e as any).entity ?? (e as any).databaseEntity ?? undefined;
    }

    if (candidate && idCols.length > 0) {
      const vals = idCols
        .map((c) => candidate[c.propertyName])
        .filter((v) => v !== undefined && v !== null);
      if (vals.length) {
        entityId = Number(vals[0]) || 0;
      }
    }

    const beforePlain = before ? toPlainForAudit(meta.target, before) : null;
    const afterPlain = after ? toPlainForAudit(meta.target, after) : null;

    if (
      action === AuditActionEnum.UPDATE &&
      beforePlain != null &&
      afterPlain != null &&
      areAuditSnapshotsEqual(beforePlain, afterPlain)
    ) {
      return;
    }

    const userIdFromContext = this.getUserIdFromToken();
    /** Si AsyncLocalStorage perdió el contexto (p. ej. dentro del ciclo de TypeORM), usar el id de la fila Usuario auditada. */
    const userIdFromEntity =
      entityName === 'Usuario' &&
      candidate &&
      typeof (candidate as { id?: unknown }).id === 'number'
        ? Number((candidate as { id: number }).id)
        : null;

    const resolvedUserId =
      userIdFromContext != null && !Number.isNaN(userIdFromContext)
        ? userIdFromContext
        : userIdFromEntity != null && !Number.isNaN(userIdFromEntity)
          ? userIdFromEntity
          : 0;

    const auditData: CreateAuditLogDto = {
      userId: resolvedUserId,
      action,
      entity: entityName,
      entityId: entityId,
      beforeJson: beforePlain,
      afterJson: afterPlain,
      method: ctx?.method || undefined,
      path: ctx?.path || undefined,
      requestId: ctx?.requestId || undefined,
    };

    /**
     * Usar la entidad AuditLog para que TypeORM mapee columnas y no omita user_id=0 / entity_id=0.
     * El insert manual con .into('audit_log') + snake_case generaba DEFAULT en MySQL para user_id.
     */
    await e.connection.getRepository(AuditLog).insert({
      userId: auditData.userId,
      action: auditData.action,
      entity: auditData.entity,
      entityId: auditData.entityId,
      beforeJson: auditData.beforeJson ?? undefined,
      afterJson: auditData.afterJson ?? undefined,
      method: auditData.method ?? undefined,
      path: auditData.path ?? undefined,
      requestId: auditData.requestId ?? undefined,
    });
  }
}
