import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { stringify } from 'flatted';
import { Logger } from '@sotaoi/api/contracts/logger';

const log = console.log;
const warn = console.warn;
const error = console.error;

class LoggerService extends Logger {
  constructor(logPath: string) {
    super(logPath);
  }

  public notice(...textArr: any[]): void {
    if (this.suppressed || this.disabledLogging) {
      return;
    }

    !(textArr instanceof Array) && (textArr = [textArr]);
    this.opLogfile();
    let header = new Date().toISOString().substr(0, 19).replace('T', ' ');
    header = `[${header}] NOTICE:`;
    textArr.map((text) => {
      log(header, text);
      const flatText = typeof text === 'object' ? stringify(text) : String(text);
      fs.appendFileSync(this.logfile, header + ' ' + flatText + '\n\n');
    });
  }

  public info(...textArr: any[]): void {
    if (this.suppressed || this.disabledLogging) {
      return;
    }

    !(textArr instanceof Array) && (textArr = [textArr]);
    this.opLogfile();
    let header = new Date().toISOString().substr(0, 19).replace('T', ' ');
    header = `[${header}] INFO:`;
    textArr.map((text) => {
      log(header, text);
      const flatText = typeof text === 'object' ? stringify(text) : String(text);
      fs.appendFileSync(this.logfile, header + ' ' + flatText + '\n\n');
    });
  }

  public warn(...textArr: any[]): void {
    if (this.suppressed || this.disabledLogging) {
      return;
    }

    !(textArr instanceof Array) && (textArr = [textArr]);
    this.opLogfile();
    let header = new Date().toISOString().substr(0, 19).replace('T', ' ');
    header = `[${header}] WARNING:`;
    textArr.map((text) => {
      warn(chalk.yellow(header, text));
      const flatText = typeof text === 'object' ? stringify(text) : String(text);
      fs.appendFileSync(this.logfile, header + ' ' + flatText + '\n\n');
    });
  }

  public error(...textArr: any[]): void {
    if (this.suppressed || this.disabledLogging) {
      return;
    }

    this.opLogfile();
    let header = new Date().toISOString().substr(0, 19).replace('T', ' ');
    header = `[${header}] ERROR:`;
    textArr.map((text) => {
      if (text && text instanceof Error) {
        text = text.stack ? text.stack : JSON.stringify(text);
      }

      error(chalk.red(header, text));
      const flatText = typeof text === 'object' ? stringify(text) : String(text);
      fs.appendFileSync(this.logfile, header + ' ' + flatText + '\n\n');
    });
  }

  public estack(err: any): void {
    if (this.suppressed || this.disabledLogging) {
      return;
    }

    this.opLogfile();
    const text = err && err.stack ? err.stack : typeof err === 'string' ? err : JSON.stringify(err);
    let header = new Date().toISOString().substr(0, 19).replace('T', ' ');
    header = `[${header}] ERROR:`;
    error(chalk.red(header, text));
    const flatText = typeof text === 'object' ? stringify(text) : String(text);
    fs.appendFileSync(this.logfile, header + ' ' + flatText + '\n\n');
  }

  public wstack(err: any): void {
    if (this.suppressed || this.disabledLogging) {
      return;
    }

    this.opLogfile();
    const text = err && err.stack ? err.stack : typeof err === 'string' ? err : JSON.stringify(err);
    let header = new Date().toISOString().substr(0, 19).replace('T', ' ');
    header = `[${header}] WARNING:`;
    error(chalk.yellow(header, text));
    const flatText = typeof text === 'object' ? stringify(text) : String(text);
    fs.appendFileSync(this.logfile, header + ' ' + flatText + '\n\n');
  }

  public suppress(): void {
    this.suppressed = true;
  }

  public unsuppress(): void {
    this.suppressed = false;
  }

  public enableLogging(): void {
    this.disabledLogging = false;
  }

  public disableLogging(): void {
    this.disabledLogging = true;
  }

  protected opLogfile(): void {
    if (this.disabledLogging) {
      return;
    }

    if (!fs.existsSync(this.logfile)) {
      const dir = path.dirname(this.logfile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.logfile, '');
    }
  }
}

export { LoggerService };
