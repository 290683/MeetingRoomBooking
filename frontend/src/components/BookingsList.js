import React, { useState } from 'react';

function BookingsList({ bookings, selectedDate, rooms, onCancelBooking }) {
  // Track which room tab is selected
  const [selectedRoomId, setSelectedRoomId] = useState(rooms.length > 0 ? rooms[0].id : 1);
  // Helper function to convert 24-hour to 12-hour AM/PM format
  function formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Helper function to get room name from room ID
  function getRoomName(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : `Room ${roomId}`;
  }

  // When user clicks cancel button, ask for confirmation before deleting
  function handleCancelClick(bookingId, employeeName) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel the booking for ${employeeName}?`
    );
    if (confirmed) {
      onCancelBooking(bookingId);
    }
  }

  // Filter bookings for the selected room
  const roomBookings = bookings.filter((booking) => booking.roomId === selectedRoomId);

  return (
    <div className="bookings-list-section">
      <h2>Bookings for {selectedDate}</h2>

      {/* Room Tabs */}
      <div className="room-tabs">
        {rooms.map((room) => (
          <button
            key={room.id}
            className={`tab ${selectedRoomId === room.id ? 'active' : ''}`}
            onClick={() => setSelectedRoomId(room.id)}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Bookings for selected room */}
      <div className="bookings-list">
        {roomBookings.length === 0 ? (
          <p className="no-bookings">No bookings for {getRoomName(selectedRoomId)} on this date</p>
        ) : (
          roomBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-info">
                <h3>{getRoomName(booking.roomId)}</h3>
                <p>
                  <strong>Booking ID:</strong> {booking.id}
                </p>
                <p>
                  <strong>Employee:</strong> {booking.employeeName}
                </p>
                <p>
                  <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </p>
              </div>
              <button
                className="btn-cancel"
                onClick={() => handleCancelClick(booking.id, booking.employeeName)}
              >
                Cancel Booking
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BookingsList;
