import type socketio from 'socket.io';
import type express from 'express';
import type { Server } from 'https';

interface ServerIo {
  emit(event: string, data: undefined | null | number | string | { [key: string]: any }): void;
}

declare const io = () => ServerIo;

declare const startSocket = (STREAMING_PORT: string, SSL_KEY: Buffer, SSL_CERT: Buffer, SSL_CA: Buffer) => Server;

// ]]

export { io, startSocket };
