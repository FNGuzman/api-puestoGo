import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUsuarioRequestDto } from './dto/create-usuario-request.dto';
import { SwaggerUpdateUsuarioRequestDto } from './dto/swagger-usuario-request.dto';
import { SearchUsuarioRequestDto } from './dto/search-usuario-request.dto';
import { LoginUsuarioRequestDto } from './dto/login-usuario-request.dto';
import { UsuarioDTO } from './dto/usuario.dto';

import { UsuarioMapper } from './mappers/usuario.mapper';
import { UsuarioRepository } from './repository/usuario.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { Usuario } from './entities/usuario.entity';
import { ERRORS } from 'src/common/errors/errors-codes';
import { PersonaRepository } from '../persona/repository/persona.repository';
import { PersonaMapper } from '../persona/mappers/persona.mapper';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { Persona } from '../persona/entities/persona.entity';
import { FindOptionsRelations } from 'typeorm';
import { AUTH_CONSTANTS } from 'src/common/constants/constants';
import { UsuarioProfileImageService } from './services/usuario-profile-image.service';

type ActorContext = { id?: number; rolId?: number };

@Injectable()
export class UsuarioService {
  
  private readonly USUARIO_RELATIONS: FindOptionsRelations<Usuario> = { persona: true };

  constructor(
    private usuarioMapper: UsuarioMapper,
    private usuarioRepository: UsuarioRepository,
    private personaMapper: PersonaMapper,
    private personaRepository: PersonaRepository,
    private getEntity: GetEntityService,
    private errorHandler: ErrorHandlerService,
    private profileImageService: UsuarioProfileImageService,
  ) {}

  async find(criteria: { where: Record<string, unknown>; relations?: FindOptionsRelations<Usuario> }): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: criteria.where,
      relations: criteria.relations ?? this.USUARIO_RELATIONS,
    });
    if (!usuario) {
      this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, criteria.where);
    }
    return usuario;
  }

  async findByEmail(email: string): Promise<Usuario> {
    return this.getEntity.findOneByOrFail(Usuario, { email }, this.USUARIO_RELATIONS);
  }

  async findOne(id: number): Promise<UsuarioDTO> {
    const usuario = await this.getEntity.findById(Usuario, id, this.USUARIO_RELATIONS);
    return this.usuarioMapper.entity2DTO(usuario);
  }

  async search(request: SearchUsuarioRequestDto): Promise<PageDto<UsuarioDTO>> {
    const usuarioPage = await this.usuarioRepository.search(request);
    return this.usuarioMapper.page2Dto(request, usuarioPage);
  }

  async create(request: CreateUsuarioRequestDto, file?: Express.Multer.File): Promise<UsuarioDTO> {
    try {
      await this.validateUniqueEmail(request.email);

      let urlFotoPerfil: string | null = null;
      if (file) {
        urlFotoPerfil = await this.profileImageService.uploadFotoPerfil(file);
      }

      const newPersona = await this.personaMapper.createDTO2Entity({
        nombre: request.nombre,
        apellido: request.apellido,
      });
      const personaSaved = await this.personaRepository.save(newPersona);

      const newUsuario = await this.usuarioMapper.createDTO2Entity(request, personaSaved);
      newUsuario.fotoPerfil = urlFotoPerfil;
      const usuarioSaved = await this.usuarioRepository.save(newUsuario);

      const searchUsuario = await this.getEntity.findById(Usuario, usuarioSaved.id, this.USUARIO_RELATIONS);
      return this.usuarioMapper.entity2DTO(searchUsuario);
    } catch (error) {
      if (this.errorHandler.isHttpException(error)) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(
    id: number,
    request: SwaggerUpdateUsuarioRequestDto,
    actor: ActorContext = {},
    file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    try {
      const usuario = await this.getEntity.findById(Usuario, id, this.USUARIO_RELATIONS);

      this.assertCanAccessUser(usuario.id, actor);

      if (request.email && request.email !== usuario.email) {
        await this.validateUniqueEmail(request.email);
      }

      const nuevaUrlFotoPerfil = await this.profileImageService.resolveFotoPerfil(
        usuario,
        request.urlFotoPerfil,
        file,
      );

      if (request.nombre !== undefined || request.apellido !== undefined) {
        if (!usuario.persona) {
          this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { usuarioId: id });
        }
        const personaActualizada = await this.personaMapper.updateDTO2Entity(usuario.persona, {
          nombre: request.nombre,
          apellido: request.apellido,
        });
        await this.personaRepository.save(personaActualizada);
      }

      const updateUsuario = await this.usuarioMapper.updateDTO2Entity(usuario, request);
      updateUsuario.fotoPerfil = nuevaUrlFotoPerfil;
      await this.usuarioRepository.save(updateUsuario);

      const searchUsuario = await this.getEntity.findById(Usuario, id, this.USUARIO_RELATIONS);
      return this.usuarioMapper.entity2DTO(searchUsuario);
    } catch (error) {
      if (this.errorHandler.isHttpException(error)) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, actor: ActorContext = {}): Promise<string> {
    this.assertCanAccessUser(id, actor);
    await this.usuarioRepository.manager.transaction(async (manager) => {
      const usuario = await manager.getRepository(Usuario).findOne({
        where: { id },
        relations: this.USUARIO_RELATIONS,
      });

      if (!usuario) {
        this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { id });
      }

      if (usuario.persona) {
        await manager.getRepository(Persona).softRemove(usuario.persona);
      }
      await manager.getRepository(Usuario).softRemove(usuario);
    });

    return 'Usuario eliminado junto con su persona asociada';
  }

  private isAdmin(actor: ActorContext): boolean {
    return actor.rolId === AUTH_CONSTANTS.ADMIN_ROLE_ID;
  }

  private assertCanAccessUser(
    targetUserId: number,
    actor: ActorContext,
  ): void {
    const actorId = actor.id != null ? Number(actor.id) : NaN;
    if (!Number.isNaN(actorId) && actorId === targetUserId) {
      return;
    }
    if (this.isAdmin(actor)) {
      return;
    }
    this.errorHandler.throwForbidden(ERRORS.AUTHORIZATION.FORBIDDEN, 'No tienes permiso para acceder a este usuario');
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const existing = await this.getEntity.findOneBy(Usuario, { email });
    if (existing) {
      this.errorHandler.throwBadRequest(ERRORS.USER.EMAIL_ALREADY_EXISTS, `El email "${email}" ya está registrado`);
    }
  }

  async login(loginDto: LoginUsuarioRequestDto): Promise<UsuarioDTO> {
    const usuario = await this.findByEmail(loginDto.email);

    const isPasswordValid = await bcrypt.compare(loginDto.contrasena, usuario.contrasena);
    if (!isPasswordValid) {
      this.errorHandler.throwUnauthorized(ERRORS.AUTHENTICATION.INVALID_CREDENTIALS, 'La contraseña es incorrecta');
    }

    if (!usuario.activo) {
      this.errorHandler.throwUnauthorized(ERRORS.AUTHENTICATION.ACCOUNT_DISABLED);
    }

    usuario.ultimoAcceso = new Date();
    await this.usuarioRepository.save(usuario);
    return this.usuarioMapper.entity2DTO(usuario);
  }

  async updateUltimoAcceso(userId: number): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    if (usuario) {
      usuario.ultimoAcceso = new Date();
      await this.usuarioRepository.save(usuario);
    }
  }

  async changePassword(email: string, nuevaContrasena: string): Promise<void> {
    const usuario = await this.findByEmail(email);
    usuario.contrasena = await bcrypt.hash(nuevaContrasena, 10);
    await this.usuarioRepository.save(usuario);
  }

}
