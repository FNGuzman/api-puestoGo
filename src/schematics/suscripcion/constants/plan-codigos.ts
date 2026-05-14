/** Códigos estables para catálogo de planes (app + API). */
export const PLAN_CODIGO = {
  BASICO: 'BASICO',
  PRO: 'PRO',
  EQUIPO: 'EQUIPO',
} as const;

export type PlanCodigo = (typeof PLAN_CODIGO)[keyof typeof PLAN_CODIGO];
