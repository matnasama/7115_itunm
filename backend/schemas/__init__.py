from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class Row(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Socio(Row):
    id: int
    nombre: str
    apellido: str
    dni: str
    fecha_nacimiento: date
    telefono: str | None
    activo: bool


class Categoria(Row):
    id: int
    nombre: str
    descripcion: str | None


class Profesor(Row):
    id: int
    nombre: str
    apellido: str
    telefono: str | None


class Actividad(Row):
    id: int
    nombre: str
    descripcion: str | None
    profesor_id: int
    categoria_id: int
    profesor: Profesor
    categoria: Categoria


class Inscripcion(Row):
    id: int
    socio_id: int
    actividad_id: int
    fecha_inscripcion: date
    activa: bool
    socio: Socio
    actividad: Actividad


class Cuota(Row):
    id: int
    socio_id: int
    periodo: date
    monto: Decimal
    estado: str
    socio: Socio


class Pago(Row):
    id: int
    cuota_id: int
    fecha_pago: date
    monto: Decimal
    medio_pago: str
    cuota: Cuota
