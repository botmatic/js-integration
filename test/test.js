var assert = require('assert');
var request = require('request');
var chai = require('chai');
var expect = chai.expect;
require('dotenv').config();

var nock = require('./nock');

// const app = require('express')()
// const port = 7845
// const expressHandler = app.listen(port)
var fp = require("find-free-port")

const getExpress = () => {
  return new Promise((resolve) => {
    fp(3000, function(err, freePort){
      const app = require('express')()
      const expressHandler = app.listen(freePort)
      resolve({appServer: app, appExpressHandler: expressHandler, port: freePort})
    });
  })
}

const getBotmatic = (params) => require('../src/index')(params)

describe('botmatic', function() {
  nock.setup.validatetoken();

  describe('#test-botmatic-params', function() {

    it('should return status code 200 when the token is not present', function(done) {
      getExpress()
      .then(({appServer, appExpressHandler, port}) => {
        const botmatic = require('../src/index')({
          server: appServer
        });

        request.post({
          url: "http://localhost:"+port,
          json: { event: "my event", data: {username: 'me', password: '123'} },
          type: 'JSON'
        }, (err, httpResponse, body) => {
          assert.equal(httpResponse.statusCode, 200)
          appExpressHandler.close();
          done()
        })
      })
    })

    it('should return status code 403 when no data present', function(done) {
      getExpress()
      .then(({appServer, appExpressHandler, port}) => {
        const botmatic = require('../src/index')({
          server: appServer
        });

        request.post({
          url: "http://localhost:"+port,
          type: 'JSON'
        }, (err, httpResponse, body) => {
          appExpressHandler.close();
          assert.equal(httpResponse.statusCode, 403)
          done()
        })
      });
    });

    it('should return auth object with client when event is received', function() {
      return new Promise((resolve, reject) => {
        getExpress()
        .then(({appServer, appExpressHandler, port}) => {
          const userAuthenticated = {name: "my name"};
          const token = "mytoken";

          const botmaticWithAuth = require('../src/index')({
            server: appServer,
            auth: (token) => {
              return Promise.resolve(userAuthenticated)
            }
          });

          botmaticWithAuth.onEvent(".*", function({auth, data}) {
            appExpressHandler.close();

            if (Object.compare(userAuthenticated, auth.client)) {
              resolve()
            } else {
              reject(new Error('Auth client received different than user authenticated generated in auth function'))
            }

            return Promise.resolve({data: {key: "value"}, type: "data"});
          })

          request.post({
            url: "http://localhost:"+port,
            type: 'JSON',
            headers: {'Authorization': 'Bearer ' + token},
            json: { event: "my event", data: {"my event": {username: 'me', password: '123'}}},
          })
        });
      })
    });

    it('should return auth with token when event is received', function() {
      return new Promise((resolve, reject) => {
        getExpress()
        .then(({appServer, appExpressHandler, port}) => {
          const token = "mytoken";

          const botmaticWithAuth = require('../src/index')({
            server: appServer
          });

          botmaticWithAuth.onEvent(".*", function({auth, data}) {
            appExpressHandler.close();

            if (token === auth.token) {
              resolve()
            } else {
              reject(new Error('Auth token received different from the one sent'))
            }

            return Promise.resolve({data: {key: "value"}, type: "data"});
          })

          request.post({
            url: "http://localhost:"+port,
            type: 'JSON',
            headers: {'Authorization': 'Bearer ' + token},
            json: { event: "my event", data: {"my event": {username: 'me', password: '123'}}},
          })
        });
      })
    });
  })
});

describe('#test-header-token-on-install-event', function() {
  it('should received install event when event it is fired with good validated token', function() {
    return new Promise((resolve, reject) => {
      getExpress()
      .then(({appServer, appExpressHandler, port}) => {
        const token = "goodtoken";

        const botmaticWithAuth = require('../src/index')({
          server: appServer
        });

        botmaticWithAuth.onEvent("install", function({auth, data}) {
          appExpressHandler.close();

          if (token == auth.token) {
            resolve()
          } else {
            reject(new Error(`Token received different than sent: ${token} != ${auth.token}`))
          }

          return Promise.resolve({data: {key: "value"}, type: "data"});
        })

        request.post({
          url: "http://localhost:"+port,
          type: 'JSON',
          headers: {'Authorization': 'Bearer ' + token},
          json: { event: "install", data: {"my event": {username: 'me', password: '123'}}},
        })

        setTimeout(function() {
          appExpressHandler.close();
          reject(new Error(`No event install received`))
        }, 1000)
      });
    })
  });


  it('should not receive install event when event install is fired with bad integration token', function() {
    return new Promise((resolve, reject) => {
      getExpress()
      .then(({appServer, appExpressHandler, port}) => {
        const token = "badtoken";

        const botmaticWithAuth = require('../src/index')({
          server: appServer
        });

        botmaticWithAuth.onEvent("install", function({auth, data}) {
          appExpressHandler.close();

          reject(new Error(`Musn't received install event with bad token`))

          return Promise.resolve({data: {key: "value"}, type: "data"});
        })

        request.post({
          url: "http://localhost:"+port,
          type: 'JSON',
          headers: {'Authorization': 'Bearer ' + token},
          json: { event: "install", data: {"my event": {username: 'me', password: '123'}}},
        })

        setTimeout(function() {
          appExpressHandler.close();
          resolve()
        }, 1000)
      });
    })
  });

})


Object.compare = function (obj1, obj2) {
	//Loop through properties in object 1
	for (var p in obj1) {
		//Check property exists on both objects
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

		switch (typeof (obj1[p])) {
			//Deep compare objects
			case 'object':
				if (!Object.compare(obj1[p], obj2[p])) return false;
				break;
			//Compare function code
			case 'function':
				if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
				break;
			//Compare values
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}

	//Check object 2 for any extra properties
	for (var p in obj2) {
		if (typeof (obj1[p]) == 'undefined') return false;
	}
	return true;
};
