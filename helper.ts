import { Helper as OmniHelper, BundleJson } from '@sotaoi/omni/helper';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jsonic from 'jsonic';
import { Server as HttpsServer } from 'https';
import { Server as HttpServer } from 'http';
import { Logger } from '@sotaoi/api/contracts/logger';

class Helper extends OmniHelper {
  public static uuid(): string {
    return uuidv4();
  }

  public static sha1(str: string): string {
    return crypto.createHash('sha1').update(str).digest('hex');
  }

  public static getBundleJson(): BundleJson {
    delete require.cache[require.resolve('@sotaoi/omni/bundle.json')];
    const BundleJson = require('@sotaoi/omni/bundle.json');
    BundleJson.installed = !!BundleJson.installed;
    BundleJson.master = !!BundleJson.master;
    return BundleJson;
  }

  public static rootPath(pathInRoot = ''): null | string {
    let rootPath = path.resolve('./');
    let foundRootPath = false;
    for (let i = 0; i < 10; i++) {
      rootPath = path.resolve(rootPath, '../');
      if (
        !fs.existsSync(path.resolve(rootPath, 'node_modules')) ||
        !fs.existsSync(path.resolve(rootPath, 'root-pocket')) ||
        !fs.existsSync(path.resolve(rootPath, 'ecosystem.json')) ||
        !fs.existsSync('package.json')
      ) {
        continue;
      }
      foundRootPath = true;
      break;
    }
    if (!foundRootPath) {
      return null;
    }
    return rootPath;
  }

  public static extractJson(path: string): { [key: string]: any } {
    const string = fs.readFileSync(path).toString();
    const firstBracketPos = string.indexOf('{');
    const lastBracketPos = string.lastIndexOf('}');
    return jsonic(string.slice(firstBracketPos, lastBracketPos + 1).replace(/\n/g, ''));
  }

  public static shutDown(servers: (HttpsServer | HttpServer)[], logger: null | (() => Logger)): void {
    const output = logger || (() => console);

    if (!servers.length) {
      output().info('No servers to close, terminating...');
      process.exit(0);
    }

    let serverShutDownCount = 0;
    output().info('\n\nReceived kill signal, shutting down servers\n');
    servers.map((server) => {
      server.close(() => {
        serverShutDownCount++;
        if (servers.length === serverShutDownCount) {
          process.exit(0);
        }
      });
    });

    setTimeout(() => {
      output().error('\nCould not close connections in time, forcefully shutting down\n');
      process.exit(1);
    }, 10000);
  }
}

export { Helper };
export type { TransformerFn, BundleJson } from '@sotaoi/omni/helper';
