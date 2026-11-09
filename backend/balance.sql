WITH movimientos AS (
  SELECT fecha_pago, monto AS ingresos, 0::numeric AS gastos FROM pagos
  UNION ALL
  SELECT fecha_pago, 0::numeric AS ingresos, monto AS gastos FROM gastos
)
SELECT to_char(fecha_pago, 'YYYY-MM') AS mes,
       sum(ingresos)::float8 AS ingresos,
       sum(gastos)::float8 AS gastos,
       (sum(ingresos) - sum(gastos))::float8 AS balance
FROM movimientos
GROUP BY 1 ORDER BY 1
