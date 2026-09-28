import React from 'react';

function RoomList({ rooms }) {
  return (
    <div className="room-list-section">
      <h2>Available Rooms</h2>
      <div className="room-list">
        {rooms.length === 0 ? (
          <p>No rooms available</p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="room-card">
              <h3>{room.name}</h3>
              <p>
                <strong>Room ID:</strong> {room.id}
              </p>
              <p>
                <strong>Capacity:</strong> {room.capacity} people
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RoomList;
