import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8002' : '/api')
const money = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const number = (n: number) => new Intl.NumberFormat('es-AR').format(n)
const date = (value?: string) => value ? value.slice(0, 10).split('-').reverse().join('/') : 'Sin información'
const name = (person?: Person | null) => person?.nombre && person?.apellido ? `${person.nombre} ${person.apellido}` : 'Sin información'
const relationName = (item?: { nombre: string } | null) => item?.nombre || 'Sin información'
const matches = (text: string, search: string) => text.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))
const month = (value: string) => new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`))
const colors = ['#176b63', '#f2a65a', '#6b7bcb', '#d1786b']

type Person = { nombre: string; apellido: string }
type Socio = Person & { id: number; dni: string; fecha_nacimiento: string; telefono: string | null; activo: boolean }
type Actividad = { id: number; nombre: string; categoria?: { nombre: string } | null; profesor?: Person | null }
type Inscripcion = { id: number; socio?: Person | null; actividad?: { nombre: string } | null; fecha_inscripcion: string; activa: boolean }
type Cuota = { id: number; socio?: Person | null; periodo: string; monto: number; estado: string }
type Pago = { id: number; cuota_id: number; fecha_pago: string; medio_pago: string }
type Resumen = { socios_activos: number; actividades: number; profesores: number; inscripciones_activas: number; cuotas_pendientes: number; recaudacion_total: number; recaudacion_mes_actual: number }
type Balance = { mes: string; ingresos: number; gastos: number; balance: number }
type Gasto = { id: number; concepto: string; categoria: string; fecha_pago: string; monto: number | string }
type ChartRow = Record<string, string | number>
type Page = 'Dashboard' | 'Socios' | 'Actividades' | 'Inscripciones' | 'Cuotas y pagos' | 'Gastos'

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`)
  if (!response.ok) throw new Error(`Error ${response.status} al consultar ${path}`)
  return response.json() as Promise<T>
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  if (!rows.length) return <p className="empty">No hay resultados para los filtros seleccionados.</p>
  return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return <span className={`badge ${active ? 'positive' : 'muted'}`}>{label}</span>
}

function ChartCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <section className="chart-card"><h3>{title}</h3><div className="chart-area">{children}</div>{footer}</section>
}

