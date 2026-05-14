-- Añade columna JSON para backups sincronizados desde la app (Kubernetes-friendly).
-- Ejecutar una vez si la tabla ya existía sin esta columna.

ALTER TABLE sub_04_cab_backup_usuario
  ADD COLUMN sub04_payload_json JSON NULL
  AFTER sub04_origen;
