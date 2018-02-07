/**
 * @typedef {function(string, onCallback)} onActionFunction
 * @type {Function}
 * @description Add a Botmatic action to execute.
 * @params {string} action
 * @params {onCallback} func
 */

/**
 * @typedef {function(string, onCallback)} onEventFunction
 * @type {Function}
 * @description Add a Botmatic event to execute.
 * @params {string} event
 * @params {onCallback} func
 */

/**
 * @typedef {function(onCallback)} onInstallFunction
 * @type {Function}
 * @description defines the callback to execute on integration install
 * @params {onCallback} func
 */

/**
 * @typedef {function(onCallback)} onUninstallFunction
 * @type {Function}
 * @description defines the callback to execute on integration uninstall
 * @params {onCallback} func
 */

/**
 * @callback onCallback
 * @params {Object} data
 * @returns {Promise}
 */

/**
 * @typedef {Object} BotmaticEvents
 * @property {string} CONTACT_UPDATED
 * @property {string} CONTACT_CREATED
 * @property {string} CONTACT_DELETED
 * @property {string} USER_REPLY
 * @property {string} BOT_REPLY
 */

/**
 * @typedef {Object} BotmaticObject
 * @property {onActionFunction} onAction
 * @property {onEventFunction}  onEvent
 * @property {onInstallFunction} onInstall
 * @property {onUninstallFunction} onUninstall
 * @property {Express} app
 * @property {BotmaticEvents} events
 */