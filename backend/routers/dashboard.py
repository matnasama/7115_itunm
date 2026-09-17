from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import Actividad, Cuota, Inscripcion, Pago, Profesor, Socio

router = APIRouter(prefix='/dashboard')


@router.get('/resumen')
def resumen(db: Session = Depends(get_db)):
    hoy = date.today()
    inicio = hoy.replace(day=1)
    return {
        'socios_activos': db.scalar(select(func.count()).select_from(Socio).where(Socio.activo.is_(True))),
        'actividades': db.scalar(select(func.count()).select_from(Actividad)),
        'profesores': db.scalar(select(func.count()).select_from(Profesor)),
        'inscripciones_activas': db.scalar(select(func.count()).select_from(Inscripcion).where(Inscripcion.activa.is_(True))),
        'cuotas_pendientes': db.scalar(select(func.count()).select_from(Cuota).where(Cuota.estado == 'pendiente')),
        'recaudacion_total': db.scalar(select(func.coalesce(func.sum(Pago.monto), 0))),
        'recaudacion_mes_actual': db.scalar(select(func.coalesce(func.sum(Pago.monto), 0)).where(Pago.fecha_pago >= inicio, Pago.fecha_pago <= hoy)),
    }


@router.get('/socios-por-actividad')
def socios_por_actividad(db: Session = Depends(get_db)):
    rows = db.execute(select(Actividad.nombre, func.count(Inscripcion.id)).outerjoin(Inscripcion, (Inscripcion.actividad_id == Actividad.id) & Inscripcion.activa.is_(True)).group_by(Actividad.id).order_by(Actividad.id)).all()
    return [{'actividad': nombre, 'socios': cantidad} for nombre, cantidad in rows]


@router.get('/inscripciones-por-mes')
def inscripciones_por_mes(db: Session = Depends(get_db)):
    mes = func.date_trunc('month', Inscripcion.fecha_inscripcion)
    rows = db.execute(select(mes, func.count(Inscripcion.id)).group_by(mes).order_by(mes)).all()
    return [{'mes': fecha.strftime('%Y-%m'), 'inscripciones': cantidad} for fecha, cantidad in rows]


@router.get('/recaudacion-mensual')
def recaudacion_mensual(db: Session = Depends(get_db)):
    mes = func.date_trunc('month', Pago.fecha_pago)
    rows = db.execute(select(mes, func.sum(Pago.monto)).group_by(mes).order_by(mes)).all()
    return [{'mes': fecha.strftime('%Y-%m'), 'recaudacion': float(monto)} for fecha, monto in rows]


@router.get('/estado-cuotas')
def estado_cuotas(db: Session = Depends(get_db)):
    rows = db.execute(select(Cuota.estado, func.count(Cuota.id)).group_by(Cuota.estado)).all()
    return [{'estado': estado, 'cantidad': cantidad} for estado, cantidad in rows]


@router.get('/medios-pago')
def medios_pago(db: Session = Depends(get_db)):
    rows = db.execute(select(Pago.medio_pago, func.count(Pago.id)).group_by(Pago.medio_pago)).all()
    return [{'medio_pago': medio, 'cantidad': cantidad} for medio, cantidad in rows]
