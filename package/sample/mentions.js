const {logger, ArrayUtils} = require('../utils')

const {getTeam, getTeamMembers} = require('../common/api')
const {getNameOfUserId, getEmailOfUserId, getEmailOfUser} = require('../common/helper')

const CREATED = 'created'
const OPENED = 'opened'
const INCLUDE_ACTION = [CREATED, OPENED]

const regexp = /([@]\S+)/g
const regexpHG = /[ㄱ-ㅎ가-힣]/g

/**
 * You will be notified if you are mentioned in git.
 * action : trigger
 *
 * @param token
 * @param action
 * @param org
 * @param issue
 * @param comment
 * @param pull_request
 * @returns {Promise<{result: string}>}
 */
const mention = async ({token, action, organization: {login: org}, issue, comment, pull_request}) => {
  if (!INCLUDE_ACTION.includes(action)) {
    return {result: 'FAILED:: This action is not created.'}
  }

  const title = _getTitle(issue, pull_request)
  const data = _parsedPayload(action, issue, comment)

  const {htmlUrl, body, writer} = data
  const mentions = body.replace(regexpHG, '').match(regexp)

  if (ArrayUtils.isEmpty(mentions)) {
    return {result: 'FAILED:: Not mentioned in this issue.'}
  }
  const writerName = await getNameOfUserId(token, writer)

  let sentList = new Set()
  const members = new Set()
  const teams = new Set()

  for (const mention of mentions) {
    if (mention.includes(`@${org}/`)) {
      const teamName = mention.substr(mention.indexOf('/') + 1)
      teams.add(teamName)
      continue
    }
    members.add(mention.replace('@', ''))
  }

  logger.info(`members : ${members.toString()}`)
  logger.info(`teams : ${teams.toString()}`)

  if (members.size > 0) {
    for (const member of members) {
      const emailId = await getEmailOfUserId(token, member)
      //TODO. 결과를 직접 구현해주세요.
      const result = ''
      logger.info(`personal send result: ${result}`)
      sentList.add(emailId)
    }
  }

  if (teams.size > 0) {
    for (const team of teams) {
      const teamMembers = await _parsedTeamMember(token, org, team, writer)
      const accountIds = teamMembers
        .filter(teamMember => !sentList.has(teamMember))
      //TODO. 결과를 직접 구현해주세요.
      const result = ''
      logger.info(`team send result: ${result}`)
      sentList = new Set([...sentList, ...accountIds])
    }
  }

  return {result: `${sentList}`}
}

const _getTitle = (issue, pull_request) => {
  if (issue) return issue.title
  if (pull_request) return pull_request.title
  return 'empty title'
}

const _parsedPayload = (action, issue, comment) => {
  const data = action === CREATED ? comment : issue
  const {html_url, body, user} = data
  return {
    htmlUrl: html_url,
    body: body,
    writer: user.login,
  }
}

const _parsedTeamMember = async (token, org, teamName, writer) => {
  let teamId
  const {body: teamRes} = await getTeam(token, org)
  for (const team of teamRes) {
    const {slug, id} = team
    if (slug === teamName) {
      teamId = id
      break
    }
  }
  const {body: members} = await getTeamMembers(token, teamId)
  return members.filter(member => member.login !== writer).map(({ldap_dn}) => getEmailOfUser(ldap_dn))
}

module.exports = {
  mention
}
