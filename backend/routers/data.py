from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db

router = APIRouter()


@router.get('/socios', response_model=list[schemas.Socio])
def socios(db: Session = Depends(get_db)):
    return db.scalars(select(models.Socio).order_by(models.Socio.id)).all()


@router.get('/categorias', response_model=list[schemas.Categoria])
def categorias(db: Session = Depends(get_db)):
    return db.scalars(select(models.Categoria).order_by(models.Categoria.id)).all()


@router.get('/profesores', response_model=list[schemas.Profesor])
def profesores(db: Session = Depends(get_db)):
    return db.scalars(select(models.Profesor).order_by(models.Profesor.id)).all()


@router.get('/actividades', response_model=list[schemas.Actividad])
def actividades(db: Session = Depends(get_db)):
    query = select(models.Actividad).options(joinedload(models.Actividad.profesor), joinedload(models.Actividad.categoria)).order_by(models.Actividad.id)
    return db.scalars(query).all()


@router.get('/inscripciones', response_model=list[schemas.Inscripcion])
def inscripciones(db: Session = Depends(get_db)):
    query = select(models.Inscripcion).options(joinedload(models.Inscripcion.socio), joinedload(models.Inscripcion.actividad)).order_by(models.Inscripcion.id)
    return db.scalars(query).all()


@router.get('/cuotas', response_model=list[schemas.Cuota])
def cuotas(db: Session = Depends(get_db)):
    query = select(models.Cuota).options(joinedload(models.Cuota.socio)).order_by(models.Cuota.periodo.desc(), models.Cuota.id)
    return db.scalars(query).all()


@router.get('/pagos', response_model=list[schemas.Pago])
def pagos(db: Session = Depends(get_db)):
    query = select(models.Pago).options(joinedload(models.Pago.cuota).joinedload(models.Cuota.socio)).order_by(models.Pago.fecha_pago.desc(), models.Pago.id)
    return db.scalars(query).all()
