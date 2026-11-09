import { neon } from '@neondatabase/serverless'

// Fixed queries only: no URL or request data is interpolated into SQL.
const actividad = `SELECT a.*, row_to_json(p) AS profesor, row_to_json(c) AS categoria
  FROM actividades a JOIN profesores p ON p.id = a.profesor_id
  JOIN categorias c ON c.id = a.categoria_id`
const cuota = `SELECT c.*, row_to_json(s) AS socio FROM cuotas c JOIN socios s ON s.id = c.socio_id`
export const queries = {
  '/gastos': 'SELECT * FROM gastos ORDER BY fecha_pago DESC, id',
  '/dashboard/balance-mensual': `WITH movimientos AS (
    SELECT fecha_pago, monto AS ingresos, 0::numeric AS gastos FROM pagos
    UNION ALL
    SELECT fecha_pago, 0::numeric AS ingresos, monto AS gastos FROM gastos
  )
  SELECT to_char(fecha_pago, 'YYYY-MM') AS mes,
    sum(ingresos)::float8 AS ingresos, sum(gastos)::float8 AS gastos,
    (sum(ingresos) - sum(gastos))::float8 AS balance
  FROM movimientos GROUP BY 1 ORDER BY 1`,
  '/socios': 'SELECT * FROM socios ORDER BY id',
  '/categorias': 'SELECT * FROM categorias ORDER BY id',
  '/profesores': 'SELECT * FROM profesores ORDER BY id',
  '/actividades': `${actividad} ORDER BY a.id`,
  '/inscripciones': `SELECT i.*, row_to_json(s) AS socio, row_to_json(a) AS actividad
    FROM inscripciones i JOIN socios s ON s.id = i.socio_id
    JOIN (${actividad}) a ON a.id = i.actividad_id ORDER BY i.id`,
  '/cuotas': `${cuota} ORDER BY c.periodo DESC, c.id`,
  '/pagos': `SELECT p.*, row_to_json(c) AS cuota FROM pagos p
    JOIN (${cuota}) c ON c.id = p.cuota_id ORDER BY p.fecha_pago DESC, p.id`,
  '/dashboard/resumen': `SELECT
    (SELECT count(*)::int FROM socios WHERE activo) AS socios_activos,
    (SELECT count(*)::int FROM actividades) AS actividades,
    (SELECT count(*)::int FROM profesores) AS profesores,
    (SELECT count(*)::int FROM inscripciones WHERE activa) AS inscripciones_activas,
    (SELECT count(*)::int FROM cuotas WHERE estado = 'pendiente') AS cuotas_pendientes,
    (SELECT coalesce(sum(monto), 0)::float8 FROM pagos) AS recaudacion_total,
    (SELECT coalesce(sum(monto), 0)::float8 FROM pagos
      WHERE fecha_pago BETWEEN date_trunc('month', CURRENT_DATE)::date AND CURRENT_DATE) AS recaudacion_mes_actual`,
  '/dashboard/socios-por-actividad': `SELECT a.nombre AS actividad, count(i.id)::int AS socios
    FROM actividades a LEFT JOIN inscripciones i ON i.actividad_id = a.id AND i.activa
    GROUP BY a.id ORDER BY a.id`,
  '/dashboard/inscripciones-por-mes': `SELECT to_char(fecha_inscripcion, 'YYYY-MM') AS mes,
    count(*)::int AS inscripciones FROM inscripciones GROUP BY 1 ORDER BY 1`,
  '/dashboard/recaudacion-mensual': `SELECT to_char(fecha_pago, 'YYYY-MM') AS mes,
    sum(monto)::float8 AS recaudacion FROM pagos GROUP BY 1 ORDER BY 1`,
  '/dashboard/estado-cuotas': 'SELECT estado, count(*)::int AS cantidad FROM cuotas GROUP BY estado',
  '/dashboard/medios-pago': 'SELECT medio_pago, count(*)::int AS cantidad FROM pagos GROUP BY medio_pago',
}

const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
})

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405, headers: { Allow: 'GET' } })
  }
  const path = new URL(request.url).pathname
    .replace(/^\/(?:api|\.netlify\/functions\/api)(?=\/|$)/, '').replace(/\/$/, '')
  if (path === '/health') return json({ status: 'ok' })
  if (!Object.hasOwn(queries, path)) return json({ detail: 'Ruta no encontrada' }, 404)
  const url = process.env.DATABASE_URL
  if (!url) return json({ detail: 'Falta configurar DATABASE_URL en Netlify' }, 503)
  try {
    const sql = neon(url.replace(/^postgresql\+psycopg:\/\//, 'postgresql://'))
    const rows = await sql.query(queries[path])
    return json(path === '/dashboard/resumen' ? rows[0] : rows)
  } catch {
    // Do not expose connection strings, SQL or database details to visitors/logs.
    return json({ detail: 'No se pudo consultar la base de datos' }, 503)
  }
}
