import fs from 'fs';
import path from 'path';

abstract class Logger {
  protected logfile: string = path.resolve('./app.log');
  protected disabledLogging: boolean;
  protected suppressed = false;

  constructor(logPath: string) {
    this.disabledLogging = !logPath;

    if (this.disabledLogging) {
      return;
    }

    const today = new Date().toISOString().substr(0, 10).replace('T', ' ');

    // this.logfile = path.resolve(rootPath(logPath), `${today}-app.log`);
    this.logfile = path.resolve(logPath, `${today}-app.log`);

    const dirname = path.dirname(this.logfile);
    !fs.existsSync(dirname) && fs.mkdirSync(dirname, { recursive: true });
    !fs.existsSync(this.logfile) && fs.writeFileSync(this.logfile, '');
  }

  abstract notice(...textArr: any[]): void;
  abstract info(...textArr: any[]): void;
  abstract warn(...textArr: any[]): void;
  abstract error(...textArr: any[]): void;
  abstract estack(err: any): void;
  abstract wstack(err: any): void;
  abstract suppress(): void;
  abstract unsuppress(): void;
}

export { Logger };
