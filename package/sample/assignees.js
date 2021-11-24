const {getNameOfUserId, getEmailOfUserId } = require('../common/helper')

const ASSIGNED = 'assigned'
const INCLUDE_ACTION = [ASSIGNED]

/**
 *  You will be assign if you are mentioned in git.
 * action : trigger
 *
 * @param token
 * @param action
 * @param issue
 * @param pull_request
 * @param assignee
 * @param sender
 * @returns {Promise<{result: string}>}
 */
const assign = async ({ token, action, issue, pull_request, assignee, sender }) => {
  if (!INCLUDE_ACTION.includes(action)) {
    return {result: 'FAILED:: This action is not assigned.'}
  }

  const target = assignee.login
  const designator = sender.login
  const data = _getInformationToSend(issue, pull_request)

  const { title, writer, htmlUrl } = data

  if (writer === target) {
    return {result: 'FAILED:: This action is mined.'}
  }

  const [ writerName, assigneeName, senderName ] = await Promise.all([
    getNameOfUserId(token, writer),
    getEmailOfUserId(token, target),
    getNameOfUserId(token, designator),
  ])


  if (target !== designator) {
    //TODO. 결과를 직접 구현해주세요.
    const result = ''
    return { result: `${result.toString()}` }
  }
  return { result: 'Not Send'}
}

const _getInformationToSend = (issue, pull_request) => {
  const data = issue ? issue : pull_request
  const { title, user: { login : writer }, html_url } = data
  return { title, writer, htmlUrl: html_url }
}

module.exports = {
  assign
}
