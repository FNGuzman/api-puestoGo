import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { UsuarioModule } from '../usuario/usuario.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FlexibleJwtAuthGuard } from 'src/common/guards/flexible-jwt-auth.guard';
import { getAccessTokenSecret } from 'src/config/auth-secrets';

const accessTokenExpiresIn: SignOptions['expiresIn'] =
  (process.env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn']) ?? '1d';

@Module({
  imports: [
    forwardRef(() => UsuarioModule),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getAccessTokenSecret(),
        signOptions: { expiresIn: accessTokenExpiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FlexibleJwtAuthGuard],
  exports: [AuthService, FlexibleJwtAuthGuard],
})
export class AuthModule {}
