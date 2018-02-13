const nock = require('nock')

module.exports = {
  setup: {
    validatetoken: () => {
      nock(process.env.BOTMATIC_BASE_URL)
        .post('/api/integrationtokens/validate')
        // .reply(200, {success: true})
        .reply((url, body) => {
          if (body == "token=goodtoken") {
            return [200, {success: true}]
          } else {
            return [401, {success: false}]
          }
        })
    }
  }
}