from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Socio(Base):
    __tablename__ = 'socios'
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))
    apellido: Mapped[str] = mapped_column(String(80))
    dni: Mapped[str] = mapped_column(String(20), unique=True)
    fecha_nacimiento: Mapped[date] = mapped_column(Date)
    telefono: Mapped[str | None] = mapped_column(String(30))
    activo: Mapped[bool] = mapped_column(Boolean)


class Categoria(Base):
    __tablename__ = 'categorias'
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text)


class Profesor(Base):
    __tablename__ = 'profesores'
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))
    apellido: Mapped[str] = mapped_column(String(80))
    telefono: Mapped[str | None] = mapped_column(String(30))


class Actividad(Base):
    __tablename__ = 'actividades'
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text)
    profesor_id: Mapped[int] = mapped_column(ForeignKey('profesores.id'))
    categoria_id: Mapped[int] = mapped_column(ForeignKey('categorias.id'))
    profesor: Mapped[Profesor] = relationship()
    categoria: Mapped[Categoria] = relationship()


class Inscripcion(Base):
    __tablename__ = 'inscripciones'
    __table_args__ = (UniqueConstraint('socio_id', 'actividad_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    socio_id: Mapped[int] = mapped_column(ForeignKey('socios.id'))
    actividad_id: Mapped[int] = mapped_column(ForeignKey('actividades.id'))
    fecha_inscripcion: Mapped[date] = mapped_column(Date)
    activa: Mapped[bool] = mapped_column(Boolean)
    socio: Mapped[Socio] = relationship()
    actividad: Mapped[Actividad] = relationship()


class Cuota(Base):
    __tablename__ = 'cuotas'
    __table_args__ = (UniqueConstraint('socio_id', 'periodo'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    socio_id: Mapped[int] = mapped_column(ForeignKey('socios.id'))
    periodo: Mapped[date] = mapped_column(Date)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    estado: Mapped[str] = mapped_column(String(10))
    socio: Mapped[Socio] = relationship()


class Pago(Base):
    __tablename__ = 'pagos'
    id: Mapped[int] = mapped_column(primary_key=True)
    cuota_id: Mapped[int] = mapped_column(ForeignKey('cuotas.id'))
    fecha_pago: Mapped[date] = mapped_column(Date)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    medio_pago: Mapped[str] = mapped_column(String(20))
    cuota: Mapped[Cuota] = relationship()


class Gasto(Base):
    __tablename__ = 'gastos'
    __table_args__ = (UniqueConstraint('concepto', 'fecha_pago'), CheckConstraint('monto > 0'))
    id: Mapped[int] = mapped_column(primary_key=True)
    concepto: Mapped[str] = mapped_column(String(100))
    categoria: Mapped[str] = mapped_column(String(40))
    fecha_pago: Mapped[date] = mapped_column(Date)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2))
