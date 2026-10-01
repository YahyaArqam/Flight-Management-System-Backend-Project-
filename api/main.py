from fastapi import FastAPI
from database import supabase
from routers import admin, passenger

app = FastAPI(title="Flight Management System API")

app.include_router(admin.router)
app.include_router(passenger.router)

@app.get("/")
def read_root():
    return {"message": "Flight Management API is running"}

@app.get("/health/db")
def health_check():
    # Attempt a simple query to assert DB connection works
    try:
        response = supabase.table("flights").select("id").limit(1).execute()
        return {"status": "ok", "db_connection": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
