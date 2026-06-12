import 'dotenv/config';
import { DataSource } from 'typeorm';
import { DataSourceConfigLocal } from './data-source-local';

export default new DataSource({
  ...DataSourceConfigLocal,
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
});
