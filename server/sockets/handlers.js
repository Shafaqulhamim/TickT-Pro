export function setupSocketHandlers(io) {
  // Example: handle connection event
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Add your socket event handlers here
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}