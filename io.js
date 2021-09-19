const socketio = require('socket.io');
const express = require('express');
const https = require('https');

let _io = null;

const io = () => {
  return _io;
};

const startSocket = (STREAMING_PORT, SSL_KEY, SSL_CERT, SSL_CA) => {
  const expressApp = express();
  const httpsServer = https.createServer(
    {
      key: SSL_KEY,
      cert: SSL_CERT,
      ca: SSL_CA,
      rejectUnauthorized: false,
    },
    expressApp,
  );
  _io = socketio(httpsServer);
  _io.on('connection', (socket) => {
    false && console.debug('Acknowledging socket: ', socket);
    io().emit('socket:greetings', 'Hello, client!');
  });

  return httpsServer.listen(STREAMING_PORT, () => {
    console.info(`Streaming server listening on *:${STREAMING_PORT} (socket.io)`);
  });
};

// ]]

module.exports = { io, startSocket };
