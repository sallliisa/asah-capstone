import './grade-display.css'

export const tenantGradeLabels = {
  A: 'A · Routine',
  B: 'B · Check soon',
  C: 'C · Check first',
}

export type TenantGrade = keyof typeof tenantGradeLabels

export function isTenantGrade(value: unknown): value is TenantGrade {
  return typeof value === 'string' && Object.hasOwn(tenantGradeLabels, value)
}
