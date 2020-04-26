const { merge } = require('./utils');

const isHandler = (handler) => typeof handler === 'function';

module.exports = class Data {
  constructor(handler) {
    this.handler = handler;

    this.dataSourceDefault = {
      params: {},
      data: {}
    };
  }

  async fetch(params) {
    if(!isHandler(this.handler)) {
      return new Error('The handler must be a function');
    }

    return await this.handler(params);
  }

  async inject(dataSourceCollection, injectCallback) {
    if (!dataSourceCollection.length) {
      return new Error('Please you must to make a data fetch before inject');
    }

    dataSourceCollection.forEach(dataSource => {
      injectCallback(dataSource);
    });

    return this;
   }
}
