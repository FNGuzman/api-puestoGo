import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AuditSubscriber } from '../../schematics/audit/config/audit.subscriber';

export const DataSourceConfigLocal: DataSourceOptions = {
  // Hora local por defecto para proyectos de Argentina.
  // Si otro proyecto requiere otra zona, ajustar DB_TIMEZONE en .env (ej: '+00:00', '-03:00').
  // Nota: 'Z' = UTC.
  timezone: process.env.DB_TIMEZONE || '-03:00',
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT)!,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'puestoGo',
  entities: [
    __dirname + '/../../schematics/**/entities/*.entity{.ts,.js}',
  ],
  subscribers: [AuditSubscriber],
  logging: false,
  /** Solo con DB_SYNCHRONIZE=true (desarrollo). En producción usar migraciones. */
  synchronize: process.env.DB_SYNCHRONIZE?.trim().toLowerCase() === 'true',
  extra: {
    timezone: process.env.DB_TIMEZONE || '-03:00',
    charset: 'utf8mb4',
    dateStrings: true,
  },
};

export const AppDataSource = new DataSource(DataSourceConfigLocal);