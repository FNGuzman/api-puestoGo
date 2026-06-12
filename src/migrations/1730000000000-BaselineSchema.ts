import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline: el esquema actual se gestiona con scripts en docs/db/ y DB_SYNCHRONIZE en desarrollo.
 * Las migraciones incrementales deben agregarse a partir de esta línea base.
 */
export class BaselineSchema1730000000000 implements MigrationInterface {
  name = 'BaselineSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    // No-op: bases existentes ya tienen el esquema aplicado manualmente.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    // No revertir el esquema completo desde la plantilla.
  }
}
