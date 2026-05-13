import { BaseEntity } from 'src/common/models/baseentity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { Column, Entity, OneToOne } from 'typeorm';

@Entity('user_02_cab_persona')
export class Persona extends BaseEntity {

  @Column({ name: 'user02_nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'user02_apellido', type: 'varchar', length: 255 })
  apellido: string;

  @OneToOne(() => Usuario, (usuario) => usuario.persona)
  usuario: Usuario;

  static fromId(id: number) {
    const persona = new Persona();
    persona.id = id;
    return persona;
  }
}