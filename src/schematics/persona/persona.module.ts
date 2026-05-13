import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { PersonaMapper } from './mappers/persona.mapper';
import { PersonaRepository } from './repository/persona.repository';
import { PersonaService } from './persona.service';

@Module({
  imports: [TypeOrmModule.forFeature([Persona])],
  controllers: [],
  providers: [PersonaService, PersonaRepository, PersonaMapper],
  exports: [PersonaService, PersonaRepository, PersonaMapper],
})
export class PersonaModule { }
