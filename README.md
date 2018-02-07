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
| ----------- | --------------- |
| port        | Integer |(optionnal) Server express port          |
| server      | express server|(optionnal) Existing express server |
| token      | String | (optionnal) Botmatic integration token. If not set, the integration will accept all requests. |

### Execute action

On Botmatic chatbot editor, you can call custom action.
Here you can define your action with:

```javascript
const botmatic = require('@botmatic/js-integration')()

// You can use regexp for action name.
botmatic.onAction("my_action", function(data) {
  return new Promise((resolve, reject) => {
    resolve({data: {test: "data to return"}, type: "data"});
  })
})
```

### Listen event
```javascript
const botmatic = require('@botmatic/js-integration')()

// You can use regexp for event name.
botmatic.onEvent(botmatic.events.CONTACT_UPDATED, function(data) {
  return new Promise((resolve, reject) => {
    resolve({data: "ok", type: "data"});
  })
})
```

More information about Botmatic integration [here](https://botmatic.zendesk.com/hc/en-us/articles/115004171313-Get-started-with-custom-integrations)
