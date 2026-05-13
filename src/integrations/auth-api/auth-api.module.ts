import axios from 'axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExternalAuthApiService } from './auth-api.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'AXIOS_INSTANCE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const baseURL = configService.get<string>('AUTH_API_URL') || 'https://auth.pushsoftware.com.ar';
        return axios.create({
          baseURL,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
    },
    ExternalAuthApiService,
  ],
  exports: [ExternalAuthApiService],
})
export class AuthApiModule {}
