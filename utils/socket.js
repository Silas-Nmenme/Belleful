// Socket emit helpers
const getIo = (req) => req.app.get('io');

const emitOrderUpdate = (req, orderId, status, userId) => {
  const io = getIo(req);
  io.to(`user_${userId}`).emit('order-update', { orderId, status });
  io.to('admin').emit('admin-order-update', { orderId, status });
};

const emitNewOrder = (req, order) => {
  const io = getIo(req);
  io.to('admin').emit('new-order', order);
};

module.exports = { emitOrderUpdate, emitNewOrder };

