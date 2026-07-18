# `src/shared/components/`

Design system compartido entre features (destino de los componentes shadcn,
ej. `ui/button.tsx`, `ui/dialog.tsx` — generados con `npx shadcn add ...` una
vez que existan los tokens reales de "Claude Design", ver `docs/design-brief.md`).

También componentes compuestos reusados por 2+ features (ej. el shell
List-Master-Detail del patrón "documento" — ver
`specs/ui-screens/patron-documento-list-master-detail.md`).

Nada específico de una sola feature va aquí — eso vive en
`src/features/{feature}/components/`.
