/** Códigos de funciones habilitables por plan (app / API). */
export const PLAN_FUNCION_CODIGO = {
  AJUSTE_MASIVO_PRECIO: 'AJUSTE_MASIVO_PRECIO',
  AJUSTE_MASIVO_STOCK: 'AJUSTE_MASIVO_STOCK',
  /** PDF / impresión de etiquetas con códigos de barras. */
  GENERAR_ETIQUETAS: 'GENERAR_ETIQUETAS',
  /** Listar, subir y restaurar copias JSON en la cuenta (MySQL). */
  BACKUP_NUBE: 'BACKUP_NUBE',
} as const;

export type PlanFuncionCodigo =
  (typeof PLAN_FUNCION_CODIGO)[keyof typeof PLAN_FUNCION_CODIGO];

/** Alineado con la app móvil (`MENSAJE_FUNCION_PLAN_PRO`). */
export const MENSAJE_FUNCION_PLAN_PRO =
  'Esta función está disponible en el plan Pro o superior.';
