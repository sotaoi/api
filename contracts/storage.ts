import { FileInput, Asset, StoredItem } from '@sotaoi/omni/input/file-input';
import { MultiFileInput } from '@sotaoi/omni/input/multi-file-input';
import { ResponseToolkit } from '@hapi/hapi';

interface StorageInit {
  drive: string;
  relativeTo?: string;
  rule?: (handler: ResponseToolkit, role: string, item: StoredItem) => Promise<boolean>;
}

abstract class Storage {
  abstract handle(item: Omit<StoredItem, 'drive'>, input: FileInput): [() => void, Asset, () => void];
  abstract multiHandle(
    item: Omit<StoredItem, 'drive'>,
    input: null | MultiFileInput,
  ): [() => void, Asset[], () => void];
  abstract read(handler: ResponseToolkit, role: string, item: Omit<StoredItem, 'drive'>): Promise<any>;
  abstract remove(file: FileInput): Promise<void>;
  abstract readdir(dirname: string): Promise<string[]>;
  abstract exists(item: string): Promise<boolean>;
  abstract isFile(asset: Asset): Promise<boolean>;
  abstract isDirectory(item: string): Promise<boolean>;
  abstract getFileInfo(asset: Asset): Promise<any>;

  protected drive: string;
  protected relativeTo: string;
  protected rule: (handler: ResponseToolkit, role: string, item: StoredItem) => Promise<boolean>;

  constructor(init: StorageInit) {
    this.drive = init.drive;
    this.relativeTo = init.relativeTo || '/';
    this.rule =
      init.rule || (async (handler: ResponseToolkit, role: string, item: StoredItem): Promise<boolean> => true);
  }
}

export { Storage, Asset };
export type { StorageInit, StoredItem };
