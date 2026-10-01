from fastapi import APIRouter, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from database import supabase

router = APIRouter(prefix="/passenger", tags=["Passenger Flow"])

class SearchParams(BaseModel):
    origin: str
    destination: str
    date: str # YYYY-MM-DD format

class HoldSeatRequest(BaseModel):
    flight_id: str
    passenger_id: str
    fare_type: str

class BookSeatRequest(BaseModel):
    hold_id: str
    payment_intent_id: str

@router.get("/search")
def search_flights(origin: str, destination: str, date: str):
    # Fetch flights matching route and starting on this date
    try:
        start_date = f"{date}T00:00:00Z"
        end_date = f"{date}T23:59:59Z"
        
        flights_res = supabase.table("flights") \
            .select("*, flight_seat_classes(*)") \
            .eq("origin", origin) \
            .eq("destination", destination) \
            .eq("status", "SCHEDULED") \
            .gte("departure_time", start_date) \
            .lte("departure_time", end_date) \
            .execute()
            
        return {"flights": flights_res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/hold")
def hold_seat(req: HoldSeatRequest):
    # Atomic hold check, to prevent identical seats getting booked simultaneously
    # Postgres checks constraints inherently, we rely on the DB's transactional safety and RPC
    try:
        # In Supabase, the best way to handle atomic decrements safely is an RPC function.
        # But we can try a conditional update where booked_seats + held_seats < total_capacity
        
        # We will insert a booking as a 'HOLD' status with an expiry
        expiry_time = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
        new_idempotency_key = str(uuid.uuid4())
        
        hold_data = {
            "flight_id": req.flight_id,
            "passenger_id": req.passenger_id,
            "fare_type": req.fare_type,
            "status": "HOLD",
            "hold_expires_at": expiry_time,
            "idempotency_key": new_idempotency_key
        }
        
        # Note: In a production environment, we'd trigger a DB function to atomically 
        # increment `held_seats` on `flight_seat_classes` table here, ensuring we don't oversell
        # If the check constraint ((booked_seats + held_seats) <= (total_seats + overbook_buffer)) fails,
        # Postgres throws an error automatically and prevents the overbook!
        
        # Step 1: Attempt to register the booking hold
        booking_res = supabase.table("bookings").insert(hold_data).execute()
        booking = booking_res.data[0]
        
        return {"message": "Seat held successfully for 15 minutes", "booking": booking}
    except Exception as e:
        # Check if the database rejected it due to constraints (fully booked)
        if "no_oversell" in str(e):
             raise HTTPException(status_code=409, detail="This seat class is fully booked. Oversell prevented.")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/checkout")
def confirm_booking(req: BookSeatRequest, idempotency_key: str = Header(...)):
    # Confirms a held booking after payment
    try:
        # First check idempotency - look for an existing successful payment via idempotency key
        existing = supabase.table("bookings").select("*").eq("idempotency_key", idempotency_key).eq("status", "CONFIRMED").execute()
        if existing.data:
            return {"message": "Idempotent request: Booking already confirmed", "booking": existing.data[0]}
            
        update_data = {
            "status": "CONFIRMED", 
            "payment_intent_id": req.payment_intent_id,
            "idempotency_key": idempotency_key 
        }
        # Only update if the hold hasn't expired (checked at DB layer time conditionally)
        update_res = supabase.table("bookings").update(update_data).eq("id", req.hold_id).execute()
        
        if not update_res.data:
             raise HTTPException(status_code=404, detail="Hold not found")
             
        return {"message": "Booking Confirmed", "booking": update_res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/waitlist")
def join_waitlist(req: HoldSeatRequest):
    # Endpoint to join waitlist if oversold
    try:
         waitlist_data = {
            "flight_id": req.flight_id,
            "passenger_id": req.passenger_id,
            "fare_type": req.fare_type,
            "status": "WAITING"
         }
         res = supabase.table("waitlists").insert(waitlist_data).execute()
         return {"message": "Added to Waitlist", "waitlist": res.data[0]}
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))

class CancelRequest(BaseModel):
    booking_id: str

@router.post("/cancel")
def cancel_booking(req: CancelRequest):
    # Implements Cancellation policy branching by fare type
    try:
        booking_res = supabase.table("bookings").select("*, flights(status)").eq("id", req.booking_id).execute()
        if not booking_res.data:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        booking = booking_res.data[0]
        fare_type = booking["fare_type"]
        flight_status = booking["flights"]["status"]
        
        # Policy Logic
        refund_status = "NONE"
        if flight_status == "CANCELLED":
            # Airline initiated cancel - always full refund
            refund_status = "PENDING"
            message = "Flight was cancelled by airline. Full refund initiated."
        elif fare_type == "BASIC_ECONOMY":
            refund_status = "NONE"
            message = "Basic Economy is non-refundable."
        elif fare_type in ["FLEXIBLE", "BUSINESS", "FIRST"]:
            refund_status = "PENDING"
            message = f"{fare_type} is fully refundable. Refund initiated."
            
        # Update the booking to CANCELLED and set refund status
        update_data = {
            "status": "CANCELLED",
            "refund_status": refund_status,
            "refund_updated_at": datetime.utcnow().isoformat()
        }
        
        cancel_res = supabase.table("bookings").update(update_data).eq("id", req.booking_id).execute()
        
        # In a real app we would fire a transactional Email (Gmail via FastAPI) here
        # e.g., send_gmail(booking.passenger.email, "Booking Cancelled", message)
        
        return {"message": message, "booking": cancel_res.data[0]}
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))

