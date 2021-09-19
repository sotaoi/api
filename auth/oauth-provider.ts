// See https://oauth2-server.readthedocs.io/en/latest/model/spec.html for what you can do with this
import crypto from 'crypto';
import { Model } from '@sotaoi/api/db/model';
import { Helper } from '@sotaoi/api/helper';
import { RecordEntry } from '@sotaoi/omni/artifacts';

interface AuthorizedRecord {
  scope: string;
  user: RecordEntry;
}

const transformRecord = (record: undefined | null | { [key: string]: any }): null | { [key: string]: any } => {
  if (!record) {
    return null;
  }
  const { id, ...result } = record;
  return result;
};

const oauthProvider = (port: string) => {
  const mdrv = Model.mdriver();

  return {
    getClient: async (clientId: string, clientSecret: string) => {
      let clientRetrieve = mdrv('oauth_client').where('clientId', clientId);
      if (clientSecret) {
        clientRetrieve = clientRetrieve.where('clientSecret', clientSecret);
      }
      const client = (await clientRetrieve.first()) || null;
      if (!client) {
        return null;
      }

      client.grants = JSON.parse(client.grants);

      const { id, ...result } = client;
      return result;
    },

    // generateAccessToken: (client: any, user: any, scope: any) => {
    //   // generates access tokens
    //   return 'some-token';
    // },

    generateAuthorizationCode: async (
      client: { [key: string]: any },
      authorizedRecord: AuthorizedRecord,
      scope: string,
    ) => {
      return crypto.createHash('sha1').update(crypto.randomBytes(256)).digest('hex');
    },

    saveToken: async (
      token: { [key: string]: any },
      client: { [key: string]: any },
      authorizedRecord: AuthorizedRecord,
    ) => {
      if (token.scope !== authorizedRecord.scope) {
        return null;
      }

      const tokenRecord = {
        uuid: Helper.uuid(),
        authorizationCode: token.authorizationCode,
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        scope: token.scope,
        refreshToken: token.refreshToken, // NOTE this is only needed if you need refresh tokens down the line
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        clientUuid: client.uuid,
        userUuid: authorizedRecord.user.uuid,
      };
      await mdrv('oauth_token').insert(tokenRecord);
      const { clientUuid, userUuid, ...result } = tokenRecord;
      return { ...result, client, user: authorizedRecord.user };
    },

    getAccessToken: async (token: { [key: string]: any }) => {
      const tokenRecord = await mdrv('oauth_token').where('accessToken', token).first();
      if (!tokenRecord) {
        return null;
      }

      const client = transformRecord(await mdrv('oauth_client').where('uuid', tokenRecord.clientUuid).first());
      if (!client) {
        return null;
      }
      tokenRecord.client = client;

      const user = transformRecord(await mdrv('user').where('uuid', tokenRecord.userUuid).first());
      if (!user) {
        return null;
      }
      tokenRecord.user = {
        scope: tokenRecord.scope,
        user: user,
      };

      const { id, clientUuid, userUuid, ...result } = tokenRecord;
      return result;
    },

    getRefreshToken: async (token: string) => {
      const tokenRecord = transformRecord(await mdrv('oauth_token').where('refreshToken', token).first());
      if (!tokenRecord) {
        return null;
      }

      const client = transformRecord(await mdrv('oauth_client').where('uuid', tokenRecord.clientUuid).first());
      if (!client) {
        return null;
      }
      tokenRecord.client = client;

      const user = transformRecord(await mdrv('user').where('uuid', tokenRecord.userUuid).first());
      if (!user) {
        return null;
      }
      tokenRecord.user = {
        scope: tokenRecord.scope,
        user: user,
      };

      const { clientUuid, userUuid, ...result } = tokenRecord;
      return result;
    },

    revokeToken: async (refreshTokenRecord: { [key: string]: any } | string) => {
      if (typeof refreshTokenRecord !== 'object' && typeof refreshTokenRecord !== 'string') {
        return false;
      }
      if (typeof refreshTokenRecord === 'object' && refreshTokenRecord.uuid) {
        await mdrv('oauth_token').where('uuid', refreshTokenRecord.uuid).delete();
        return true;
      }
      if (typeof refreshTokenRecord === 'string') {
        await mdrv('oauth_authorization_code').where('refreshToken', refreshTokenRecord).delete();
        return true;
      }
      return false;
    },

    saveAuthorizationCode: async (
      code: { [key: string]: any },
      client: { [key: string]: any },
      authorizedRecord: AuthorizedRecord,
    ) => {
      const authorizationCodeRecord = {
        uuid: Helper.uuid(),
        authorizationCode: code.authorizationCode,
        scope: code.scope,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        clientUuid: client.uuid,
        userUuid: authorizedRecord.user.uuid,
      };
      await mdrv('oauth_authorization_code').insert(authorizationCodeRecord);

      const { clientUuid, userUuid, ...result } = { ...authorizationCodeRecord, client, user: authorizedRecord.user };
      return result;
    },

    getAuthorizationCode: async (authorizationCode: string) => {
      const authorizationCodeRecord = transformRecord(
        await mdrv('oauth_authorization_code').where('authorizationCode', authorizationCode).first(),
      );
      if (!authorizationCodeRecord) {
        return null;
      }

      const client = transformRecord(
        await mdrv('oauth_client').where('uuid', authorizationCodeRecord.clientUuid).first(),
      );
      if (!client) {
        return null;
      }
      authorizationCodeRecord.client = client;

      const user = transformRecord(await mdrv('user').where('uuid', authorizationCodeRecord.userUuid).first());
      if (!user) {
        return null;
      }
      authorizationCodeRecord.user = {
        scope: authorizationCodeRecord.scope,
        user: user,
      };

      const { id, clientUuid, userUuid, ...result } = authorizationCodeRecord;
      return result;
    },

    revokeAuthorizationCode: async (authorizationCodeRecord: { [key: string]: any } | string) => {
      if (typeof authorizationCodeRecord !== 'object' && typeof authorizationCodeRecord !== 'string') {
        return false;
      }
      if (typeof authorizationCodeRecord === 'object' && authorizationCodeRecord.uuid) {
        await mdrv('oauth_authorization_code').where('uuid', authorizationCodeRecord.uuid).delete();
        return true;
      }
      if (typeof authorizationCodeRecord === 'string') {
        await mdrv('oauth_authorization_code').where('authorizationCode', authorizationCodeRecord).delete();
        return true;
      }
      return false;
    },
  };
};

export { oauthProvider };
