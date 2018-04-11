const url = require('url')
const fetch = require('node-fetch')
const { send } = require('micro')
const parseUrlEncoded = require('urlencoded-body-parser')

function sendMessage(url, message) {
  const body = typeof message === 'string' ? { text: message } : message
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

module.exports = async (req, res) => {
  const { text, response_url } = await parseUrlEncoded(req)
  if (!text) {
    return send(res, 200, 'Bad request, you need to pass song name')
  }
  send(res, 200)

  const response = await fetch(`https://chordify.now.sh/${encodeURIComponent(text)}`)
  const content = await response.json()
  if (response.status < 200 || response.status >= 300) {
    sendMessage(response_url, content.message)
    return
  }

  const { name, artist, key, capo, tuning, chart } = content
  let result = `_*${artist} - ${name}*_\n`
  if (tuning) result += `*Tuning:* ${tuning.value}\n`
  if (capo) result += `*Capo:* ${capo}\n`
  if (key) result += `*Key:* ${key}\n`
  result += '\n```'
  result += chart
    .replace(/\r/g, '')
    .replace(/(\n)+/g, '\n')
    .replace(/\[ch\]/g, '')
    .replace(/\[\/ch\]/g, '')
  result += '```'
  sendMessage(response_url, { mrkdwn: true, text: result })
}
