const request = require('request')

require('dotenv').config();

const bearer = (token) => `Bearer ${token}`.trim();


const execute = (botmatic, res, type) => {
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
  console.log('SEND RESPONSE')
  console.log(response)
  res.send(response);
}

const setup_express = (port = 3000) => {
  const app = require('express')()
  const bodyParser = require('body-parser');

  app.use(bodyParser.json());

  app.listen(port, () => console.log(`Example app listening on port ${port}!`))

  return app
}

const setup_routes = (botmatic, path = '/', token = '') => {
  botmatic.app.post(path, (req, res) => {
    if (req.headers.authorization == bearer(token) || token == '') {
      console.log(`Receive "${JSON.stringify(req.body)}"`)

      if (req.body.action) {
        execute_action(botmatic, req, res)
      } else if (req.body.event) {
        execute_event(botmatic, req, res)
      } else {
        res.status(403).send("Bad Request")
      }
    } else {
      console.log(`Forbidden: "${req.headers.authorization}" != "${bearer}"`)
      res.status(401).send("Not authorized")
    }
  });
}


const init = ({path, app, token, port}) => {
  if (!app) {
    app = setup_express(port)
  }

  const botmatic = {
    action: [],
    event: [],
    app: app
  }

  setup_routes(botmatic, path, token)

  return botmatic
}

module.exports = init;
