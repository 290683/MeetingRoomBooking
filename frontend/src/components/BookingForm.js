import React, { useState, useEffect } from 'react';

function BookingForm({ rooms, selectedDate, onSubmit }) {
  // Form state - tracks what user types into each field
  const [formData, setFormData] = useState({
    roomId: 1,
    employeeName: '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '10:00'
  });

  const [formError, setFormError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  // Update roomId when rooms load
  useEffect(() => {
    if (rooms.length > 0 && formData.roomId === 1) {
      setFormData((prev) => ({
        ...prev,
        roomId: rooms[0].id
      }));
    }
  }, [rooms]);

  // When user types in an input field, update the corresponding state
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setFormError(''); // Clear error when user starts typing
  }

  // When user clicks "Book Room" button
  function handleSubmit(e) {
    e.preventDefault(); // Prevent page reload

    // Frontend validation - check required fields before sending to backend
    if (!formData.employeeName.trim()) {
      setFormError('Employee name is required');
      return;
    }

    // Validate name - letters, spaces, hyphens, apostrophes (but not starting with hyphen or apostrophe)
    const nameRegex = /^[a-zA-Z][a-zA-Z\s\-']*$/;
    if (!nameRegex.test(formData.employeeName)) {
      setFormError('Employee name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }

    // Prepare data to send to backend
    const bookingData = {
      roomId: parseInt(formData.roomId),
      employeeName: formData.employeeName,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime
    };

    // Show confirmation instead of submitting directly
    setPendingBooking(bookingData);
    setShowConfirmation(true);
  }

  // Helper to format time
  function formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Helper to get room name
  function getRoomName(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : `Room ${roomId}`;
  }

  // Handle confirm booking
  function handleConfirm() {
    setShowConfirmation(false);
    onSubmit(pendingBooking);

    // Clear form for next booking
    setFormData({
      roomId: rooms.length > 0 ? rooms[0].id : 1,
      employeeName: '',
      date: selectedDate,
      startTime: '09:00',
      endTime: '10:00'
    });
    setFormError('');
  }

  // Handle cancel confirmation
  function handleCancelConfirmation() {
    setShowConfirmation(false);
    setPendingBooking(null);
  }

  return (
    <div className="booking-form-section">
      <h2>Create New Booking</h2>
      <form onSubmit={handleSubmit}>
        {/* Room selector */}
        <div className="form-group">
          <label htmlFor="roomId">Select Room:</label>
          <select
            id="roomId"
            name="roomId"
            value={formData.roomId}
            onChange={handleInputChange}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} (Capacity: {room.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Employee name input */}
        <div className="form-group">
          <label htmlFor="employeeName">Employee Name:</label>
          <input
            id="employeeName"
            type="text"
            name="employeeName"
            value={formData.employeeName}
            onChange={handleInputChange}
            placeholder="Enter your name"
          />
        </div>

        {/* Booking date input */}
        <div className="form-group">
          <label htmlFor="date">Booking Date:</label>
          <input
            id="date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min="2026-10-01"
          />
        </div>

        {/* Start time input */}
        <div className="form-group">
          <label htmlFor="startTime">Start Time:</label>
          <input
            id="startTime"
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
          />
        </div>

        {/* End time input */}
        <div className="form-group">
          <label htmlFor="endTime">End Time:</label>
          <input
            id="endTime"
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
          />
        </div>

        {/* Show form validation errors */}
        {formError && <div className="form-error">{formError}</div>}

        {/* Submit button */}
        <button type="submit" className="btn-submit">
          Book Room
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && pendingBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Your Booking</h2>
            <div className="confirmation-details">
              <p><strong>Room:</strong> {getRoomName(pendingBooking.roomId)}</p>
              <p><strong>Employee:</strong> {pendingBooking.employeeName}</p>
              <p><strong>Date:</strong> {pendingBooking.date}</p>
              <p><strong>Time:</strong> {formatTime(pendingBooking.startTime)} - {formatTime(pendingBooking.endTime)}</p>
            </div>
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={handleConfirm}>
                Confirm Booking
              </button>
              <button className="btn-cancel-modal" onClick={handleCancelConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingForm;
