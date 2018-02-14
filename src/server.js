const request = require('request')
const debug = require('debug')('botmatic:server')
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const Mustache = require('mustache')
const fs = require('fs')

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
const BOTMATIC_BASE_URL = process.env.BOTMATIC_BASE_URL || "https://app.botmatic.ai"

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

const validateToken = (token) => {
  debug('validate token: ' + token)

  return new Promise((resolve, reject) => {
    if ( token ) {
      request.post({
        url: BOTMATIC_BASE_URL+"/api/integrationtokens/validate",
        form: {token: token},
        type: 'JSON',
        headers: {'content-type': 'application/json'}
      }, (err, httpResponse, body) => {
        try {
          const result = JSON.parse(body)

          if (err) {
            debug(`An error occured validatig token on Botmatic: ${err}`)
            resolve(false)
          } else if (result && result.success) {
            resolve(true)
          } else {
            debug(`Botmatic reject token ${token}`)
            resolve(false)
          }
        } catch(e) {
          debug(`An error occured validatig token on Botmatic: ${e}`)
          resolve(false)
        }
      })
    } else {
      debug(`No token given to validate`)
      resolve(false)
    }
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

const setup_routes = (botmatic, bearer, endpoint = '/') => {
  debug(`setup route on "${endpoint}"`)

  botmatic.app.post(endpoint, jsonParser, async (req, res) => {
    const tokenInHeader = getTokenInHeader(req.headers)

    if (req.body.event && [botmatic.events.INSTALL, botmatic.events.UNINSTALL].indexOf(req.body.event) >= 0) {
      if ( await validateToken(tokenInHeader)) {
        execute(botmatic, {token:tokenInHeader}, req, res, "event")
      } else {
        debug(`Botmatic reject token ${tokenInHeader} on install event`)
        res.status(401).send("Not authorized.")
      }
    } else {
      botmatic.authenticate_request(req.headers.authorization)
      .then(async (client) => {
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
        debug(`forbidden: bad auth: ${error}`)
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

const onSettingsPage = (server) => async (path, func) => {
  debug('onSettingsPage on ' + path)

  server.get(path, async (req,res) => {
    res.set('Content-Type', 'text/html')

    var isTokenValid = await validateToken(req.query.token)

    if (isTokenValid) {
      res.send(await getSettingsPage(req.query.token, func))
    } else {
      res.status(401).send('Forbidden')
    }
  })
}

const onUpdateSettings = (server) => async (path, func) => {
  debug('onUpdateSettings on ' + path)

  server.post(path, jsonParser, async (req,res) => {
    res.set('Content-Type', 'text/html')

    var token = req.body ? req.body.token : null;
    var isTokenValid = await validateToken(token)

    if (isTokenValid) {
      var result = await func(req.query.token, req.body)

      res.send(result)
    } else {
      res.status(401).send('Forbidden')
    }
  })
}

const getSettingsPage = async (token, func) => {
  var tpl = await func(token)
  var resBuf = fs.readFileSync(__dirname + '/../views/integration-form.html');
  var resStr = resBuf.toString('utf8')
  return Mustache.render(resStr, {tpl: tpl, token: token});
}

const init = ({endpoint, server, token, port, auth}) => {
  let handle = undefined

  if (!server) {
    const res = setup_express(port)
    server = res.app
    handle = res.handle
  } else {
    debug("use existing express server")
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
    },
    onSettingsPage: onSettingsPage(server),
    onUpdateSettings: onUpdateSettings(server)
  }

  setup_routes(botmatic, bearer, endpoint)

  return botmatic
}

module.exports = init;
