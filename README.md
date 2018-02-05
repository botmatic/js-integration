# Create your Botmatic integration

[Botmatic.ai](https://botmatic.ai) is a keyboard first experience where you design your chatbot by writing a conversation.
You can create your own integration to listen Botmatic events and actions.

## Install

```shell
npm install --save @botmatic/js-integration
```

## Create a .env file

Create a file named .env to put environment variables with:
```
BOTMATIC_TOKEN=<your_botmatic_integration_token>
BOTMATIC_PORT=<your_express_server_port>
```

## Usage

### Execute action

On Botmatic chatbot editor, you can call custom action.
Here you can define your action with:

```javascript
const botmatic = require('@botmatic/js-integration')

// You can use regexp for action name.
botmatic.onAction("my_action", function(data) {
  return new Promise((resolve, reject) => {
    resolve({data: {test: "data to return"}, type: "data"});
  })
})
```

### Listen event
```javascript
const botmatic = require('@botmatic/js-integration')

// You can use regexp for event name.
botmatic.onEvent("contact_created", function(data) {
  return new Promise((resolve, reject) => {
    resolve({data: {test: "ok"}, type: "data"});
  })
})
```

More information about Botmatic integration [here](https://botmatic.zendesk.com/hc/en-us/articles/115004171313-Get-started-with-custom-integrations)
