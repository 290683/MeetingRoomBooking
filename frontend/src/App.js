import React, { useState, useEffect } from 'react';
import './App.css';
import RoomList from './components/RoomList';
import BookingForm from './components/BookingForm';
import BookingsList from './components/BookingsList';

function App() {
  // State management - think of these as variables that React watches
  const [rooms, setRooms] = useState([]);           // List of all rooms
  const [bookings, setBookings] = useState([]);     // Bookings for selected date
  const [selectedDate, setSelectedDate] = useState('2026-10-01'); // User-selected date
  const [error, setError] = useState('');           // Error messages to show user
  const [successMessage, setSuccessMessage] = useState(''); // Success messages

  const API_URL = 'http://localhost:8000/api';

  // Load rooms when component first appears
  useEffect(() => {
    fetchRooms();
  }, []);

  // Load bookings whenever the selected date changes
  useEffect(() => {
    fetchBookings(selectedDate);
  }, [selectedDate]);

  // Fetch all rooms from backend
  async function fetchRooms() {
    try {
      const response = await fetch(`${API_URL}/rooms`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to fetch rooms');
      setRooms(data.rooms);
      setError('');
    } catch (err) {
      const errMsg = 'Error loading rooms: ' + (err.message || 'Unknown error');
      setError(errMsg);
      window.scrollTo(0, 0);
    }
  }

  // Fetch bookings for a specific date from backend
  async function fetchBookings(date) {
    try {
      const response = await fetch(`${API_URL}/bookings/${date}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to fetch bookings');
      setBookings(data.bookings);
      setError('');
    } catch (err) {
      setError('Error loading bookings: ' + (err.message || 'Unknown error'));
    }
  }

  // Handle when user submits the booking form
  async function handleCreateBooking(bookingData) {
    try {
      // Send booking data to backend
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Backend returned an error - handle both string and object errors
        let errorMessage = 'Failed to create booking';
        if (typeof result.detail === 'string') {
          errorMessage = result.detail;
        } else if (Array.isArray(result.detail)) {
          errorMessage = result.detail.map(err => err.msg).join(', ');
        } else if (result.detail && typeof result.detail === 'object') {
          errorMessage = result.detail.msg || JSON.stringify(result.detail);
        }
        setError(errorMessage);
        window.scrollTo(0, 0);
        return;
      }

      // Success! Show message and refresh bookings
      setSuccessMessage('Booking created successfully!');
      setError('');
      fetchBookings(selectedDate);
      window.scrollTo(0, 0);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error creating booking: ' + err.message);
    }
  }

  // Handle when user confirms cancelling a booking
  async function handleCancelBooking(bookingId) {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to cancel booking';
        if (typeof result.detail === 'string') {
          errorMessage = result.detail;
        } else if (result.detail && typeof result.detail === 'object') {
          errorMessage = result.detail.msg || JSON.stringify(result.detail);
        }
        throw new Error(errorMessage);
      }

      setSuccessMessage('Booking cancelled successfully!');
      setError('');
      fetchBookings(selectedDate);
      window.scrollTo(0, 0);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errMsg = 'Error cancelling booking: ' + err.message;
      setError(errMsg);
      window.scrollTo(0, 0);
    }
  }

  return (
    <div className="app">
      <h1>Meeting Room Booking System</h1>

      {/* Show error messages in red */}
      {error && <div className="error-message">{error}</div>}

      {/* Show success messages in green */}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="main-container">
        {/* Left side: Room list and booking form */}
        <div className="left-section">
          <RoomList rooms={rooms} />
          <BookingForm rooms={rooms} selectedDate={selectedDate} onSubmit={handleCreateBooking} />
        </div>

        {/* Right side: Bookings for selected date */}
        <div className="right-section">
          <div className="date-selector">
            <div className="date-selector-header">
              <label htmlFor="date-input">Select Date: </label>
              <span className="current-date">(Today: 01-Oct-2026)</span>
            </div>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min="2026-10-01"
            />
            <p className="date-selector-tip">💡 Tip: Use the tabs below to check available dates and times before booking</p>
          </div>
          <BookingsList
            bookings={bookings}
            selectedDate={selectedDate}
            rooms={rooms}
            onCancelBooking={handleCancelBooking}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
