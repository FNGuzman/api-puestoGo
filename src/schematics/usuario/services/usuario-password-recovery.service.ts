import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ERRORS } from 'src/common/errors/errors-codes';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import {
  formatDateArgentina,
  parseArgentinaToDate,
} from 'src/common/utils/date-argentina';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioRepository } from '../repository/usuario.repository';

const TTL_MS = 15 * 60 * 1000;

@Injectable()
export class UsuarioPasswordRecoveryService {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  private generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** Busca usuario por email sin distinguir mayúsculas/minúsculas. */
  async findByEmailInsensitive(email: string): Promise<Usuario | null> {
    const trimmed = email.trim();
    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.email) = LOWER(:email)', { email: trimmed })
      .getOne();
  }

  /**
   * Genera código, lo guarda y devuelve datos para enviar el correo.
   * Null si no hay cuenta activa (respuesta genérica al cliente).
   */
  async crearCodigoRecuperacion(
    email: string,
  ): Promise<{ email: string; codigo: string } | null> {
    const usuario = await this.findByEmailInsensitive(email);
    if (!usuario || !usuario.activo) {
      return null;
    }
    const codigo = this.generarCodigo();
    const expiraEn = new Date(Date.now() + TTL_MS);
    usuario.codigoRecuperacionContrasena = codigo;
    usuario.codigoRecuperacionExpiraEn = formatDateArgentina(expiraEn);
    await this.usuarioRepository.save(usuario);
    return { email: usuario.email, codigo };
  }

  async restablecerConCodigo(
    email: string,
    codigo: string,
    nuevaContrasena: string,
  ): Promise<void> {
    const usuario = await this.findByEmailInsensitive(email);
    if (!usuario || !usuario.activo) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'Código inválido o expirado. Solicitá uno nuevo desde "Olvidé mi contraseña".',
      );
    }
    const codigoNorm = codigo.trim();
    if (
      !usuario.codigoRecuperacionContrasena ||
      usuario.codigoRecuperacionContrasena !== codigoNorm
    ) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'Código inválido o expirado. Solicitá uno nuevo desde "Olvidé mi contraseña".',
      );
    }
    const expiraEnDate = usuario.codigoRecuperacionExpiraEn
      ? parseArgentinaToDate(usuario.codigoRecuperacionExpiraEn)
      : null;
    const now = new Date();
    if (!expiraEnDate || isNaN(expiraEnDate.getTime()) || now > expiraEnDate) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'El código expiró. Solicitá uno nuevo desde "Olvidé mi contraseña".',
      );
    }
    usuario.contrasena = await bcrypt.hash(nuevaContrasena, 10);
    usuario.codigoRecuperacionContrasena = null;
    usuario.codigoRecuperacionExpiraEn = null;
    await this.usuarioRepository.save(usuario);
  }
}
