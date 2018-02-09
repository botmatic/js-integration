const request = require('request')
const debug = require('debug')('botmatic:server')

require('dotenv').config();

const bearer = (token) => `Bearer ${token}`.trim();

const authenticate = (token) => (authorization) => {
  return new Promise((resolve, reject) => {
    if (token == '' || authorization == bearer(token)) {
      resolve(token)
    } else {
      reject('Bad token')
    }
  })
}

const execute = (botmatic, client, req, res, type) => {
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
    elementFound({data: req.body, client})
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

const execute_event = (botmatic, auth_user, req, res) => {
  execute(botmatic, auth_user, req, res, "event")
}

const execute_action = (botmatic, auth_user, req, res) => {
  execute(botmatic, auth_user, req, res, "action")
}

const send_response = (res, response) => {
  debug(`Send response: ${JSON.stringify(response)}`)
  res.send(response);
}

const setup_express = (port = 3000) => {
  debug(`starting express server on port ${port}`)

  const app = require('express')()

  app.listen(port, () => debug(`express app listening on port ${port}`))

  return app
}

const setup_routes = (botmatic, bearer, path = '/', token = '') => {
  debug(`setup route on "${path}"`)

  const bodyParser = require('body-parser');
  const jsonParser = bodyParser.json();

  botmatic.app.post(path, jsonParser, (req, res) => {
    botmatic.authenticate_request(req.headers.authorization)
    .then((client) => {
      if (req.body) {
        if (req.body.action) {
          execute_action(botmatic, client, req, res)
        } else if (req.body.event) {
          execute_event(botmatic, client, req, res)
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
  });
}

const init = ({path, server, token, port, auth}) => {
  if (!server) {
    server = setup_express(port)
  } else {
    debug("use existing express server")
  }

  if (!auth) {
    auth = authenticate(token)
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
    authenticate_request: auth
  }

  setup_routes(botmatic, bearer, path)

  return botmatic
}

module.exports = init;
