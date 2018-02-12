const request = require('request')
const debug = require('debug')('botmatic:server')

// require('dotenv').config();

/**
 * @constant
 * @type BotmaticEvents
 */
const BOTMATIC_EVENTS = Object.freeze({
  INSTALL: "install",
  UNINSTALL: "uninstall",
  CONTACT_UPDATED: "contact_updated",
  CONTACT_CREATED: "contact_created",
  CONTACT_DELETED: "contact_deleted",
  USER_REPLY: "user_reply",
  BOT_REPLY: "bot_reply"
})

const bearer = (token) => `Bearer ${token}`.trim();
const BOTMATIC_ENDPOINT = process.env.BOTMATIC_BASE_URL || "https://app.botmatic.ai"

const authenticate = (token) => async (authorization) => {
  return new Promise((resolve, reject) => {
    if (token == '' || authorization == bearer(token)) {
      return({success: true, token: token})
    } else {
      return({success: false, error: "Bad token"})
    }
  })
}

const authenticate_accept_all = async () => {ok: true}

const execute = (botmatic, auth, req, res, type) => {
  debug(`Executing ${type}...`)

  let elementFound = null;
  var regex;

  for ( var elm in botmatic[type] ) {
    regex = new RegExp(`^${elm}$`);

    if (regex.test(req.body[type])) {
      elementFound = botmatic[type][elm];
    }
  }

  if (elementFound) {
    elementFound({data: req.body, auth})
    .then((result) => {
      result.success = true;
      send_response(res, result)
    })
    .catch((error) => {
      error.success= false;
      send_response(res, error)
    })
  } else {
    debug(`no ${type} "${req.body[type]}" defined`)

    let template_res = {
      success: false,
      type: "data",
      data: {error: `No ${type} "${req.body[type]}" defined`}
    };

    send_response(res, template_res);
  }
}

const execute_event = async (botmatic, {token, client}, req, res) => {
  execute(botmatic, {token, client}, req, res, "event")
}

const identifyToken = (token) => {
  return new Promise((resolve, reject) => {
    request.post({
      url: BOTMATIC_ENDPOINT+"/api/validatetoken",
      json: { token: token },
      type: 'JSON'
    }, (err, httpResponse, body) => {
      if (err) {
        debug(`An error occured validatig token on Botmatic: ${err}`)
        resolve(false)
      } else if (body.success) {
        resolve(true)
      } else {
        debug(`Botmatic reject token ${token}`)
        resolve(false)
      }
    })
  })
}

const getTokenInHeader = (headers) => {
  if (headers && headers.authorization) {
    return headers.authorization.replace('Bearer ', '')
  } else {
    return null;
  }
}

const execute_action = (botmatic, auth_user, req, res) => {
  execute(botmatic, auth_user, req, res, "action")
}

const send_response = (res, response) => {
  debug(`Send response: ${JSON.stringify(response)}`)
  res.send(response);
}

const get_auth = (token, client) => {
  if ( client === true ) {
    return {token:token}
  } else {
    return {token:token, client: client}
  }
}

const setup_express = (port = 3000) => {
  debug(`starting express server on port ${port}`)

  const app = require('express')()

  const handle = app.listen(port, () => debug(`express app listening on port ${port}`))

  return {app, handle}
}

const setup_routes = (botmatic, bearer, path = '/') => {
  debug(`setup route on "${path}"`)

  const bodyParser = require('body-parser');
  const jsonParser = bodyParser.json();

  botmatic.app.post(path, jsonParser, async (req, res) => {
    const tokenInHeader = getTokenInHeader(req.headers)

    if (req.body && req.body.event && [botmatic.events.INSTALL, botmatic.events.UNINSTALL].indexOf(req.body.event) >= 0) {
      if ( await identifyToken(tokenInHeader)) {
        execute(botmatic, { token: tokenInHeader }, req, res, "event")
      } else {
        res.status(401).send("Not authorized")
      }
    } else {
      botmatic.authenticate_request(req.headers.authorization)
      .then((client) => {
        if (req.body) {
          if (req.body.action) {
            execute_action(botmatic, get_auth(tokenInHeader, client), req, res)
          } else if (req.body.event) {
            execute_event(botmatic, get_auth(tokenInHeader, client), req, res)
          } else {
            debug("not receive an action or an event. Ignore")
            res.status(403).send("Bad Request")
          }
        } else {
          debug(`no parameter sent in query`)
          res.status(400).send("Bad request. No parameter received")
        }
      })
      .catch((error) => {
        debug(`forbidden: bad auth`)
        res.status(401).send("Not authorized")
      })
    }
  });
}

const get_auth_function = (auth = null) => {
  if ( typeof auth !== "function" ) {
    if ( typeof auth === "string" ) {
      authenticate(auth)
    } else {
      auth = authenticate_accept_all
    }
  }

  return auth
}

const init = ({path, server, token, port, auth}) => {
  let handle = undefined

  if (!server) {
    const res = setup_express(port)
    server = res.app
    handle = res.handle
  } else {
    debug("use existing express server")
  }

  if (!bearer) {
    bearer = basic_bearer
  } else {
    debug("use custom bearer function")
  }

  const botmatic = {
    action: [],
    event: [],
    app: server,
    // token: token,
    authenticate_request: get_auth_function(auth),
    events: BOTMATIC_EVENTS,
    close: (fn) => {
      if (handle) {
        debug("close handle")
        debug(fn ? "has fn": "has not fn")
        handle.close(fn)
      }
    }
  }

  setup_routes(botmatic, bearer, path)

  return botmatic
}

module.exports = init;
