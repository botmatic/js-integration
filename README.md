# Create your Botmatic integration

[Botmatic.ai](https://botmatic.ai) is a keyboard first experience where you design your chatbot by writing a conversation.
You can create your own integration to listen Botmatic events and actions.

## Install

```shell
npm install --save @botmatic/js-integration
```

## Usage

### Require botmatic
You have to require Botmatic integration. It's a function taking an optional parameter:

```javascript
const botmatic = require('@botmatic/js-integration')(params)
```

params is a JSON object with fields:

| Field name | Type | Description            |
| ----------- | --------------- | ----------- |
| port        | Integer |(optional) Server express port (3000 by default) |
| path        | String | (optional) Path events will be sent to ("/" by default |
| server      | express server|(optional) Existing express server |
| token      | String | (optional) Botmatic integration token. If not set, the integration will accept all requests. |

### Execute actions

In the Botmatic chatbot editor, you can call custom actions.
Here you can define your action's behaviour with:

```javascript
const botmatic = require('@botmatic/js-integration')()
 
// You can use regexp for action name.
botmatic.onAction("my_action", function(data) {
  return new Promise((resolve, reject) => {
    resolve({data: {test: "data to return"}, type: "data"});
  })
})
```

### Listen to events
```javascript
const botmatic = require('@botmatic/js-integration')()
 
// You can use regexp for event name, or the constants in botmatic.events
botmatic.onEvent(botmatic.events.CONTACT_UPDATED, function(data) {
  return new Promise((resolve, reject) => {
    resolve({data: "ok", type: "data"});
  })
})
```

### Debug

To have debug traces, you can start your application with debug variable:
```bash
DEBUG=botmatic* node index.js
```

More information about Botmatic integration [here](https://botmatic.zendesk.com/hc/en-us/articles/115004171313-Get-started-with-custom-integrations)
