import { RouteOptionsPayload } from '@hapi/hapi';

const payloadOptions: RouteOptionsPayload = {
  maxBytes: 1024 * 1024 * 10,
  parse: true,
  allow: [
    'application/json',
    'multipart/form-data',
    'image/jpeg',
    'application/pdf',
    'application/x-www-form-urlencoded',
  ],
  multipart: {
    output: 'file',
  },
  output: 'file',
};

export { payloadOptions };
