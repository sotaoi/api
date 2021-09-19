import { AuthResult } from '@sotaoi/omni/transactions';
import { AuthCommand } from '@sotaoi/api/commands';
import { AuthHandler } from '@sotaoi/api/commands/auth-handler';
import { Helper } from '@sotaoi/api/helper';
import { GenericModel } from '@sotaoi/api/db/generic-model';
import { ErrorCode } from '@sotaoi/omni/errors';

class AuthMaintainerHandler extends AuthHandler {
  public getFormId = async (): Promise<string> => 'auth-maintainer-form';

  public async model(): Promise<GenericModel> {
    return new GenericModel('user');
  }

  public async handle(command: AuthCommand): Promise<AuthResult> {
    const maintainer = await new GenericModel('user')
      .mdb()
      .where('email', command.payload.email.serialize(true))
      .where('password', command.payload.password.serialize(true))
      .first();
    if (!maintainer) {
      return new AuthResult(401, ErrorCode.APP_GENERIC_ERROR, 'Error', 'Invalid credentials', null, null, null, {});
    }
    const accessToken = Helper.uuid();
    const authRecord = this.sdriverAuthRecord('user', maintainer.uuid, maintainer.createdAt, true, {});

    await new GenericModel('access_token').mdb().insert({
      uuid: Helper.uuid(),
      authRecordSerial: authRecord.serial,
      token: accessToken,
      rememberMe: true,
      expiresAt: Helper.addSeconds(new Date(), AuthHandler.getTokenTtlInSeconds()),
    });
    AuthHandler.saveAccessToken(this.handler, accessToken, AuthHandler.getTokenTtlInSeconds());

    return new AuthResult(200, null, 'Success', 'Authentication success', authRecord, accessToken, null, {});
  }
}

export { AuthMaintainerHandler };
