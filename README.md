# Create your Botmatic integration

[Botmatic.ai](https://botmatic.ai) is a keyboard first experience where you design your chatbot by writing a conversation.
You can create your own integrations and listen to Botmatic events and actions.

## Install

```shell
npm install --save @botmatic/js-integration
```

## Usage

### Require Botmatic

```javascript
const botmatic = require('@botmatic/js-integration')(settings)
```

settings is an optional JSON object with the following fields:

| Field name | Type | Description            |
| ----------- | --------------- | ----------- |
| port        | Integer |optional - Server Express port (3000 by default) |
| path        | String | optional - Endpoint path where Botmatic will send data with a POST request ("/" by default) |
| server      | Express server|optional - Your existing Express server |
| token      | String | optional - Botmatic integration token. If not set, the integration will accept all requests. |
| auth        | Function | optionnal - Function to authenticate Botmatic integration client. Take a parameter token (given in header), must return a promise |

This library has an Express server embedded. It's optional and you can use your own if you want.

#### Example with your existing Express server (works with Express 4)
```javascript
var express = require('express');
var app = express();

const botmatic = require('@botmatic/js-integration')({
  server: app
})
```

#### Example using the Express server included with @botmatic/js-integration
```javascript
const botmatic = require('@botmatic/js-integration')()
```

### Example using custom authentication
```javascript
const botmatic = require('@botmatic/js-integration')({
  auth: (token) => {
    return new Promise((resolve, reject) => {
      // Retrieve the client in your database, or other.
      const client_authenticated = {id: "client_id"}
      // If the client is known
      // resolve(client_authenticated)
      // if not
      // reject();
    })
  }
})
```

### Listening to actions

In the Botmatic chatbot builder, you can call custom actions during the conversation.

Useful to fetch data from an external source.

**Parameters**:
- action name: Regexp you can pass exact action name, or a regexp (e.g: ".\*")
- callback: Function that takes 2 arguments. Should return a Promise.
  - client: Botmatic integration token or your custom client (JSON object) returned by your custom auth function.
  - data: JSON received from Botmatic.

```javascript
const botmatic = require('@botmatic/js-integration')()

// Tips: you can use regexp for action name.
botmatic.onAction("actionName", ({client, data}) {
  return new Promise((resolve, reject) => {
    resolve({data: {key: "value"}, type: "data"});
  })
})
```

### Listening to events

**Parameters**:
- event name: Regexp you can pass exact event name, or a regexp (e.g: ".\*")
- callback: Function that takes 2 arguments. Should return a Promise.
  - client: Botmatic integration token or your custom client (JSON object) returned by your custom auth function.
  - data: JSON received from Botmatic.

```javascript
const botmatic = require('@botmatic/js-integration')()

botmatic.onEvent(botmatic.events.CONTACT_UPDATED, function({client, data}) {
  return new Promise((resolve, reject) => {
    resolve({data: "ok", type: "data"});
  })
})
```

Events list:

| Event name | Description |
| ----------- | --------------- |
| CONTACT_CREATED | A contact is created on Botmatic |
| CONTACT_UPDATED | A contact is updated on Botmatic |
| CONTACT_DELETED | A contact is deleted on Botmatic |
| USER_REPLY | A user has just spoke on Botmatic |
| BOT_REPLY | A bot has just replied to a user on Botmatic|

### Debug

Enable debug traces by starting your application with:
```bash
DEBUG=botmatic* node index.js
```

More information about Botmatic.ai integrations [here](https://botmatic.zendesk.com/hc/en-us/articles/115004171313-Get-started-with-custom-integrations)
