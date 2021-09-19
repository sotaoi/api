class AppContainer {
  protected services: { [key: string]: () => any } = {};
  protected _config: (key: string) => any;

  constructor(config: (key: string) => any) {
    this._config = config;
  }

  public config(key: string): any {
    return this._config(key);
  }

  public get<ClassType>(type: string): ClassType {
    return this.services[type]();
  }

  public bind<ClassType>(type: string, implementation: any): void {
    this.services[type] = typeof implementation === 'function' ? implementation : (): ClassType => implementation;
  }

  public singleton<ClassType>(type: string, implementation: () => ClassType): void {
    const singleton = implementation();
    this.services[type] = (): ClassType => singleton;
  }

  public has(item: string): boolean {
    return typeof this.services[item] !== 'undefined';
  }
}

export { AppContainer };
