import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Search } from 'lucide-react'

import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useFacturasSearch } from '@/features/ventas/facturas_venta_33/hooks/useFacturasSearch'
import type {
  EstatusFactura,
  FacturaSearchRecord,
  SearchFacturasParams,
} from '@/features/ventas/facturas_venta_33/types'

const PAGE_SIZE = 25

/** yyyy-mm-dd (input type="date") → dd/mm/aaaa (formato esperado por Search). */
function toApiDate(isoDate: string): string | undefined {
  if (!isoDate) return undefined
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function fmtCurrency(value: string) {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return value
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ESTATUS_LABEL: Record<EstatusFactura, string> = {
  P: 'Prefactura',
  R: 'Registrada',
  C: 'Cancelada',
}

const ESTATUS_BADGE_VARIANT: Record<EstatusFactura, 'prefactura' | 'timbrada' | 'cancelada'> = {
  P: 'prefactura',
  R: 'timbrada',
  C: 'cancelada',
}

function EstatusBadge({ estatus }: { estatus: EstatusFactura }) {
  return <Badge variant={ESTATUS_BADGE_VARIANT[estatus]}>{ESTATUS_LABEL[estatus]}</Badge>
}

interface FiltrosDraft {
  fechaInicial: string
  fechaFinal: string
  rfc: string
  nombre: string
  serie: string
  folio: string
  estatus: EstatusFactura | ''
}

const DRAFT_INICIAL: FiltrosDraft = {
  fechaInicial: '',
  fechaFinal: '',
  rfc: '',
  nombre: '',
  serie: '',
  folio: '',
  estatus: '',
}

function buildFiltros(draft: FiltrosDraft, start: number): SearchFacturasParams {
  return {
    fecha_inicial: toApiDate(draft.fechaInicial),
    fecha_final: toApiDate(draft.fechaFinal),
    rfc: draft.rfc || undefined,
    nombre: draft.nombre || undefined,
    serie: draft.serie || undefined,
    folio: draft.folio || undefined,
    estatus: draft.estatus || undefined,
    start,
    limit: PAGE_SIZE,
  }
}

export function FacturasListScreen() {
  const navigate = useNavigate()

  const [draft, setDraft] = useState<FiltrosDraft>(DRAFT_INICIAL)
  const [filtros, setFiltros] = useState<SearchFacturasParams>(() =>
    buildFiltros(DRAFT_INICIAL, 0),
  )

  const { data, isLoading, isFetching, error } = useFacturasSearch(filtros)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFiltros(buildFiltros(draft, 0))
  }

  function goToPage(start: number) {
    setFiltros((prev) => ({ ...prev, start }))
  }

  function handleRowClick(row: FacturaSearchRecord) {
    navigate(`/ventas/facturas/${row.serie}/${row.folio}`)
  }

  const records = data?.records ?? []
  const totalCount = data?.totalCount ?? 0
  const start = filtros.start ?? 0
  const canPrev = start > 0
  const canNext = start + PAGE_SIZE < totalCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Facturas de venta</h1>
        <Button onClick={() => navigate('/ventas/facturas/nueva')}>
          <Plus className="size-4" />
          Nueva factura
        </Button>
      </div>

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleSearch}>
            <div className="space-y-1.5">
              <Label htmlFor="fecha-inicial">Fecha inicial</Label>
              <Input
                id="fecha-inicial"
                type="date"
                className="w-40"
                value={draft.fechaInicial}
                onChange={(e) => setDraft((d) => ({ ...d, fechaInicial: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha-final">Fecha final</Label>
              <Input
                id="fecha-final"
                type="date"
                className="w-40"
                value={draft.fechaFinal}
                onChange={(e) => setDraft((d) => ({ ...d, fechaFinal: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                className="w-32 uppercase"
                value={draft.rfc}
                onChange={(e) => setDraft((d) => ({ ...d, rfc: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="nombre">Nombre receptor</Label>
              <Input
                id="nombre"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serie">Serie</Label>
              <Input
                id="serie"
                className="w-20"
                value={draft.serie}
                onChange={(e) => setDraft((d) => ({ ...d, serie: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="folio">Folio</Label>
              <Input
                id="folio"
                className="w-24"
                value={draft.folio}
                onChange={(e) => setDraft((d) => ({ ...d, folio: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estatus">Estatus</Label>
              <Select
                value={draft.estatus || 'todos'}
                onValueChange={(value) =>
                  setDraft((d) => ({
                    ...d,
                    estatus: value === 'todos' ? '' : (value as EstatusFactura),
                  }))
                }
              >
                <SelectTrigger id="estatus" className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="P">Prefactura</SelectItem>
                  <SelectItem value="R">Registrada</SelectItem>
                  <SelectItem value="C">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <Card size="sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Serie/Folio</th>
                <th className="px-4 py-2 font-medium">Receptor</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Estatus</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              )}
              {!isLoading &&
                records.map((row) => (
                  <tr
                    key={`${row.serie}-${row.folio}`}
                    onClick={() => handleRowClick(row)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent"
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.serie}-{row.folio}
                    </td>
                    <td className="max-w-64 truncate px-4 py-2">{row.receptor_nombre}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.fecha}</td>
                    <td className="px-4 py-2">
                      <EstatusBadge estatus={row.estatus} />
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{fmtCurrency(row.total)}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.saldo !== undefined ? fmtCurrency(row.saldo) : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalCount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {start + 1}–{Math.min(start + PAGE_SIZE, totalCount)} de {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev || isFetching}
              onClick={() => goToPage(Math.max(0, start - PAGE_SIZE))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext || isFetching}
              onClick={() => goToPage(start + PAGE_SIZE)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
