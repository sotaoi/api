import type { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import type { BaseInput, FormValidations } from '@sotaoi/omni/input/base-input';
import type { InputValidator } from '@sotaoi/omni/contracts/input-validator';
import type { Logger } from '@sotaoi/api/contracts/logger';
import type { Helper as HelperType } from '@sotaoi/api/helper';
import type { StoreHandler } from '@sotaoi/api/commands/store-handler';
import type { UpdateHandler } from '@sotaoi/api/commands/update-handler';
import type { RemoveHandler } from '@sotaoi/api/commands/remove-handler';
import type { AuthHandler } from '@sotaoi/api/commands/auth-handler';
import type { TaskHandler } from '@sotaoi/api/commands/task-handler';
import type { FlistQuery, PlistQuery, SlistQuery, QueryResult } from '@sotaoi/omni/transactions';
import type { StoreCommand, UpdateCommand, AuthCommand, TaskCommand, RemoveCommand } from '@sotaoi/api/commands';
import type { CommandResult, AuthResult, TaskResult } from '@sotaoi/omni/transactions';

import { Output as OmniOutput } from '@sotaoi/omni/output';

class Output extends OmniOutput {
  protected static registeredInputs: typeof BaseInput[] = [];

  public static registerInput(input: any): void {
    this.registeredInputs.push(input);
  }

  public static deserializePayload(fieldPayload: any): null | BaseInput<any, any> {
    if (typeof fieldPayload === 'undefined') {
      throw new Error('[ParseCommand]: field is missing in init, although it is found in validations');
    }

    if (fieldPayload === '' || fieldPayload === null) {
      return null;
    }

    const payloadJson: { [key: string]: any } =
      typeof fieldPayload === 'string'
        ? JSON.parse(fieldPayload)
        : typeof fieldPayload === 'object'
        ? fieldPayload
        : {};
    for (const registeredInput of this.registeredInputs) {
      const instance: BaseInput<any, any> = new (registeredInput as any)(null);
      if (instance.deserializeCondition(fieldPayload, payloadJson)) {
        return instance.deserialize(fieldPayload);
      }
    }

    throw new Error('unknown field payload type');
  }

  public static parseApiPayload(
    payload: { [key: string]: any },
    form: FormValidations,
    tlPrefix: string,
    isUpdateCommand: boolean,
  ): { [key: string]: any } {
    const { Helper } = require('@sotaoi/api/helper');
    const _ = require('lodash');

    isUpdateCommand = isUpdateCommand && this.ALLOW_SKIP_UNCHANGED;

    return (Helper as typeof HelperType).iterate(Helper.clone(form), tlPrefix, (item, prefix, transformer, prop) => {
      const key = prefix ? `${prefix}.${prop}` : prop;
      let nextKey = '';

      if (!(item instanceof Array)) {
        const collectionPayload = _.get(payload, key);
        const collectionValidations = item.fields;
        let newItem: { [key: string]: any } = {};
        switch (true) {
          case typeof collectionPayload === 'undefined' && isUpdateCommand:
            return {
              type: 'undefined',
              payload: null,
            };
          // multi collection
          case collectionPayload instanceof Array:
            newItem = {
              type: 'collection',
              min: item.min,
              max: item.max,
              fields: [],
            };
            Object.keys(collectionPayload).map((index) => {
              nextKey = `${key}.${index.toString()}`;
              newItem.fields.push(this.parseApiPayload(payload, collectionValidations, nextKey, isUpdateCommand));
            });
            return newItem;
          // single collection
          case typeof collectionPayload === 'object':
            nextKey = `${key}`;
            newItem = {
              type: 'singleCollection',
              fields: this.parseApiPayload(payload, collectionValidations, nextKey, isUpdateCommand),
            };
            return newItem;
          default:
            throw new Error('something went wrong parsing the api payload');
        }
      }

      if (isUpdateCommand && typeof _.get(payload, key) === 'undefined') {
        return {
          type: 'undefined',
          payload: null,
        };
      }
      const deserializedPayload = this.deserializePayload(_.get(payload, key));

      return {
        type: 'field',
        payload: deserializedPayload,
      };
    });
  }

  public static async runCommand(
    type: 'store' | 'update' | 'remove' | 'auth' | 'task',
    request: Request,
    handler: ResponseToolkit,
    logger: () => Logger,
  ): Promise<ResponseObject> {
    const { Artifacts } = require('@sotaoi/omni/artifacts');
    const { CommandResult } = require('@sotaoi/omni/transactions');
    const { StoreCommand, UpdateCommand, AuthCommand, TaskCommand, RemoveCommand } = require('@sotaoi/api/commands');
    const { AuthHandler } = require('@sotaoi/api/commands/auth-handler');
    const _ = require('lodash');
    const { ErrorCode } = require('@sotaoi/omni/errors');
    const { app } = require('@sotaoi/api/app-kernel');
    const { Helper } = require('@sotaoi/api/helper');
    const { Store } = require('@sotaoi/api/store');

    if (!(request.payload instanceof Object)) {
      throw new Error('something went wrong');
    }
    let payload: { [key: string]: any };
    const {
      accessToken,
      artifacts,
      role,
      repository,
      uuid = null,
      strategy = null,
      task = null,
      ...formData
    } = request.payload as {
      [key: string]: any;
    };

    const [authRecord] = await AuthHandler.translateAccessToken(handler, accessToken);

    let storeCommand: StoreCommand;
    let storeHandler: StoreHandler;
    let updateCommand: UpdateCommand;
    let updateHandler: UpdateHandler;
    let removeCommand: RemoveCommand;
    let removeHandler: RemoveHandler;
    let authCommand: AuthCommand;
    let authHandler: AuthHandler;
    let taskCommand: TaskCommand;
    let taskHandler: TaskHandler;
    let output: null | ((payload: { [key: string]: any }) => Promise<CommandResult | AuthResult | TaskResult>) = null;
    let removeOutput: null | (() => Promise<CommandResult>) = null;
    let formId: null | string = null;
    switch (true) {
      case type === 'store':
        storeHandler = Store.getStoreHandler(repository, handler);
        formId = await storeHandler.getFormId();
        output = async (payload: { [key: string]: any }): Promise<CommandResult> => {
          storeCommand = new StoreCommand(authRecord, new Artifacts(artifacts), role, repository, payload);
          return this.parseCommand(await storeHandler.__handle__(storeCommand));
        };
        break;
      case type === 'update':
        if (!uuid) {
          throw new Error('something went wrong - update command has no uuid');
        }
        updateHandler = Store.getUpdateHandler(repository, handler);
        formId = await updateHandler.getFormId();
        output = async (payload: { [key: string]: any }): Promise<CommandResult> => {
          updateCommand = new UpdateCommand(authRecord, new Artifacts(artifacts), role, repository, uuid, payload);
          return this.parseCommand(await updateHandler.__handle__(updateCommand));
        };
        break;
      case type === 'remove':
        if (!uuid) {
          throw new Error('something went wrong - remove command has no uuid');
        }
        removeHandler = Store.getRemoveHandler(repository, handler);
        removeOutput = async (): Promise<CommandResult> => {
          removeCommand = new RemoveCommand(authRecord, new Artifacts(artifacts), role, repository, uuid);
          return this.parseCommand(await removeHandler.__handle__(removeCommand));
        };
        break;
      case type === 'auth':
        authHandler = Store.getAuthHandler(repository, handler);
        formId = await authHandler.getFormId();
        output = async (payload: { [key: string]: any }): Promise<AuthResult> => {
          authCommand = new AuthCommand(new Artifacts(artifacts), repository, payload, strategy);
          return this.parseAuth(await authHandler.__handle__(authCommand));
        };
        break;
      case type === 'task':
        taskHandler = Store.getTaskHandler(repository, task, handler);
        formId = await taskHandler.getFormId();
        output = async (payload: { [key: string]: any }): Promise<TaskResult> => {
          taskCommand = new TaskCommand(authRecord, new Artifacts(artifacts), role, repository, task, payload);
          return this.parseTask(await taskHandler.__handle__(taskCommand));
        };
        break;
      default:
        throw new Error('failed to run command');
    }

    if (type === 'remove') {
      if (!removeOutput) {
        throw new Error('remove output is not initialized');
      }
      const result = await removeOutput();
      return handler.response(result).code(result.getCode());
    }

    if (!formId) {
      throw new Error('form id is missing');
    }
    if (typeof output === 'undefined') {
      throw new Error('output is not initialized');
    }

    const form = await Store.getForm(repository, formId);
    payload = this.parseApiPayload(
      (Helper as typeof HelperType).unflatten(formData).data,
      form,
      '',
      type === 'update' && this.ALLOW_SKIP_UNCHANGED,
    );

    const inputValidator: InputValidator = app()
      .get('app.system.inputValidator')
      .getFormValidation((key: string) => {
        return _.get(payload, key)?.payload || null;
      });
    await inputValidator.validatePayload(payload, form, '', type === 'update');

    const validationResult = inputValidator.getResult();
    if (!validationResult.valid) {
      const code = 422;
      const commandResult = new CommandResult(
        code,
        ErrorCode.APP_GENERIC_ERROR,
        validationResult.title,
        validationResult.message,
        null,
        validationResult.validations,
        {},
      );
      return handler.response(commandResult).code(code);
    }

    const cleanupUndefined: (() => void)[] = [];
    (Helper as typeof HelperType).iterate(payload, '', (item, prefix, transformer, prop) => {
      let newItem: any;
      switch (true) {
        case item.type === 'collection':
          newItem = [];
          item.fields.map((field: any) => newItem.push(transformer(field, prefix, transformer, prop)));
          return newItem;
        case item.type === 'singleCollection':
          return transformer(item.fields, prefix, transformer, prop);
        case item.type === 'field':
          return item.payload;
        case type === 'update' && item.type === 'undefined':
          cleanupUndefined.push(() => _.unset(payload, prefix && prop ? `${prefix}.${prop}` : prefix || prop));
          return;
        default:
          return Helper.iterate(item, prefix && prop ? `${prefix}.${prop}` : prefix || prop, transformer);
      }
    });
    cleanupUndefined.map((fn) => fn());

    if (!output) {
      throw new Error('output is not initialized');
    }
    const result = await output(payload);
    return handler.response(result).code(result.getCode());
  }

  public static async runQuery(
    request: Request,
    handler: ResponseToolkit,
    logger: () => Logger,
  ): Promise<ResponseObject> {
    const {
      FlistQuery,
      PlistQuery,
      SlistQuery,
      FlistFilters,
      PlistFilters,
      SlistFilters,
    } = require('@sotaoi/omni/transactions');
    const { AuthHandler } = require('@sotaoi/api/commands/auth-handler');
    const { Store } = require('@sotaoi/api/store');

    let flistQuery: FlistQuery;
    let plistQuery: PlistQuery;
    let slistQuery: SlistQuery;
    let output: QueryResult;
    const query = request.payload as { [key: string]: any };
    query.filters = query.filters ? JSON.parse(query.filters) : null;
    const queryHandler = Store.getQueryHandler(query.repository, query.list, handler);
    const [authRecord] = await AuthHandler.translateAccessToken(handler, query.accessToken);
    switch (true) {
      case query.type === 'flist':
        flistQuery = new FlistQuery(
          authRecord,
          query.artifacts,
          query.role,
          query.repository,
          query.list,
          query.filters ? new FlistFilters(query.filters.where, query.filters.limit) : null,
          query.variant,
        );

        output = await queryHandler.__handle__(flistQuery);
        break;
      case query.type === 'plist':
        plistQuery = new PlistQuery(
          authRecord,
          query.artifacts,
          query.role,
          query.repository,
          query.list,
          query.filters ? new PlistFilters(query.filters.where, query.filters.page, query.filters.perPage) : null,
          query.variant,
        );
        output = await queryHandler.__handle__(plistQuery);
        break;
      case query.type === 'slist':
        slistQuery = new SlistQuery(
          authRecord,
          query.artifacts,
          query.role,
          query.repository,
          query.list,
          query.filters ? new SlistFilters(query.filters.where, query.filters.batchSize) : null,
          query.variant,
        );
        output = await queryHandler.__handle__(slistQuery);
        break;
      default:
        throw new Error('failed to run query - unknown list type');
    }
    return handler.response(output).code(output.getCode());
  }

  public static async runRetrieve(
    request: Request,
    handler: ResponseToolkit,
    logger: () => Logger,
  ): Promise<ResponseObject> {
    const { Retrieve } = require('@sotaoi/omni/transactions');
    const { AuthHandler } = require('@sotaoi/api/commands/auth-handler');
    const { Store } = require('@sotaoi/api/store');

    const payload = request.payload as { [key: string]: any };
    const [authRecord] = await AuthHandler.translateAccessToken(handler, payload.accessToken);
    const retrieve = new Retrieve(
      authRecord,
      payload.role || null,
      payload.repository,
      payload.uuid,
      payload.variant || null,
    );
    const retrieveHandler = Store.getRetrieveHandler(retrieve.repository, handler);
    const output = await retrieveHandler.__handle__(retrieve);
    return handler.response(output).code(output.getCode());
  }

  // runAuth

  // runTask
}

export { Output };
