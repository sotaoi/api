import type { ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { Storage, StorageInit } from '@sotaoi/api/contracts/storage';
import { FileInput, Asset, StoredItem } from '@sotaoi/omni/input/file-input';
import { MultiFileInput } from '@sotaoi/omni/input/multi-file-input';
import fs from 'fs';
import path from 'path';

class StorageService extends Storage {
  constructor(init: StorageInit) {
    super(init);
  }

  public handle(item: Omit<StoredItem, 'drive'>, input: FileInput): [() => void, Asset, () => void] {
    const isEmpty = !input?.getValue().path && input?.getValue().asset.isEmpty();
    const asset = !isEmpty
      ? new Asset({
          drive: this.drive,
          domain: item.domain,
          pathname: item.pathname,
        })
      : new Asset(null);

    const save = (): void => {
      if (!input || !input.getValue().path || isEmpty) {
        return;
      }
      const destination = path.resolve(this.relativeTo, item.domain, item.pathname);
      !fs.existsSync(path.dirname(destination)) && fs.mkdirSync(path.dirname(destination), { recursive: true });
      return fs.copyFileSync(path.resolve(input.getValue().path), destination);
    };
    const remove = (): void => {
      const filepath = path.resolve(this.relativeTo, item.domain, item.pathname);
      fs.existsSync(filepath) && fs.lstatSync(filepath).isFile() && fs.unlinkSync(filepath);
    };

    return [save, asset, remove];
  }

  public multiHandle(item: Omit<StoredItem, 'drive'>, input: null | MultiFileInput): [() => void, Asset[], () => void] {
    const assets: Asset[] = input
      ? input.getValue().map((fileInput) => {
          const filename = fileInput.getValue().filename;
          const pathname = fileInput.getValue().asset?.pathname || '';
          if (!filename && !pathname) {
            throw new Error('something went wrong, storage multi handle item has neither filename, nor asset');
          }
          return new Asset({
            drive: this.drive,
            domain: item.domain,
            pathname: `${item.pathname}/${filename || path.basename(pathname)}`,
          });
        })
      : [];

    const save = (): void => {
      input &&
        input.getValue().map((fileInput) => {
          const fromPath = fileInput.getValue().path || null;
          const filename = fileInput.getValue().filename || null;
          if (!fromPath || !filename) {
            return;
          }
          const folderpath = path.resolve(this.relativeTo, item.domain, item.pathname);
          const destination = path.resolve(folderpath, filename);
          const assetFilenames = assets.map((asset) => path.basename(asset.pathname));
          !fs.existsSync(path.dirname(destination)) && fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.readdirSync(folderpath).map((item) => {
            item = path.resolve(folderpath, item);
            assetFilenames.indexOf(path.basename(item)) === -1 && fs.unlinkSync(item);
          });
          return fs.copyFileSync(path.resolve(fromPath), destination);
        });
    };
    const remove = (): void => {
      const folderpath = path.resolve(this.relativeTo, item.domain, item.pathname);
      fs.existsSync(folderpath) &&
        fs.lstatSync(folderpath).isDirectory() &&
        fs.rmdirSync(folderpath, { recursive: true });
    };

    return [save, assets, remove];
  }

  public async read(handler: ResponseToolkit, role: string, item: Omit<StoredItem, 'drive'>): Promise<ResponseObject> {
    if (!(await this.rule(handler, role, { ...item, drive: this.drive }))) {
      throw new Error('permission denied');
    }

    return (handler as any).file(path.resolve(this.relativeTo, item.domain, item.pathname));
  }

  public async remove(file: FileInput): Promise<void> {
    return fs.unlinkSync(path.resolve(this.relativeTo, file.getValue().path));
  }

  public async readdir(dirname: string): Promise<string[]> {
    return fs.readdirSync(path.resolve(this.relativeTo, dirname));
  }

  public async exists(item: string): Promise<boolean> {
    return fs.existsSync(path.resolve(this.relativeTo, item));
  }

  public async isFile(asset: Asset): Promise<boolean> {
    return fs.lstatSync(path.resolve(this.relativeTo, asset.domain, asset.pathname)).isFile();
  }

  public async isDirectory(item: string): Promise<boolean> {
    return fs.lstatSync(path.resolve(this.relativeTo, item)).isDirectory();
  }

  public async getFileInfo(asset: Asset): Promise<any> {
    return fs.lstatSync(path.resolve(this.relativeTo, asset.domain, asset.pathname));
  }
}

export { StorageService };
