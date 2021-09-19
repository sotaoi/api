const https = require('https');
const http = require('http');

const runServer = async (options, app, nextModule, callNextModule, init, CLOSE_TIMEOUT = 5000) => {
  let isTransitioning = false;
  let closeServerTimeout = null;
  let rejectServerTimeout = null;
  let serverListener = null;
  let serverInit = null;

  const isSecure = options.key && options.ca && options.cert;
  const binary = isSecure ? https : http;
  const sockets = [];

  typeof init !== 'function' && console.warn('Init argument is not a function');
  typeof init === 'function' && init();

  serverInit = binary.createServer(options, app);

  const reset = () => {
    serverListener = null;
    serverInit = null;
    sockets.map((socket) => {
      try {
        !socket.destroyed && socket.destroy();
      } catch (err) {
        console.warn(err);
      }
    });
    while (sockets.length) {
      sockets.pop();
    }
  };

  return {
    app,
    serverInit,
    handler: () => {
      return serverListener;
    },
    close: () => {
      return new Promise((resolve, reject) => {
        if (isTransitioning || !serverListener) {
          return;
        }
        clearTimeout(closeServerTimeout);
        clearTimeout(rejectServerTimeout);
        rejectServerTimeout = setTimeout(() => {
          reset();
          reject(new Error('Failed to close server'));
        }, CLOSE_TIMEOUT + 5000);
        isTransitioning = true;
        closeServerTimeout = setTimeout(() => {
          sockets.map((socket) => {
            if (!socket.destroyed) {
              socket.destroy();
            }
          });
          while (sockets.length) {
            sockets.pop();
          }
        }, CLOSE_TIMEOUT);
        serverListener.close(() => {
          clearTimeout(closeServerTimeout);
          for (const key of Object.keys(require.cache)) {
            delete require.cache[key];
          }
          reset();
          isTransitioning = true;
          resolve();
        });
      });
    },
    reload: () => {
      return new Promise((resolve, reject) => {
        if (isTransitioning || !serverListener) {
          return;
        }
        clearTimeout(closeServerTimeout);
        clearTimeout(rejectServerTimeout);
        rejectServerTimeout = setTimeout(() => {
          reject(new Error('Failed to close server'));
        }, CLOSE_TIMEOUT + 5000);
        isTransitioning = true;
        closeServerTimeout = setTimeout(() => {
          sockets.map((socket) => {
            if (!socket.destroyed) {
              socket.destroy();
            }
          });
          while (sockets.length) {
            sockets.pop();
          }
        }, CLOSE_TIMEOUT);
        serverListener.close(async () => {
          clearTimeout(closeServerTimeout);
          for (const key of Object.keys(require.cache)) {
            delete require.cache[key];
          }
          reset();
          isTransitioning = true;
          await callNextModule(require(nextModule));
          resolve();
        });
      });
    },
    start: (port) => {
      serverListener = serverInit.listen(port);
      serverListener.on('connection', (socket) => {
        socket.on('close', () => {
          sockets.splice(sockets.indexOf(socket), 1);
        });
        sockets.push(socket);
      });
    },
  };
};

module.exports = { runServer };
