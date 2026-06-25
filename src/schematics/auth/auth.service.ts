import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { UsuarioDTO } from '../usuario/dto/usuario.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { EmailService } from 'src/common/email/email.service';
import { UsuarioVerificationService } from '../usuario/services/usuario-verification.service';
import { UsuarioPasswordRecoveryService } from '../usuario/services/usuario-password-recovery.service';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import {
  getAccessTokenSecret,
  getRefreshTokenSecret,
} from 'src/config/auth-secrets';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsuarioService))
    private usuarioService: UsuarioService,
    private usuarioVerificationService: UsuarioVerificationService,
    private usuarioPasswordRecoveryService: UsuarioPasswordRecoveryService,
    private jwtService: JwtService,
    private errorHandler: ErrorHandlerService,
    private emailService: EmailService,
  ) {}

  private getAccessTokenSecret(): string {
    return getAccessTokenSecret();
  }

  private getRefreshTokenSecret(): string {
    return getRefreshTokenSecret();
  }

  private getAccessTokenExpiresIn(): string {
    return process.env.ACCESS_TOKEN_EXPIRES_IN || '1d';
  }

  private getRefreshTokenExpiresIn(): string {
    return process.env.ACCESS_TOKEN_REFRESH_EXPIRES_IN || '30d';
  }

  /** Payload del access token (el refresh solo lleva sub). */
  private buildPayload(usuario: UsuarioDTO) {
    return {
      sub: usuario.id,
      email: usuario.email,
    };
  }

  /** Genera access token (corto) y refresh token (largo) para el usuario. */
  private generateTokenPair(usuario: UsuarioDTO): {
    access_token: string;
    refresh_token: string;
  } {
    const payload = this.buildPayload(usuario);
    const access_token = this.jwtService.sign(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: this.getAccessTokenExpiresIn() as any,
    });
    const refresh_token = this.jwtService.sign(
      { sub: usuario.id },
      {
        secret: this.getRefreshTokenSecret(),
        expiresIn: this.getRefreshTokenExpiresIn() as any,
      },
    );
    return { access_token, refresh_token };
  }

  async validateUser(email: string, contrasena: string): Promise<UsuarioDTO> {
    return this.usuarioService.login({ email, contrasena });
  }

  async login(usuario: UsuarioDTO) {
    const { access_token, refresh_token } = this.generateTokenPair(usuario);
    return {
      access_token,
      refresh_token,
      expires_in: this.getAccessTokenExpiresIn(),
      usuario,
    };
  }

  /** Intercambia un refresh token válido por un nuevo par de tokens (y datos de usuario). */
  async refreshTokens(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: string;
    usuario: UsuarioDTO;
  }> {
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'Refresh token es requerido',
      });
    }
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
      const userId =
        typeof payload.sub === 'string'
          ? parseInt(payload.sub, 10)
          : payload.sub;
      if (Number.isNaN(userId)) {
        throw new UnauthorizedException('Refresh token inválido');
      }
      const usuario = await this.usuarioService.findOne(userId, { id: userId });
      if (!usuario) {
        throw new UnauthorizedException('Usuario ya no existe');
      }
      const { access_token, refresh_token } = this.generateTokenPair(usuario);
      return {
        access_token,
        refresh_token,
        expires_in: this.getAccessTokenExpiresIn(),
        usuario,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token inválido o expirado',
      });
    }
  }

  async signup(
    signupDto: SignupRequestDto,
    file?: Express.Multer.File,
  ): Promise<SignupResponseDto> {
    const nuevoUsuario = await this.usuarioService.create(signupDto, file);
    await this.usuarioService.updateUltimoAcceso(nuevoUsuario.id);
    const usuarioActualizado = await this.usuarioVerificationService.markEmailVerified(
      nuevoUsuario.id,
    );
    const { access_token, refresh_token } =
      this.generateTokenPair(usuarioActualizado);
    return {
      access_token,
      refresh_token,
      expires_in: this.getAccessTokenExpiresIn(),
      usuario: usuarioActualizado,
      message: 'Usuario registrado y autenticado exitosamente',
    };
  }

  /** Reservado por si se reactiva verificación por código por email. */
  private async sendVerificationEmailAfterSignup(
    usuarioId: number,
    email: string,
  ): Promise<void> {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
    await this.usuarioVerificationService.setVerificationCode(
      usuarioId,
      codigo,
      expiraEn,
    );
    await this.emailService.sendVerificationEmail(email, codigo);
  }

  async verifyEmail(
    userId: number,
    codigo: string,
  ): Promise<{ message: string; usuario: UsuarioDTO }> {
    const usuario = await this.usuarioVerificationService.verifyCode(
      userId,
      codigo,
    );
    return {
      message: 'Correo verificado correctamente',
      usuario,
    };
  }

  async resendVerificationEmail(userId: number): Promise<{ message: string }> {
    const { email, codigo } =
      await this.usuarioVerificationService.resendVerificationCode(userId);
    await this.emailService.sendVerificationEmail(email, codigo);
    return { message: 'Código de verificación reenviado a tu correo' };
  }

  async getCurrentUser(userId: number): Promise<UsuarioDTO> {
    return this.usuarioService.findOne(userId, { id: userId });
  }

  async changePassword(
    changePasswordDto: ChangePasswordRequestDto,
    userId: number,
  ): Promise<ChangePasswordResponseDto> {
    if (
      changePasswordDto.contrasena !== changePasswordDto.confirmarContrasena
    ) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'La contraseña y su confirmación deben ser iguales',
      );
    }
    const usuarioActual = await this.usuarioService.findOne(userId, { id: userId });
    if (usuarioActual.email !== changePasswordDto.email) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'Solo podés cambiar la contraseña de tu propia cuenta (el email debe coincidir con el de tu sesión)',
      );
    }
    await this.usuarioService.changePassword(
      changePasswordDto.email,
      changePasswordDto.contrasena,
    );
    const usuarioDTO = await this.usuarioService.findOne(userId, { id: userId });
    return {
      message: 'Contraseña cambiada exitosamente',
      usuario: usuarioDTO,
    };
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.usuarioService.updateUltimoAcceso(userId);
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Respuesta genérica para no filtrar si el email existe.
   */
  async forgotPassword(
    dto: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    const payload =
      await this.usuarioPasswordRecoveryService.crearCodigoRecuperacion(
        dto.email,
      );
    if (payload) {
      this.emailService
        .sendPasswordResetEmail(payload.email, payload.codigo)
        .catch((err) => {
          console.error(
            '[AuthService] Error al enviar email de recuperación de contraseña:',
            err,
          );
        });
    }
    return {
      message:
        'Si el correo está registrado, recibirás un código para restablecer la contraseña.',
    };
  }

  async resetPassword(
    dto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.usuarioPasswordRecoveryService.restablecerConCodigo(
      dto.email,
      dto.codigo,
      dto.contrasena,
    );
    return {
      message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.',
    };
  }
}
