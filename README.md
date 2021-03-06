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
      resolve(client_authenticated)
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


## Settings page

You can define a settings page, that will be displayed on Botmatic integration form.
It used to save your own specific fields to a specific integration token.
Usefull when your integration is used by many clients, to differentiate calls by integration token.

### Define your settings route

Please define the route to access to your form.
You have the token in parameter, to retrieve some data for modification.

The example uses Mustache for templating.
It helps to put data in the HTML template.

```javascript
botmatic.onSettingsPage("/settingspath", async (token) => {
  // Move in global to do it once.
  // Just here for testing
  const Mustache = require('mustache')
  const fs = require('fs')
  const resBuf = fs.readFileSync(__dirname + '/views/fields.html');
  const resStr = resBuf.toString('utf8')

  var tpl = Mustache.render(resStr, {name: "My name", value: "My value"});
  return Promise.resolve(tpl)
})
```

### Define your form views/fields.html

Please return this HTML structure to be friendly with Botmatic design.

```html
<div class="field is-horizontal">
    <div class="field-label is-normal">
        <label class="label">My iframe field</label>
    </div>
    <div class="field-body">
        <div class="field">
            <div class="control">
                <input name="{{name}}" placeholder="my placeholder" class="input" value="{{value}}">
            </div>
            <p class="help">My help.</p>
        </div>
    </div>
</div>
...
```

### Define your success form validation

After create the route and template, you can catch the form validation to save data where you want.
Botmatic form submit will interrupted if you return success to false, because of some many required missing fields.


```javascript
botmatic.onUpdateSettings('/settingspath', function(token, data) {
  // Validate data
  // Store them
  // Resolve sucess to true or false
  return Promise.resolve({success: true})
})
```

### Define your form validation with error
If you have an error, you can resolve with success to false, and errorFields that contains name of input, withj the error to display.


```javascript
botmatic.onUpdateSettings('/settingspath', function(token, data) {
  resolve({
    success: false,
    errorFields: {
      api_key: "Field required"
    }
  })
})
```

### Add file inputs
To parse file input, you have to add the parser multer, as:

```javascript
let multer = require('multer');
let upload = multer();
app.use(upload.any());
```

After that, you will be able to parse the files:

```javascript
botmatic.onUpdateSettings('/settingspath', function(token, data) {
  console.log(data.files)
  ...
})
```

## Debug

Enable debug traces by starting your application with:
```bash
DEBUG=botmatic* node index.js
```

More information about Botmatic.ai integrations [here](https://botmatic.zendesk.com/hc/en-us/articles/115004171313-Get-started-with-custom-integrations)
