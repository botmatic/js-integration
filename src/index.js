const debug = require('debug')('botmatic')

/**
 * Returns an onActionFunction
 *
 * @param {Object} server
 * @returns {onActionFunction}
 */
const makeOnAction = (server) => (action, func) => {
  try {
    new RegExp(`^${action}$`);
    server.action[action] = func;
    debug(`listening "${action}" action`)
  } catch(e) {
    console.error(`Action "${action}" is not a valid regexp`)
  }
}

/**
 * Returns on onEventFunction
 *
 * @param {Object} server
 * @returns {onEventFunction}
 */
 const makeOnEvent = (server) => (event, func) => {
  try {
    new RegExp(`^${event}$`);
    server.event[event] = func;
    debug(`listening "${event}" event`)
  } catch(e) {
    console.error(`Event "${event}" is not a valid regexp`)
  }
}

/**
 * Returns an onInstallFunction
 *
 * @param {Object} server
 * @return {onInstallFunction}
 */
const makeOnInstall = (server) => (func) => {
  server.event["install"] = func;
  debug(`listening "install" event`)
}

/**
 * Returns an onUninstallFunction
 *
 * @param {Object} server
 * @return {onUninstallFunction}
 */
const makeOnUninstall = (server) => (func) => {
  server.event["uninstall"] = func;
  debug(`listening "uninstall" event`)
}

/**
 * Initialises the Botmatic module
 * @param {Object} [params]       Parameters for setting up the express instance
 * @param {number} [params.port = 3000]  The port to listen to
 * @param {string} [params.path = "/"]   The endpoint path
 * @param {string} [params.token = '']   The endpoint token to authentify
 * botmatic's requests
 * @param {*}      [params.app]          An existing express instance
 *
 * @return {BotmaticObject}
 */
const init = (params = {}) => {
  server = require('./server')(params)

  return {
    onAction: makeOnAction(server),
    onEvent: makeOnEvent(server),
    onInstall: makeOnInstall(server),
    onUninstall: makeOnUninstall(server),
    app: server.app,
    events: server.BOTMATIC_EVENTS,
    close: server.close
  }
}

module.exports = init
