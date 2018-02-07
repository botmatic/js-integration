// Don't forget to put your BOTMATIC_TOKEN in .env file.
const BOTMATIC_EVENTS = {
  CONTACT_UPDATED: "contact_updated",
  CONTACT_CREATED: "contact_created",
  CONTACT_DELETED: "contact_deleted"
}

/**
 * Add a Botmatic function to execute.
 *
 * @param {Regexp} String regexp that represent the action to execute.
 */
const onAction = (server) => (action, func) => {
  try {
    new RegExp(`^${action}$`);
    server.action[action] = func;
  } catch(e) {
    console.error(`Action "${action}" is not a valid regexp`)
  }
}

/**
 * Add a Botmatic event to listen.
 *
 * @param {Regexp} String regexp that represent the event to listen.
 */
 const onEvent = (server) => (event, func) => {
  try {
    new RegExp(`^${event}$`);
    server.event[event] = func;
  } catch(e) {
    console.error(`Event "${event}"is not a valid regexp`)
  }
}

const onInstall = (server) => (func) => {
  server.event["install"] = func;
}

const onUninstall = (server) => (func) => {
  server.event["uninstall"] = func;
}

const init = (params = {}) => {
  server = require('./server')(params)

  botmatic = {
    onAction: onAction(server),
    onEvent: onEvent(server),
    onInstall: onInstall(server),
    onUninstall: onUninstall(server),
    app: server.app,
    events: Object.freeze(BOTMATIC_EVENTS)
  }

  return botmatic
}

// module.exports = botmatic;

module.exports = init