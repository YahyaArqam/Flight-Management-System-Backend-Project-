from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class SeatClassCreate(BaseModel):
    fare_type: str
    total_seats: int = Field(gt=0, description="Total seats must be greater than zero")
    overbook_buffer: int = Field(default=0, ge=0)

class FlightCreate(BaseModel):
    flight_number: str = Field(..., max_length=10)
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    departure_time: datetime
    arrival_time: datetime
    total_capacity: int = Field(gt=0)
    seat_classes: List[SeatClassCreate]

    @validator('arrival_time')
    def check_time(cls, v, values):
        if 'departure_time' in values and v <= values['departure_time']:
            raise ValueError('arrival_time must be after departure_time')
        return v
    
    @validator('seat_classes')
    def check_seat_sum(cls, v, values):
        if 'total_capacity' in values:
            total = sum([sc.total_seats for sc in v])
            if total != values['total_capacity']:
                raise ValueError(f"Seat classes total ({total}) must exactly match flight total_capacity ({values['total_capacity']})")
        return v

class FlightUpdate(BaseModel):
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    status: Optional[str] = None
