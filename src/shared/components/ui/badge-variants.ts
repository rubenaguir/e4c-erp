import { cva } from 'class-variance-authority'

/**
 * Variantes `prefactura`/`timbrada`/`cancelada` mapean el estatus de
 * documento (docs/design-brief.md, "Sistema de estados de documento") —
 * `timbrada` reusa el verde ya definido para el estatus genérico `T`
 * ("Timbrado") de Sisnet V3: para facturas_venta_33, el estatus `R`
 * cumple ese mismo rol semántico (ver ADR-016 en docs/decisiones.md).
 */
export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-white shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        prefactura: 'border-transparent bg-muted text-muted-foreground',
        timbrada: 'border-transparent bg-[#16A34A] text-white',
        cancelada: 'border-transparent bg-destructive text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
