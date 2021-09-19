import { Request, ServerRoute, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { MsgResult } from '@sotaoi/omni/transactions';

const greetingRoute: (path: string) => ServerRoute = (path: string) => ({
  method: 'GET',
  path,
  handler: async (request: Request, handler: ResponseToolkit): Promise<ResponseObject> => {
    const result = new MsgResult<ResponseObject>(200, null, 'Greetings', 'Hello API Base', {
      path,
    }).output(handler);
    return result;
  },
});

export { greetingRoute };
