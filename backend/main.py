from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, data

app = FastAPI(title='Club Moreno ITUNM')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'], allow_methods=['GET'], allow_headers=['*'])
app.include_router(data.router)
app.include_router(dashboard.router)


@app.get('/health')
def health():
    return {'status': 'ok'}
