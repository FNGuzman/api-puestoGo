import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditoriaRepository } from './repository/audit.repository';
import { AuditoriaMapper } from './mappers/audit.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, AuditoriaRepository, AuditoriaMapper],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}