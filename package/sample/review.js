const {logger, ArrayUtils} = require('../utils')
const {sendMessage} = require('../common/owAction')
const {getRequest, getTeamMembers} = require('../common/api')
const {getNameOfUserId, getEmailOfUserId, getEmailOfUser} = require('../common/helper')

const REQUESTED = 'review_requested'
const SUBMITTED = 'submitted'
const APPROVED = 'approved'

/**
 * You will be notified if you are review requested in git.
 * action : trigger
 *
 * @param token
 * @param action
 * @param login
 * @param pull_request
 * @param requested_reviewer
 * @param requested_team
 * @returns {Promise<{result: string}>}
 */
const reviewRequested = async ({token, action, sender: {login}, pull_request, requested_reviewer, requested_team}) => {
  if (action !== REQUESTED) {
    return {result: 'FAILED: This action is not requested.'}
  }

  const {title, html_url} = pull_request
  const writerName = await getNameOfUserId(token, login)

  if (requested_reviewer) {
    const {ldap_dn} = requested_reviewer
    const emailId = getEmailOfUser(ldap_dn)
    //TODO. 결과를 직접 구현해주세요.
    const result = ''
    logger.info(`personal send result: ${result}`)
  }

  if (requested_team) {
    const {requested_reviewers} = pull_request
    const {body: members} = await getTeamMembers(token, requested_team.id)

    let accountIds = ArrayUtils.isEmpty(requested_reviewers) ? members :
      members.filter(member => requested_reviewers.some(rr => rr.login !== member.login))
    accountIds = accountIds
      .filter(member => member.login !== login)
      .map(member => getEmailOfUser(member.ldap_dn))
    //TODO. 결과를 직접 구현해주세요.
    const result = ''
    logger.info(`teams send result: ${result}`)
  }
  return {result: 'SUCCESS'}
}

/**
 * Notifies you that a review has been approved.
 * action : trigger
 *
 * @param token
 * @param action
 * @param review
 * @param pull_request
 * @returns {Promise<{result: string}|{text: string}>}
 */
const reviewApproved = async ({ token, action, review, pull_request }) => {
  const { state, html_url : htmlUrl, user: { login: sender} } = review
  const { url, title, head : {repo: { name: repoName }}, user: { login: member} } = pull_request

  if (action !== SUBMITTED) {
    return {result: 'FAILED: This action is not submitted.'}
  }
  if (state !== APPROVED) {
    return { result: 'FAILED: This review state does not approved.' }
  }

  let mainTitle = '👌🏽PR 이 승인되었습니다!'
  if (url) {
    const {body: response } =  await getRequest(token, url)
    if (response && response.mergeable && response.mergeable_state === 'clean') {
      mainTitle = `👌🏽 Merge 가 가능합니다.!`
    }
  }

  const senderName = await getNameOfUserId(token, sender)
  const emailId = await getEmailOfUserId(token, member)

  //TODO. 결과를 직접 구현해주세요.
  const result = ''

  logger.info(`teams send result: ${result}`)
  return {result: 'SUCCESS'}
}


module.exports = {
  reviewRequested,
  reviewApproved,
}
