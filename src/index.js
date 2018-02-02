// Don't forget to put your BOTMATIC_TOKEN in .env file.

const server = require('./server')

let botmatic = {};

/**
 * Add a Botmatic function to execute.
 *
 * @param {Regexp} String regexp that represent the action to execute.
 */
botmatic.onAction = (action, func) => {
  try {
    new RegExp(`^${action}$`);
    server.action[action] = func;
  } catch(e) {
    console.error(`${action} is not a valid regexp`)
  }
}

/**
 * Add a Botmatic event to listen.
 *
 * @param {Regexp} String regexp that represent the event to listen.
 */
botmatic.onEvent = (event, func) => {
  try {
    new RegExp(`^${event}$`);
    server.event[event] = func;
  } catch(e) {
    console.error(`${event} is not a valid regexp`)
  }
}

module.exports = botmatic;
