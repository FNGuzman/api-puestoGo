import { Global, Module } from '@nestjs/common';
import { ErrorHandlerService } from './services/error-handler.service';
import { GetEntityService } from './services/get-entity.service';

/**
 * Módulo global que provee servicios compartidos (ErrorHandlerService, GetEntityService).
 * Al importarlo una vez en AppModule, cualquier módulo puede inyectarlos sin declararlos en providers.
 */
@Global()
@Module({
  providers: [ErrorHandlerService, GetEntityService],
  exports: [ErrorHandlerService, GetEntityService],
})
export class CommonModule {}
