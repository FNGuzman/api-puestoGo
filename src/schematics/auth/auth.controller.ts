import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUsuarioRequestDto } from '../usuario/dto/login-usuario-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { UsuarioDTO } from '../usuario/dto/usuario.dto';
import { FlexibleJwtAuthGuard } from 'src/common/guards/flexible-jwt-auth.guard';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { SwaggerSignupRequestDto } from './dto/swagger-usuario-request.dto';
import { VerifyEmailRequestDto } from './dto/verify-email-request.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';

@ApiTags('Auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @Post('signup')
  @ApiOperation({
    summary: 'Registrar nuevo usuario y autenticarlo',
    description:
      'Registra un nuevo usuario proporcionando su información personal y lo autentica con un token JWT',
  })
  @ApiBody({
    type: SwaggerSignupRequestDto,
    description: 'Datos del nuevo usuario',
  })
  @ApiCreatedResponse({
    type: SignupResponseDto,
    description: 'Usuario registrado y autenticado exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Solicitud incorrecta o usuario ya existe',
  })
  async signup(
    @Body() signupRequestDto: SignupRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SignupResponseDto> {
    return this.authService.signup(signupRequestDto, file);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión de usuario',
    description:
      'Inicia sesión con email y contraseña. Devuelve access_token (Authorization) y refresh_token (guardar para renovar con POST /auth/refresh).',
  })
  @ApiBody({
    type: LoginUsuarioRequestDto,
    description: 'Credenciales de acceso: email y contraseña',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Login exitoso con access token y refresh token',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(
    @Body() loginUsuarioRequestDto: LoginUsuarioRequestDto,
  ): Promise<LoginResponseDto> {
    const usuario = await this.authService.validateUser(
      loginUsuarioRequestDto.email,
      loginUsuarioRequestDto.contrasena,
    );
    return this.authService.login(usuario);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description:
      'Envía un código de 6 dígitos al correo si la cuenta existe. La respuesta es siempre genérica por seguridad.',
  })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiOkResponse({
    description: 'Solicitud procesada',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Si el correo está registrado, recibirás un código para restablecer la contraseña.',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email inválido' })
  async forgotPassword(
    @Body() body: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña con código',
    description:
      'Usa el código recibido por correo (válido 15 minutos) y la nueva contraseña.',
  })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiOkResponse({
    description: 'Contraseña actualizada',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Contraseña actualizada correctamente. Ya podés iniciar sesión.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Código inválido o expirado, o datos inválidos',
  })
  async resetPassword(
    @Body() body: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(body);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar tokens',
    description:
      'Intercambia un refresh token válido por un nuevo access_token y refresh_token. Usar cuando el access token expire.',
  })
  @ApiBody({
    type: RefreshTokenRequestDto,
    description:
      'Refresh token obtenido en login o en la última llamada a /refresh',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Nuevo par de tokens y datos del usuario',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado' })
  async refresh(
    @Body() body: RefreshTokenRequestDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refreshTokens(body.refresh_token);
  }

  @Get('me')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Obtener información del usuario autenticado',
    description:
      'Obtiene la información del usuario autenticado proporcionando su token JWT',
  })
  @ApiOkResponse({
    type: UsuarioDTO,
    description: 'Información del usuario autenticado obtenida correctamente',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getCurrentUser(@Request() req: any): Promise<UsuarioDTO> {
    return await this.authService.getCurrentUser(req.user.id);
  }

  @Post('verify-email')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Verificar correo con código',
    description:
      'Verifica el correo del usuario con el código de 6 dígitos enviado por email. Requiere estar autenticado.',
  })
  @ApiBody({
    type: VerifyEmailRequestDto,
    description: 'Código de 6 dígitos recibido por correo',
  })
  @ApiOkResponse({
    description: 'Correo verificado correctamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Correo verificado correctamente' },
        usuario: { $ref: '#/components/schemas/UsuarioDTO' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Código inválido o expirado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async verifyEmail(
    @Request() req: any,
    @Body() body: VerifyEmailRequestDto,
  ): Promise<{ message: string; usuario: UsuarioDTO }> {
    return this.authService.verifyEmail(req.user.id, body.codigo);
  }

  @Post('send-verification-email')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Reenviar código de verificación',
    description:
      'Genera un nuevo código y lo envía al correo del usuario. Usar cuando el código anterior haya expirado o no llegó. Requiere estar autenticado.',
  })
  @ApiOkResponse({
    description: 'Código reenviado',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Código de verificación reenviado a tu correo',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'El correo ya está verificado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async sendVerificationEmail(
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationEmail(req.user.id);
  }

  @Post('logout')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Cerrar sesión de usuario',
    description:
      'Cierra la sesión del usuario autenticado. Actualiza el último acceso y el cliente debe eliminar el token del almacenamiento local.',
  })
  @ApiOkResponse({
    description: 'Sesión cerrada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Sesión cerrada exitosamente',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async logout(@Request() req: any): Promise<{ message: string }> {
    return await this.authService.logout(req.user.id);
  }

  @Patch('change-password')
  @UseGuards(FlexibleJwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Cambiar contraseña de usuario',
    description:
      'Cambia la contraseña del usuario autenticado. El email en el body debe ser el de tu sesión. Requiere estar logueado.',
  })
  @ApiBody({
    type: ChangePasswordRequestDto,
    description:
      'Datos para cambiar la contraseña: email (debe ser el tuyo), nueva contraseña y confirmación',
  })
  @ApiOkResponse({
    description: 'Contraseña cambiada exitosamente',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Las contraseñas no coinciden, el email no es el de tu cuenta o datos inválidos',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    return await this.authService.changePassword(
      changePasswordDto,
      req.user.id,
    );
  }
}
