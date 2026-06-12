import { Injectable } from '@nestjs/common';
import { ERRORS } from 'src/common/errors/errors-codes';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { GetEntityService } from 'src/common/services/get-entity.service';
import {
  formatDateArgentina,
  parseArgentinaToDate,
} from 'src/common/utils/date-argentina';
import { UsuarioDTO } from '../dto/usuario.dto';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioMapper } from '../mappers/usuario.mapper';
import { UsuarioRepository } from '../repository/usuario.repository';

@Injectable()
export class UsuarioVerificationService {
  constructor(
    private readonly getEntity: GetEntityService,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly usuarioMapper: UsuarioMapper,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async setVerificationCode(
    usuarioId: number,
    codigo: string,
    expiraEn: Date,
  ): Promise<void> {
    const usuario = await this.getEntity.findById(Usuario, usuarioId);
    usuario.codigoVerificacionEmail = codigo;
    usuario.codigoVerificacionExpiraEn = formatDateArgentina(expiraEn);
    await this.usuarioRepository.save(usuario);
  }

  async verifyCode(usuarioId: number, codigo: string): Promise<UsuarioDTO> {
    const usuario = await this.getEntity.findById(Usuario, usuarioId, {
      persona: true,
    });
    if (usuario.emailVerificado) {
      return this.usuarioMapper.entity2DTO(usuario);
    }

    if (
      !usuario.codigoVerificacionEmail ||
      usuario.codigoVerificacionEmail !== codigo
    ) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'Codigo de verificacion invalido',
      );
    }

    const expiraEnDate = usuario.codigoVerificacionExpiraEn
      ? parseArgentinaToDate(usuario.codigoVerificacionExpiraEn)
      : null;
    const now = new Date();
    if (!expiraEnDate || isNaN(expiraEnDate.getTime()) || now > expiraEnDate) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'El codigo de verificacion expiro. Solicita uno nuevo.',
      );
    }

    usuario.emailVerificado = true;
    usuario.codigoVerificacionEmail = null;
    usuario.codigoVerificacionExpiraEn = null;
    await this.usuarioRepository.save(usuario);
    return this.usuarioMapper.entity2DTO(usuario);
  }

  async resendVerificationCode(
    usuarioId: number,
  ): Promise<{ email: string; codigo: string }> {
    const usuario = await this.getEntity.findById(Usuario, usuarioId);
    if (usuario.emailVerificado) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'El correo ya esta verificado',
      );
    }
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
    await this.setVerificationCode(usuarioId, codigo, expiraEn);
    return { email: usuario.email, codigo };
  }
}
