const request = require('request')

const headers = (token) => ({'Content-Type': 'application/json', Authorization: `Bearer ${token}`,})

const rp = (options) =>
  new Promise(((resolve, reject) => {
    request(options, (error, response, responseBody) => {
      if (error) {
        reject({response, error,})
      } else {
        const {statusCode} = response
        const body = typeof responseBody === 'object' || responseBody === '' ? responseBody : JSON.parse(responseBody)
        if (statusCode >= 400) {
          reject({statusCode, body})
        } else {
          resolve({statusCode, body})
        }
      }
    })
  }))

module.exports = {
  rp,
  headers,
}
