const {groupByProd} = require('../config/groups')
const {logger, DateUtils} = require('../utils')

const {sendMessage} = require('../common/owAction')
const {postMilestone, getMilestones, patchMilestone, getIssues} = require('../common/api')
const {getEmailOfUser} = require('../common/helper')

/**
 * Open
 * action : cron
 *
 * @param token
 * @param group
 * @returns {Promise<{result : string}>}
 */
const openMilestone = async ({token, group}) => {
  const deployDate = DateUtils.addDays(7)
  const bundles = group || groupByProd

  const information = {
    'title': `${deployDate.format('YY.M.D')} 정기배포`,
    'due_on': `${deployDate.format('Y-M-D')}T23:59:59Z`,
    'state': 'open',
  }
  logger.info('bundles : ', bundles)

  for (const bundle of bundles) {
    const {owner, repo, alias} = bundle
    information['description'] = `${alias} 정기배포`
    const {statusCode} = await postMilestone(token, owner, repo, information)
    if (statusCode !== 201) {
      logger.info(`repo : [${owner}/${repo}] - Failed here. Please check.`)
    }
  }
  return {result: `SUCCESS`}
}

/**
 * Closed
 *
 * @Type cron
 *
 * @param token
 * @param group
 * @returns {Promise<{ result: string }>}
 */
const closeMilestone = async ({token, group}) => {
  const bundles = group || groupByProd

  logger.info('bundles : ', bundles)

  for (const bundle of bundles) {
    const closedDate = DateUtils.addDays(8)
    const {owner, repo} = bundle
    const {body: milestones} = await getMilestones(token, owner, repo, {state: 'open'})

    for (const milestone of milestones) {
      const {number, due_on, open_issues} = milestone

      if (DateUtils.moment(due_on).isBefore(closedDate)) {
        if (open_issues !== 0) {
          const {body: issues} = await getIssues(token, owner, repo, {milestone: number})
          const checkToMembers = issues.reduce((acc, ele) => {
            const {user: {ldap_dn}, html_url} = ele
            const emailOfUser = getEmailOfUser(ldap_dn)
            acc.set(emailOfUser, [...(acc.get(emailOfUser) || []), ` - ${html_url}`] || [])
            return acc
          }, new Map())

          for (const [key, value] of checkToMembers) {
            let str = `* 아래 이슈들의 마일스톤이 종료되었습니다. (이슈를 닫거나 마일스톤 변경 부탁드립니다.)\r\n` + value.join(`\r\n`)
            const res = await sendMessage({content: {type: 'text', text: str}, accountIds: [key]})
            logger.info(`to ${key} : ${str} \r\n result: ${res}`)
          }
        } else {
          const {statusCode} = await patchMilestone(token, owner, repo, number, {state: 'closed'})
          logger.info(`close milestone : ${number} statusCode :${statusCode}`)
        }
      }
    }
  }
  return {result: `SUCCESS`}
}


module.exports = {
  openMilestone,
  closeMilestone,
}
