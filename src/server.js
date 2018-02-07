const request = require('request')
const debug = require('debug')('botmatic:server')

require('dotenv').config();

const bearer = (token) => `Bearer ${token}`.trim();

const execute = (botmatic, req, res, type) => {
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
    elementFound(req.body)
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

const execute_event = (botmatic, req, res) => {
  execute(botmatic, req, res, "event")
}

const execute_action = (botmatic, req, res) => {
  execute(botmatic, req, res, "action")
}

const send_response = (res, response) => {
  debug(`Send response: ${JSON.stringify(response)}`)
  res.send(response);
}

const setup_express = (port = 3000) => {
  debug(`starting express server on port ${port}`)

  const app = require('express')()
  const bodyParser = require('body-parser');

  app.use(bodyParser.json());

  app.listen(port, () => debug(`express app listening on port ${port}`))

  return app
}

const setup_routes = (botmatic, path = '/', token = '') => {
  debug(`setup route on "${path}"`)

  botmatic.app.post(path, (req, res) => {
    if (req.headers.authorization == bearer(token) || token == '') {
      debug(`receive "${JSON.stringify(req.body)}"`)

      if (req.body) {
        if (req.body.action) {
          execute_action(botmatic, req, res)
        } else if (req.body.event) {
          execute_event(botmatic, req, res)
        } else {
          debug("not receive an action or an event. Ignore")
          res.status(403).send("Bad Request")
        }
      } else {
        debug(`no parameter sent in query`)
        res.status(400).send("Bad request")
      }
    } else {
      debug(`forbidden: "${req.headers.authorization}" != "${bearer}"`)
      res.status(401).send("Not authorized")
    }
  });
}


const init = ({path, server, token, port}) => {
  if (!server) {
    server = setup_express(port)
  } else {
    debug("use existing express server")
  }

  const botmatic = {
    action: [],
    event: [],
    app: server
  }

  setup_routes(botmatic, path, token)

  return botmatic
}

module.exports = init;
