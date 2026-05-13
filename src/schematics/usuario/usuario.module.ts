import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuarioMapper } from './mappers/usuario.mapper';
import { UsuarioRepository } from './repository/usuario.repository';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { AuthModule } from '../auth/auth.module';
import { PersonaMapper } from '../persona/mappers/persona.mapper';
import { PersonaRepository } from '../persona/repository/persona.repository';
import { R2StorageService } from 'src/common/services/r2-storage.service';
import { ImageOptimizationService } from 'src/common/services/image-optimization.service';
import { UsuarioProfileImageService } from './services/usuario-profile-image.service';
import { UsuarioVerificationService } from './services/usuario-verification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsuarioController],
  providers: [
    UsuarioService,
    UsuarioRepository,
    UsuarioMapper,
    PersonaMapper,
    PersonaRepository,
    R2StorageService,
    ImageOptimizationService,
    UsuarioProfileImageService,
    UsuarioVerificationService,
  ],
  exports: [UsuarioService, UsuarioRepository, UsuarioMapper, UsuarioVerificationService],
})
export class UsuarioModule { }
