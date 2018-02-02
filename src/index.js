// Don't forget to put your BOTMATIC_TOKEN in .env file.

const server = require('./server')

let botmatic = {};

/**
 * Add a Botmatic function to execute.
 *
 * @param {Regexp} String regexp that represent the action to execute.
 */
botmatic.listenAction = (action, func) => {
  server.action[action] = func;
}

/**
 * Add a Botmatic event to listen.
 *
 * @param {Regexp} String regexp that represent the event to listen.
 */
botmatic.listenEvent = (event, func) => {
  server.event[event] = func;
}

module.exports = botmatic;
