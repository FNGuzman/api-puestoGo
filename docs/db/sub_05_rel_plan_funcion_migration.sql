-- Relación plan ↔ funciones (MySQL 8+). Ejecutar en bases ya existentes con sub_02_cat_plan poblada.
-- Idempotente: INSERT IGNORE + UNIQUE (rela_sub02, sub05_funcion_codigo).

CREATE TABLE IF NOT EXISTS sub_05_rel_plan_funcion (
  id INT NOT NULL AUTO_INCREMENT,
  created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_date DATETIME(6) NULL,
  rela_sub02 INT NOT NULL,
  sub05_funcion_codigo VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sub05_plan_funcion (rela_sub02, sub05_funcion_codigo),
  CONSTRAINT fk_sub05_plan FOREIGN KEY (rela_sub02) REFERENCES sub_02_cat_plan (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pro y Equipo: ajuste masivo precio y stock (alineado al seed TypeORM / sub_02 flags).
INSERT IGNORE INTO sub_05_rel_plan_funcion (rela_sub02, sub05_funcion_codigo)
SELECT p.id, 'AJUSTE_MASIVO_PRECIO'
FROM sub_02_cat_plan p
WHERE p.sub02_codigo IN ('PRO', 'EQUIPO');

INSERT IGNORE INTO sub_05_rel_plan_funcion (rela_sub02, sub05_funcion_codigo)
SELECT p.id, 'AJUSTE_MASIVO_STOCK'
FROM sub_02_cat_plan p
WHERE p.sub02_codigo IN ('PRO', 'EQUIPO');

INSERT IGNORE INTO sub_05_rel_plan_funcion (rela_sub02, sub05_funcion_codigo)
SELECT p.id, 'GENERAR_ETIQUETAS'
FROM sub_02_cat_plan p
WHERE p.sub02_codigo IN ('PRO', 'EQUIPO');

INSERT IGNORE INTO sub_05_rel_plan_funcion (rela_sub02, sub05_funcion_codigo)
SELECT p.id, 'BACKUP_NUBE'
FROM sub_02_cat_plan p
WHERE p.sub02_codigo IN ('PRO', 'EQUIPO');
