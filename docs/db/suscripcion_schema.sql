-- Esquema suscripciones PuestoGo (MySQL 8+). Ejecutar si no usás TypeORM synchronize.
-- Orden: catálogo de planes → suscripción por usuario → backups.

CREATE TABLE IF NOT EXISTS sub_02_cat_plan (
  id INT NOT NULL AUTO_INCREMENT,
  created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_date DATETIME(6) NULL,
  sub02_codigo VARCHAR(32) NOT NULL,
  sub02_nombre VARCHAR(120) NOT NULL,
  sub02_descripcion VARCHAR(500) NULL,
  sub02_precio DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sub02_moneda VARCHAR(8) NOT NULL DEFAULT 'ARS',
  sub02_limite_productos INT NULL,
  sub02_ajuste_masivo_precio TINYINT(1) NOT NULL DEFAULT 0,
  sub02_ajuste_masivo_stock TINYINT(1) NOT NULL DEFAULT 0,
  sub02_periodo_evaluacion_dias INT NOT NULL DEFAULT 30,
  sub02_dias_gracia_offline INT NOT NULL DEFAULT 5,
  sub02_activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sub02_codigo (sub02_codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS sub_01_cab_suscripcion_usuario (
  id INT NOT NULL AUTO_INCREMENT,
  created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_date DATETIME(6) NULL,
  rela_user01 INT NOT NULL,
  rela_sub02 INT NOT NULL,
  sub01_estado VARCHAR(20) NOT NULL DEFAULT 'active',
  sub01_valido_hasta DATETIME NOT NULL,
  sub01_gracia_hasta DATETIME NOT NULL,
  sub01_ultima_validacion DATETIME NULL,
  sub01_ciclo VARCHAR(16) NOT NULL DEFAULT 'mensual',
  sub01_renovacion_auto TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sub01_usuario (rela_user01),
  KEY fk_sub01_plan (rela_sub02),
  CONSTRAINT fk_sub01_usuario FOREIGN KEY (rela_user01) REFERENCES user_01_cab_usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_sub01_plan FOREIGN KEY (rela_sub02) REFERENCES sub_02_cat_plan (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sub_04_cab_backup_usuario (
  id INT NOT NULL AUTO_INCREMENT,
  created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_date DATETIME(6) NULL,
  rela_user01 INT NOT NULL,
  sub04_nombre_original VARCHAR(500) NOT NULL,
  sub04_clave_almacenamiento VARCHAR(1000) NULL,
  sub04_tamano_bytes BIGINT NOT NULL DEFAULT 0,
  sub04_checksum_sha256 VARCHAR(64) NULL,
  sub04_origen VARCHAR(32) NOT NULL DEFAULT 'upload',
  sub04_payload_json JSON NULL,
  PRIMARY KEY (id),
  KEY fk_sub04_usuario (rela_user01),
  CONSTRAINT fk_sub04_usuario FOREIGN KEY (rela_user01) REFERENCES user_01_cab_usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos iniciales (idempotente por código)
INSERT INTO sub_02_cat_plan (sub02_codigo, sub02_nombre, sub02_descripcion, sub02_precio, sub02_moneda, sub02_limite_productos, sub02_ajuste_masivo_precio, sub02_ajuste_masivo_stock, sub02_periodo_evaluacion_dias, sub02_dias_gracia_offline, sub02_activo)
VALUES
  ('BASICO', 'Básico', 'Por defecto al crear cuenta.', 0.00, 'ARS', 100, 0, 0, 30, 5, 1),
  ('PRO', 'Pro', 'Todas las funciones desbloqueadas.', 7000.00, 'ARS', NULL, 1, 1, 30, 5, 1),
  ('EQUIPO', 'Equipo', 'Próximamente: multi-usuario con sincronización y multi-stock (varias sucursales / dispositivos).', 19000.00, 'ARS', NULL, 1, 1, 30, 7, 1)
ON DUPLICATE KEY UPDATE
  sub02_nombre = VALUES(sub02_nombre),
  sub02_descripcion = VALUES(sub02_descripcion),
  sub02_precio = VALUES(sub02_precio),
  sub02_moneda = VALUES(sub02_moneda),
  sub02_limite_productos = VALUES(sub02_limite_productos),
  sub02_ajuste_masivo_precio = VALUES(sub02_ajuste_masivo_precio),
  sub02_ajuste_masivo_stock = VALUES(sub02_ajuste_masivo_stock),
  sub02_periodo_evaluacion_dias = VALUES(sub02_periodo_evaluacion_dias),
  sub02_dias_gracia_offline = VALUES(sub02_dias_gracia_offline),
  sub02_activo = VALUES(sub02_activo);

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

-- Movimientos de pago (Mercado Pago / historial)
CREATE TABLE IF NOT EXISTS sub_03_mov_pago_suscripcion (
  id INT NOT NULL AUTO_INCREMENT,
  created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_date DATETIME(6) NULL,
  rela_user01 INT NOT NULL,
  sub03_plan_codigo VARCHAR(32) NOT NULL,
  sub03_plan_nombre VARCHAR(120) NULL,
  sub03_ciclo VARCHAR(16) NOT NULL,
  sub03_monto DECIMAL(12,2) NOT NULL,
  sub03_moneda VARCHAR(8) NOT NULL,
  sub03_estado VARCHAR(20) NOT NULL DEFAULT 'pending',
  sub03_mp_preference_id VARCHAR(64) NULL,
  sub03_mp_payment_id VARCHAR(64) NULL,
  sub03_external_ref VARCHAR(80) NOT NULL,
  sub03_paid_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sub03_external_ref (sub03_external_ref),
  KEY fk_sub03_usuario (rela_user01),
  CONSTRAINT fk_sub03_usuario FOREIGN KEY (rela_user01) REFERENCES user_01_cab_usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
