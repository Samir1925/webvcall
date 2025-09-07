const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// Serve frontend (optional)
app.use(express.static('../frontend'));

io.on('connection', socket => {
  console.log('User connected: ' + socket.id);

  socket.on('join-room', roomID => {
    socket.join(roomID);
    socket.to(roomID).emit('user-connected', socket.id);

    socket.on('offer', payload => {
      io.to(payload.target).emit('offer', { sdp: payload.sdp, caller: socket.id });
    });

    socket.on('answer', payload => {
      io.to(payload.target).emit('answer', { sdp: payload.sdp, responder: socket.id });
    });

    socket.on('ice-candidate', payload => {
      io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: socket.id });
    });

    socket.on('disconnect', () => {
      socket.to(roomID).emit('user-disconnected', socket.id);
    });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