function Dashboard() {
  const [data, setData] = useState<{ resumen: Resumen; socios: ChartRow[]; inscripciones: ChartRow[]; recaudacion: ChartRow[]; cuotas: ChartRow[]; medios: ChartRow[]; balance: Balance[] } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    Promise.all([
      get<Resumen>('/dashboard/resumen'), get<ChartRow[]>('/dashboard/socios-por-actividad'),
      get<ChartRow[]>('/dashboard/inscripciones-por-mes'), get<ChartRow[]>('/dashboard/recaudacion-mensual'),
      get<ChartRow[]>('/dashboard/estado-cuotas'), get<ChartRow[]>('/dashboard/medios-pago'), get<Balance[]>('/dashboard/balance-mensual')
    ]).then(([resumen, socios, inscripciones, recaudacion, cuotas, medios, balance]) => { if (current) setData({ resumen, socios, inscripciones, recaudacion, cuotas, medios, balance }) }).catch(e => { if (current) setError(String(e)) })
    return () => { current = false }
  }, [])
  if (error) return <p className="error">{error}. Revisá que FastAPI y PostgreSQL estén en ejecución.</p>
  if (!data) return <p>Cargando dashboard…</p>
  const ultimoBalance = data.balance.at(-1)
  const latest = data.recaudacion.at(-1)
  const stats = [
    { label: 'Socios activos', value: number(data.resumen.socios_activos) },
    { label: 'Inscripciones activas', value: number(data.resumen.inscripciones_activas) },
    { label: 'Actividades', value: number(data.resumen.actividades) },
    { label: 'Cuotas pendientes', value: number(data.resumen.cuotas_pendientes) },
    { label: 'Última recaudación', value: latest ? money(Number(latest.recaudacion)) : 'Sin información', detail: latest ? month(String(latest.mes)) : undefined },
    { label: 'Gastos del último mes registrado', value: ultimoBalance ? money(ultimoBalance.gastos) : 'Sin información', detail: ultimoBalance ? month(ultimoBalance.mes) : undefined },
    { label: 'Saldo del último mes registrado', value: ultimoBalance ? money(ultimoBalance.balance) : 'Sin información', detail: ultimoBalance ? month(ultimoBalance.mes) : undefined }
  ]
  const totalCuotas = data.cuotas.reduce((sum, row) => sum + Number(row.cantidad), 0)
  return <>
    <div className="stats">{stats.map(stat => <div className="stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong>{stat.detail && <small>{stat.detail}</small>}</div>)}</div>
    <div className="charts">
      <ChartCard title="Cuotas cobradas y gastos por mes"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.balance}><CartesianGrid strokeDasharray="3 3" stroke="#e9efed"/><XAxis dataKey="mes" tick={{ fontSize: 11 }}/><YAxis width={65} tickFormatter={v => `${number(Math.round(v / 1000))} mil`}/><Tooltip formatter={v => money(Number(v))}/><Legend/><Bar dataKey="ingresos" name="Cuotas cobradas" fill={colors[0]}/><Bar dataKey="gastos" name="Gastos pagados" fill={colors[3]}/></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Socios por actividad"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.socios} margin={{ bottom: 48, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e9efed"/><XAxis dataKey="actividad" angle={-28} textAnchor="end" height={78} interval={0} tick={{ fontSize: 11 }}/><YAxis allowDecimals={false} tick={{ fontSize: 11 }}/><Tooltip formatter={v => number(Number(v))}/><Bar dataKey="socios" fill={colors[0]} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Inscripciones por mes"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.inscripciones} margin={{ right: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e9efed"/><XAxis dataKey="mes" minTickGap={25} tick={{ fontSize: 11 }}/><YAxis allowDecimals={false} tick={{ fontSize: 11 }}/><Tooltip formatter={v => number(Number(v))}/><Line type="monotone" dataKey="inscripciones" stroke={colors[2]} strokeWidth={3} dot={false} activeDot={{ r: 5 }}/></LineChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Recaudación mensual"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.recaudacion} margin={{ right: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e9efed"/><XAxis dataKey="mes" minTickGap={15} tick={{ fontSize: 11 }}/><YAxis width={58} tickFormatter={v => `${number(Math.round(v / 1000))} mil`} tick={{ fontSize: 11 }}/><Tooltip formatter={v => money(Number(v))}/><Line type="monotone" dataKey="recaudacion" stroke={colors[0]} strokeWidth={3} dot={false} activeDot={{ r: 5 }}/></LineChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Estado de cuotas" footer={<div className="chart-summary">{data.cuotas.map(row => <div key={String(row.estado)}><span className="summary-dot" style={{ background: row.estado === 'pagada' ? colors[0] : colors[1] }}/><span>{row.estado === 'pagada' ? 'Pagadas' : 'Pendientes'}</span><strong>{number(Number(row.cantidad))} · {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(totalCuotas ? Number(row.cantidad) / totalCuotas * 100 : 0)} %</strong></div>)}</div>}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.cuotas} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" innerRadius={48} outerRadius={90}>{data.cuotas.map((row, i) => <Cell key={i} fill={row.estado === 'pagada' ? colors[0] : colors[1]}/>)}</Pie><Tooltip formatter={v => number(Number(v))}/></PieChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Medios de pago"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.medios} dataKey="cantidad" nameKey="medio_pago" cx="50%" cy="50%" outerRadius={90} label>{data.medios.map((_, i) => <Cell key={i} fill={colors[i % colors.length]}/>)}</Pie><Tooltip formatter={v => number(Number(v))}/><Legend/></PieChart></ResponsiveContainer></ChartCard>
    </div>
  </>
}

