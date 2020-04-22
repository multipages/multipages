const EventEmitter = require('events');

const Core = require('./Core');

class CoreAdapter {
  constructor(settings) {
    return new Core({
      settings: settings,
      hooks: new EventEmitter(),
    })
  }
}

CoreAdapter.EVENTS = Core.EVENTS;
CoreAdapter.MESSAGES = Core.MESSAGES;

module.exports = CoreAdapter;
