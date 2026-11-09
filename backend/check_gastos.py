"""Integration check in an isolated schema, rolled back even on failure."""
import json
from pathlib import Path
import subprocess
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_engine
from routers.dashboard import balance_mensual
from routers.data import gastos
from schemas import Gasto


def main():
    root = Path(__file__).resolve().parent.parent
    queries = json.loads(subprocess.check_output([
        'node', '--input-type=module', '-e',
        "import {queries} from './frontend/netlify/functions/api.mjs'; console.log(JSON.stringify(queries))",
    ], cwd=root, text=True))
    with get_engine().connect() as conn:
        transaction = conn.begin()
        try:
            schema = 'test_gastos_' + uuid.uuid4().hex
            conn.exec_driver_sql(f'CREATE SCHEMA {schema}')
            conn.exec_driver_sql(f'SET LOCAL search_path TO {schema}')
            for file in ['database/database_setup.sql', 'database/agregar_gastos.sql']:
                sql = (root / file).read_text(encoding='utf-8').replace('BEGIN;', '').replace('COMMIT;', '')
                conn.connection.driver_connection.execute(sql)
            assert conn.scalar(text('SELECT count(*) FROM gastos')) == 64
            db = Session(bind=conn)
            rows = balance_mensual(db)
            deployed = [dict(r) for r in conn.execute(text(queries['/dashboard/balance-mensual'])).mappings()]
            assert rows == deployed and len(rows) == 8
            assert all(r['balance'] == r['ingresos'] - r['gastos'] for r in rows)
            for gasto in gastos(db):
                Gasto.model_validate(gasto)
            print('64 gastos; repeatable migration; matching APIs; valid schemas')
            print('Last month:', rows[-1])
            conn.execute(text("INSERT INTO gastos (concepto, categoria, fecha_pago, monto) VALUES ('Test', 'Test', '2027-01-01', 100)"))
            assert balance_mensual(db)[-1] == dict(mes='2027-01', ingresos=0, gastos=100, balance=-100)
            conn.execute(text('DELETE FROM gastos'))
            assert all(r['gastos'] == 0 for r in balance_mensual(db))
            conn.execute(text('DELETE FROM pagos'))
            assert balance_mensual(db) == []
            print('Expense-only, income-only and empty cases OK')
        finally:
            transaction.rollback()
            print('Test schema and data rolled back')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        # Connection exceptions may contain credentials; report only the type.
        print('Validation failed:', type(exc).__name__)
        raise SystemExit(1)
