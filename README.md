# Club Moreno ITUNM

Aplicación académica pequeña para mostrar una base relacional PostgreSQL, una API REST con FastAPI y un dashboard React. La información del panel se consulta a PostgreSQL a través de la API.

## Tecnologías y arquitectura

PostgreSQL → FastAPI (Python, SQLAlchemy, Pydantic, psycopg, Uvicorn) → React (TypeScript, Vite, Recharts). La base también podrá ser consultada directamente por herramientas de análisis.

## Entidades y relaciones

La base contiene exactamente siete tablas: `socios`, `categorias`, `profesores`, `actividades`, `inscripciones`, `cuotas` y `pagos`. Las PK son `id`. Las FK son `actividades.profesor_id`, `actividades.categoria_id`, `inscripciones.socio_id`, `inscripciones.actividad_id`, `cuotas.socio_id` y `pagos.cuota_id`.

- Profesor 1:N actividades; categoría 1:N actividades.
- Socio N:M actividades mediante inscripciones.
- Socio 1:N cuotas; cuota 1:N pagos.

Las cuotas tienen un período `DATE` normalizado al primer día del mes y montos `NUMERIC(12,2)`. La suma de pagos es la fuente de recaudación; una cuota marcada `pagada` tiene un pago en el dataset inicial. El SQL agrega 80 socios, 4 categorías, 6 profesores, 8 actividades, 160 inscripciones, 640 cuotas y pagos para las cuotas pagadas. Las fechas se distribuyen entre distintos meses.

## Estructura

- `database/database_setup.sql`: tablas, restricciones y datos ficticios.
- `backend/`: modelos, esquemas, rutas y conexión PostgreSQL.
- `frontend/`: aplicación React y estilos.
- `.env.example`: plantilla de conexión, sin credenciales reales.

## Instalación y ejecución

1. Instalá PostgreSQL, Python 3.10 o superior y Node.js. Creá **manualmente una base vacía** llamada, por ejemplo, `club_moreno_itunm` desde pgAdmin o PostgreSQL. Elegí vos el usuario, contraseña, host y puerto. No ejecutes el script sobre una base que ya tenga tablas con estos nombres.
2. Conectate a esa base en pgAdmin y ejecutá completo `database/database_setup.sql` en Query Tool. Alternativamente, con `psql`: `psql -U TU_USUARIO -d club_moreno_itunm -f database/database_setup.sql`. El script no ejecuta `CREATE DATABASE`.
3. Copiá `.env.example` como `.env` en la raíz y reemplazá `usuario`, `password`, host, puerto y nombre de base por tus valores reales. Si la contraseña tiene caracteres especiales, codificalos para una URL. La variable requerida es `DATABASE_URL`.
4. En `backend/`, ejecutá `python -m venv .venv`, activá el entorno (`.venv\Scripts\Activate.ps1` en PowerShell, `source .venv/bin/activate` en Linux/macOS), `pip install -r requirements.txt` y `uvicorn main:app --reload --port 8001`. La API abre en `http://localhost:8001`; documentación en `/docs`.
5. En otra terminal, en `frontend/`, ejecutá `npm install` y `npm run dev`. Abrí `http://localhost:5173`. Para compilar: `npm run build`.

En Windows, después de instalar las dependencias, también podés abrir dos terminales en la raíz y ejecutar `start-backend.bat` y `start-frontend.bat`. El primer script usa directamente `backend/.venv/Scripts/python.exe`, por lo que no requiere activar el entorno virtual ni depender de que `python` y `uvicorn` estén en el `PATH`.

El frontend usa `http://localhost:8001` por defecto. Para otra dirección, definí `VITE_API_URL` en `frontend/.env.local`. La API permite CORS desde el servidor Vite local.

## API y dashboard

`GET /health`, `/socios`, `/actividades`, `/profesores`, `/categorias`, `/inscripciones`, `/cuotas`, `/pagos` y `/dashboard/resumen`, `/dashboard/socios-por-actividad`, `/dashboard/inscripciones-por-mes`, `/dashboard/recaudacion-mensual`, `/dashboard/estado-cuotas`, `/dashboard/medios-pago`.

El Dashboard muestra cinco indicadores (socios activos, inscripciones activas, actividades, última recaudación y cuotas pendientes) y cinco gráficos: socios por actividad, inscripciones por mes, recaudación mensual, estado de cuotas y medios de pago. La última recaudación muestra el monto y mes de la última fila disponible del historial de pagos. Todas las cifras se consultan a la API y provienen de PostgreSQL. El estado de cuotas incluye porcentajes calculados a partir de los totales reales.

Las demás pantallas muestran tablas de socios, actividades, inscripciones, cuotas y pagos. La aplicación es de consulta; no incluye formularios de edición.

## Uso futuro para visualización

PostgreSQL podrá utilizarse como fuente de datos directa para herramientas como Power BI. Sus claves foráneas, fechas `DATE` y montos `NUMERIC` permiten analizar inscripciones, cuotas y pagos sin transformar texto en fechas o números. Power BI no forma parte de esta etapa.
