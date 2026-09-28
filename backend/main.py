from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json
import os
from pathlib import Path

app = FastAPI()

# Enable CORS so React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to JSON data files
DATA_DIR = Path(__file__).parent.parent / "data"
ROOMS_FILE = DATA_DIR / "rooms.json"
BOOKINGS_FILE = DATA_DIR / "bookings.json"


# Define the shape of data models - these tell FastAPI what data we expect
class Room(BaseModel):
    id: int
    name: str
    capacity: int


class BookingRequest(BaseModel):
    roomId: int
    employeeName: str
    date: str
    startTime: str
    endTime: str


class Booking(BookingRequest):
    id: str


# Helper functions to read and write JSON files
def read_rooms():
    """Read all rooms from rooms.json"""
    with open(ROOMS_FILE, 'r') as f:
        return json.load(f)


def read_bookings():
    """Read all bookings from bookings.json"""
    with open(BOOKINGS_FILE, 'r') as f:
        return json.load(f)


def write_bookings(bookings):
    """Write bookings back to bookings.json"""
    with open(BOOKINGS_FILE, 'w') as f:
        json.dump(bookings, f, indent=2)


def generate_booking_id():
    """Generate a new unique booking ID"""
    bookings = read_bookings()
    if not bookings:
        return "B001"
    # Get all IDs, extract numbers, find the max, add 1
    ids = [int(b['id'][1:]) for b in bookings]
    next_id = max(ids) + 1
    return f"B{next_id:03d}"


def time_string_to_minutes(time_str):
    """Convert '09:30' to minutes since midnight (570)"""
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes


def check_booking_conflict(room_id, date, start_time, end_time, exclude_booking_id=None):
    """
    Check if a new booking conflicts with existing bookings.

    Conflict rule: new_start < existing_end AND new_end > existing_start
    This means the time ranges overlap.

    Back-to-back bookings are allowed:
    - 9:00-10:00 and 10:00-11:00 do NOT conflict
    - 9:00-10:00 and 9:30-10:30 DO conflict
    """
    bookings = read_bookings()
    new_start = time_string_to_minutes(start_time)
    new_end = time_string_to_minutes(end_time)

    for booking in bookings:
        # Skip if this is the same booking (when editing)
        if exclude_booking_id and booking['id'] == exclude_booking_id:
            continue

        # Only check bookings for the same room and date
        if booking['roomId'] == room_id and booking['date'] == date:
            existing_start = time_string_to_minutes(booking['startTime'])
            existing_end = time_string_to_minutes(booking['endTime'])

            # Check conflict condition
            if new_start < existing_end and new_end > existing_start:
                return True, booking  # Conflict found

    return False, None  # No conflict


def check_room_capacity(room_id, date, start_time, end_time, room_capacity):
    """
    Check if adding a new booking would exceed room capacity.
    Count how many people are already booked in overlapping time slots.
    """
    bookings = read_bookings()
    new_start = time_string_to_minutes(start_time)
    new_end = time_string_to_minutes(end_time)

    # Count people already booked in overlapping times
    people_booked = 0
    for booking in bookings:
        if booking['roomId'] == room_id and booking['date'] == date:
            existing_start = time_string_to_minutes(booking['startTime'])
            existing_end = time_string_to_minutes(booking['endTime'])

            # Check if times overlap
            if new_start < existing_end and new_end > existing_start:
                people_booked += 1

    # Check if adding 1 more person would exceed capacity
    if people_booked + 1 > room_capacity:
        return False, people_booked  # Capacity exceeded

    return True, people_booked  # Capacity OK


# ENDPOINT 1: Get all rooms
@app.get("/api/rooms")
def get_rooms():
    """
    Return a list of all meeting rooms.
    This is called when the React app first loads to show available rooms.
    """
    rooms = read_rooms()
    return {"rooms": rooms}


# ENDPOINT 2: Get bookings for a specific date
@app.get("/api/bookings/{date}")
def get_bookings_by_date(date: str):
    """
    Return bookings for a specific date (format: YYYY-MM-DD).
    React calls this when user selects a date to see what's booked.
    """
    # Validate date format
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    bookings = read_bookings()
    # Filter bookings for the requested date
    date_bookings = [b for b in bookings if b['date'] == date]
    return {"bookings": date_bookings}


# ENDPOINT 3: Create a new booking
@app.post("/api/bookings")
def create_booking(booking_request: BookingRequest):
    """
    Create a new booking with validation:
    1. Employee name is required (not empty)
    2. End time must be later than start time
    3. Room capacity must be greater than zero
    4. No overlapping bookings for same room/date
    """
    # Validation 1: Check employee name is not empty
    if not booking_request.employeeName or not booking_request.employeeName.strip():
        raise HTTPException(status_code=400, detail="Employee name is required")

    # Validation 3: Check room exists and has valid capacity
    rooms = read_rooms()
    room = next((r for r in rooms if r['id'] == booking_request.roomId), None)
    if not room:
        raise HTTPException(status_code=400, detail="Room not found")
    if room['capacity'] <= 0:
        raise HTTPException(status_code=400, detail="Room capacity must be greater than zero")

    # Validation 2: End time must be later than start time
    start_minutes = time_string_to_minutes(booking_request.startTime)
    end_minutes = time_string_to_minutes(booking_request.endTime)
    if end_minutes <= start_minutes:
        raise HTTPException(status_code=400, detail="End time must be later than start time")

    # Business Rule: Check for booking conflicts
    has_conflict, conflicting_booking = check_booking_conflict(
        booking_request.roomId,
        booking_request.date,
        booking_request.startTime,
        booking_request.endTime
    )
    if has_conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Booking conflict! Room is already booked from {conflicting_booking['startTime']} to {conflicting_booking['endTime']}"
        )

    # Business Rule: Check room capacity
    capacity_ok, people_booked = check_room_capacity(
        booking_request.roomId,
        booking_request.date,
        booking_request.startTime,
        booking_request.endTime,
        room['capacity']
    )
    if not capacity_ok:
        raise HTTPException(
            status_code=409,
            detail=f"Room at capacity! {people_booked} people already booked at this time. Room capacity is {room['capacity']}"
        )

    # IF All validations passed - create the booking
    booking_id = generate_booking_id()
    new_booking = {
        "id": booking_id,
        "roomId": booking_request.roomId,
        "employeeName": booking_request.employeeName.strip(),
        "date": booking_request.date,
        "startTime": booking_request.startTime,
        "endTime": booking_request.endTime
    }

    bookings = read_bookings()
    bookings.append(new_booking)
    write_bookings(bookings)

    return {"message": "Booking created successfully", "booking": new_booking}


# ENDPOINT 4: Cancel a booking
@app.delete("/api/bookings/{booking_id}")
def cancel_booking(booking_id: str):
    """
    Delete a booking by ID.
    React calls this when user confirms they want to cancel.
    """
    bookings = read_bookings()
    booking_to_cancel = next((b for b in bookings if b['id'] == booking_id), None)

    if not booking_to_cancel:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Remove the booking
    bookings = [b for b in bookings if b['id'] != booking_id]
    write_bookings(bookings)

    return {"message": f"Booking {booking_id} cancelled successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
