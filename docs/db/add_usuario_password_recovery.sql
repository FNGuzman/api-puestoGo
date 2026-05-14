-- Recuperación de contraseña por código (MySQL). Ejecutar antes de desplegar la API con las nuevas columnas.
ALTER TABLE user_01_cab_usuario
  ADD COLUMN user01_codigo_recuperacion VARCHAR(10) NULL,
  ADD COLUMN user01_codigo_recuperacion_expira VARCHAR(20) NULL;