function Gastos() {
  const [gastos, setGastos] = useState<Gasto[] | null>(null)
  const [error, setError] = useState('')
  const [mesGastos, setMesGastos] = useState('')
  useEffect(() => {
    let current = true
    get<Gasto[]>('/gastos').then(rows => { if (current) setGastos(rows) })
      .catch(e => { if (current) setError(String(e)) })
    return () => { current = false }
  }, [])
  if (error) return <p className="error">{error}</p>
  if (!gastos) return <p className="status">Cargando gastos...</p>
  const periodos = [...new Set(gastos.map(gasto => gasto.fecha_pago.slice(0, 7)))].sort().reverse()
  const periodoGastos = mesGastos || periodos[0] || ''
  const gastosDelMes = gastos.filter(gasto => gasto.fecha_pago.slice(0, 7) === periodoGastos)
  const totalGastos = gastosDelMes.reduce((total, gasto) => total + Number(gasto.monto), 0)
  return (
    <section className="chart-card" aria-label="Detalle de gastos">
      <h3>Detalle de gastos</h3>
      <div className="filters">
        <label><span>Mes de los gastos</span><select value={periodoGastos} onChange={e => setMesGastos(e.target.value)} disabled={!periodos.length}>
          {!periodos.length && <option value="">Sin movimientos</option>}
          {periodos.map(mes => <option key={mes} value={mes}>{month(mes)}</option>)}
        </select></label>
        <div>Total del mes: <strong>{money(totalGastos)}</strong></div>
      </div>
      <Table headers={['Concepto', 'Categoría', 'Fecha de pago', 'Importe']} rows={gastosDelMes.map(gasto => [gasto.concepto, gasto.categoria, date(gasto.fecha_pago), money(Number(gasto.monto))])}/>
    </section>
  )
}

