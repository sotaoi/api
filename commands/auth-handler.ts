import { AuthResult } from '@sotaoi/omni/transactions';
import { AuthCommand } from '@sotaoi/api/commands';
import { AuthRecord } from '@sotaoi/omni/artifacts';
import { BaseHandler } from '@sotaoi/api/base-handler';
import { ResponseToolkit } from '@hapi/hapi';
import { Model } from '@sotaoi/api/db/model';

// todo lowprio: rename user column to something abstract
// todo lowprio: add strategy to translate access token (auth registry)

abstract class AuthHandler extends BaseHandler {
  abstract getFormId(): Promise<string>;
  abstract model(): Promise<Model>;
  abstract handle(command: AuthCommand): Promise<AuthResult>;

  private static TOKEN_TTL: null | number = null;
  private static SHORT_TOKEN_TTL: null | number = null;

  public async __handle__(command: AuthCommand): Promise<AuthResult> {
    return await this.handle(command);
  }

  public static setTokenTtlInMilliseconds(tokenTtl: number): void {
    this.TOKEN_TTL = tokenTtl;
  }

  public static getTokenTtlInMilliseconds(): number {
    if (this.TOKEN_TTL === null) {
      throw new Error('Token time to live is not set');
    }
    return this.TOKEN_TTL;
  }

  public static getTokenTtlInSeconds(): number {
    if (this.TOKEN_TTL === null) {
      throw new Error('Token time to live is not set');
    }
    return this.TOKEN_TTL / 1000;
  }

  public static setShortTokenTtlInMilliseconds(tokenTtl: number): void {
    this.SHORT_TOKEN_TTL = tokenTtl;
  }

  public static getShortTokenTtlInMilliseconds(): number {
    if (this.SHORT_TOKEN_TTL === null) {
      throw new Error('Token time to live is not set');
    }
    return this.SHORT_TOKEN_TTL;
  }

  public static getShortTokenTtlInSeconds(): number {
    if (this.SHORT_TOKEN_TTL === null) {
      throw new Error('Token time to live is not set');
    }
    return this.SHORT_TOKEN_TTL / 1000;
  }

  public static saveAccessToken(handler: ResponseToolkit, value: string, tokenTtlInSeconds: number): void {
    handler.state('accessToken', value, {
      ttl: tokenTtlInSeconds * 1000,
      isHttpOnly: true,
      isSecure: true,
    });
  }

  public static getAccessToken(handler: ResponseToolkit): null | string {
    return handler.request.state.accessToken || null;
  }

  public static removeAccessToken(handler: ResponseToolkit): void {
    handler.unstate('accessToken');
  }

  public static setTranslateAccessToken(
    translateAccessTokenFn: (
      handler: ResponseToolkit,
      accessToken: null | string,
    ) => Promise<[null | AuthRecord, null | string]>,
  ): void {
    this._translateAccessToken = translateAccessTokenFn;
  }

  public static async translateAccessToken(
    handler: ResponseToolkit,
    accessToken: null | string,
  ): Promise<[null | AuthRecord, null | string]> {
    return await this._translateAccessToken(handler, accessToken);
  }

  public static setDeauth(deauth: (handler: ResponseToolkit) => Promise<void>): void {
    this._deauth = deauth;
  }

  public static async deauth(handler: ResponseToolkit): Promise<void> {
    return await this._deauth(handler);
  }

  protected static _translateAccessToken = async (
    handler: ResponseToolkit,
    accessToken: null | string,
  ): Promise<[null | AuthRecord, null | string]> => [null, null];

  protected static _deauth = async (handler: ResponseToolkit): Promise<void> => undefined;
}

export { AuthHandler };
