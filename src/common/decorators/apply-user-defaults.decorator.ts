import { Transform } from 'class-transformer';
import { AUTH_CONSTANTS } from '../constants/constants';

/**
 * Transformador que aplica valores hardcodeados para sistema, organización y rol
 * en el DTO de creación de empleado
 */
export function ApplyUserDefaults() {
  return Transform(({ value, obj }) => {
    // Si no se proporciona sistema, usar el valor por defecto
    if (obj.sistema === undefined || obj.sistema === null) {
      obj.sistema = AUTH_CONSTANTS.SISTEMA_ID;
    }
    // Si no se proporciona organización, usar el valor por defecto
    if (obj.organizacion === undefined || obj.organizacion === null) {
      obj.organizacion = AUTH_CONSTANTS.ORGANIZACION_ID;
    }
    return value;
  });
}