function Listing({ page }: { page: Exclude<Page, 'Dashboard' | 'Gastos'> }) {
  const [rows, setRows] = useState<unknown[] | null>(null)
  const [payments, setPayments] = useState<Pago[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todos')
  const [activity, setActivity] = useState('todas')
  const [period, setPeriod] = useState('todos')
  useEffect(() => {
    let current = true
    const endpoint = ({ Socios: '/socios', Actividades: '/actividades', Inscripciones: '/inscripciones', 'Cuotas y pagos': '/cuotas' } as const)[page]
    Promise.all([get<unknown[]>(endpoint), page === 'Cuotas y pagos' ? get<Pago[]>('/pagos') : Promise.resolve([])]).then(([items, pagos]) => {
      if (current) { setRows(items); setPayments(pagos) }
    }).catch(e => { if (current) setError(String(e)) })
    return () => { current = false }
  }, [page])
  if (error) return <p className="error">{error}. Revisá que FastAPI y PostgreSQL estén en ejecución.</p>
  if (!rows) return <p className="status">Cargando {page.toLowerCase()}…</p>
  const searchBox = <label className="search-field"><span>Buscar</span><input aria-label="Buscar" value={search} onChange={e => setSearch(e.target.value)} placeholder={page === 'Actividades' ? 'Actividad, categoría o profesor' : page === 'Socios' ? 'Nombre, apellido o DNI' : 'Nombre del socio'}/></label>
  const statusFilter = <label><span>Estado</span><select aria-label="Filtrar por estado" value={status} onChange={e => setStatus(e.target.value)}><option value="todos">Todos</option><option value="activos">{page === 'Cuotas y pagos' ? 'Pagadas' : 'Activos'}</option><option value="inactivos">{page === 'Cuotas y pagos' ? 'Pendientes' : 'Inactivos'}</option></select></label>
  if (page === 'Socios') {
    const filtered = (rows as Socio[]).filter(s => matches(`${s.nombre} ${s.apellido} ${s.dni}`, search) && (status === 'todos' || s.activo === (status === 'activos')))
    return <><div className="filters">{searchBox}{statusFilter}</div><Table headers={['Nombre', 'Apellido', 'DNI', 'Nacimiento', 'Teléfono', 'Estado']} rows={filtered.map(s => [s.nombre, s.apellido, s.dni, date(s.fecha_nacimiento), s.telefono || '—', <Badge active={s.activo} label={s.activo ? 'Activo' : 'Inactivo'}/>])}/></>
  }
  if (page === 'Actividades') {
    const filtered = (rows as Actividad[]).filter(a => matches(`${a.nombre} ${relationName(a.categoria)} ${name(a.profesor)}`, search))
    return <><div className="filters">{searchBox}</div><Table headers={['Actividad', 'Categoría', 'Profesor']} rows={filtered.map(a => [a.nombre, relationName(a.categoria), name(a.profesor)])}/></>
  }
  if (page === 'Inscripciones') {
    const items = rows as Inscripcion[]
    const activities = [...new Set(items.map(i => relationName(i.actividad)))].sort((a, b) => a.localeCompare(b, 'es'))
    const filtered = items.filter(i => matches(name(i.socio), search) && (activity === 'todas' || relationName(i.actividad) === activity) && (status === 'todos' || i.activa === (status === 'activos')))
    return <><div className="filters">{searchBox}<label><span>Actividad</span><select aria-label="Filtrar por actividad" value={activity} onChange={e => setActivity(e.target.value)}><option value="todas">Todas</option>{activities.map(a => <option key={a} value={a}>{a}</option>)}</select></label>{statusFilter}</div><Table headers={['Socio', 'Actividad', 'Fecha de inscripción', 'Estado']} rows={filtered.map(i => [name(i.socio), relationName(i.actividad), date(i.fecha_inscripcion), <Badge active={i.activa} label={i.activa ? 'Activa' : 'Inactiva'}/>])}/></>
  }
  const items = rows as Cuota[]
  const periods = [...new Set(items.map(c => c.periodo))].sort().reverse()
  const filtered = items.filter(c => matches(name(c.socio), search) && (period === 'todos' || c.periodo === period) && (status === 'todos' || (c.estado === 'pagada') === (status === 'activos')))
  const byCuota = new Map<number, Pago[]>()
  payments.forEach(p => byCuota.set(p.cuota_id, [...(byCuota.get(p.cuota_id) || []), p]))
  return <><div className="filters">{searchBox}<label><span>Período</span><select aria-label="Filtrar por período" value={period} onChange={e => setPeriod(e.target.value)}><option value="todos">Todos</option>{periods.map(p => <option key={p} value={p}>{month(p.slice(0, 7))}</option>)}</select></label>{statusFilter}</div><Table headers={['Socio', 'Período', 'Monto', 'Estado', 'Fecha de pago', 'Medio de pago']} rows={filtered.flatMap(c => {
    const paid = byCuota.get(c.id) || []
    const base = [name(c.socio), date(c.periodo), money(Number(c.monto)), <Badge active={c.estado === 'pagada'} label={c.estado}/>]
    return paid.length ? paid.map(p => [...base, date(p.fecha_pago), p.medio_pago]) : [[...base, '—', '—']]
  })}/></>
}

export default function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const pages: Page[] = ['Dashboard', 'Socios', 'Actividades', 'Inscripciones', 'Cuotas y pagos', 'Gastos']
  return <div className="layout"><aside><div className="brand"><span className="brand-mark">CM</span><div><strong>Club Atlético Moreno</strong><small>ITUNM · Gestión de Proyectos</small></div></div><nav>{pages.map(p => <button key={p} className={page === p ? 'selected' : ''} onClick={() => setPage(p)}>{p}</button>)}</nav><p className="side-note">PostgreSQL → FastAPI → React</p></aside><main><header><div><span className="eyebrow">PANEL ADMINISTRATIVO</span><h1>{page}</h1></div><span className="header-tag">Club Moreno ITUNM</span></header><div className="content">{page === 'Dashboard' ? <Dashboard/> : page === 'Gastos' ? <Gastos/> : <Listing key={page} page={page}/>}</div></main></div>
}
