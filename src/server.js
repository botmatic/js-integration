const express = require('express')
const request = require('request')
const app = express()
const bodyParser = require('body-parser');
require('dotenv').config();

const server = {
  action: [],
  event: []
}
const actions = [];

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send("Hello world!");
});

const bearer = `Bearer ${process.env.BOTMATIC_TOKEN}`.trim();

app.post('/', (req, res) => {
  if ( req.headers.authorization == bearer || !process.env.BOTMATIC_TOKEN) {
    console.log(`Receive "${JSON.stringify(req.body)}"`)

    if (req.body.action) {
      execute_action(req, res)
    } else if (req.body.event) {
      execute_event(req, res)
    }
  } else {
    console.log(`Forbidden: "${req.headers.authorization}" != "${bearer}"`)
    res.status(401).send("Not authorized")
  }
});

const execute = (req, res, type) => {
  let elementFound = null;
  var regex;

  for ( var elm in server[type] ) {
    regex = new RegExp(`^${elm}$`);

    if (regex.test(req.body[type])) {
      elementFound = server[type][elm];
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
      type: "data"
    };
    template_res.data = {error: `No ${type} "${req.body.action}" defined`};
    send_response(res, template_res);
  }
}

const execute_event = (req, res) => {
  execute(req, res, "event")
}

const execute_action = (req, res) => {
  execute(req, res, "action")
}

const send_response = (res, response) => {
  console.log('SEND RESPONSE')
  console.log(response)
  res.send(response);
}

const port = process.env.BOTMATIC_PORT || 3000;

// Start express listening.
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = server;
