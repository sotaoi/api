class Deployment {
  constructor(run) {
    if (typeof run !== 'function') {
      throw new Error('Deployment constructor argument must be a function');
    }

    this._run = run;

    this._reload = async () => {
      console.warn('Deployment reload is not set');
    };
  }

  async run() {
    await this._run((reloadFn) => this.setReload(reloadFn));
  }

  async reload() {
    await this._reload();
  }

  setReload(reloadFn) {
    if (typeof reloadFn !== 'function') {
      console.warn('Failed to set reload function, given argument is not a function');
    }
    this._reload = async () => {
      await reloadFn();
    };
  }
}

module.exports = { Deployment };
