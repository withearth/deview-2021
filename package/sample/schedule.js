const {groupByProdForWeeklyIssue} = require('../config/groups')

const {logger, ArrayUtils, CollectionUtils, DateUtils} = require('../../utils')

const {getRepos, getIssues} = require('../common/api')
const {getTeam, getTeamMembers} = require('../common/api')
const {postIssue, postIssueComment} = require('../common/api')
const {getNameOfUserId} = require('../common/helper')

/**
 *
 * action: cron
 *
 * @param token
 * @param org
 * @param userName
 * @param group
 * @returns {Promise<{result: string}>}
 */
const openWeeklyIssue = async ({token, org = '', group, alias}) => {
  const bundles = group || groupByProdForWeeklyIssue

  logger.info(`Organization: ${org},  bundles: ${bundles}`)

  const {body: repos = {}} = await getRepos(token, org, { per_page: 100})
  const repoNames = repos && repos.map(r => r.name) || []

  let storeMap = new Map()

  if (ArrayUtils.gt(repoNames)) {
    for (const repo of repoNames) {
      const {body: reactiveIssue} = await getIssues(token, org, repo, {state: 'all', per_page: 100})
      const dataMap = reactiveIssue
        .filter(({created_at, updated_at}) => DateUtils.betweenWeekAgoDays(created_at) || DateUtils.betweenWeekAgoDays(updated_at))
        .reduce((acc, elm) => {
          const {assignees, user, title, html_url} = elm
          const emailIds =  [...new Set([...assignees.map(as => as.login), user.login]) ]
          emailIds.forEach((id) => {
            acc.set(id, [{repo, title, html_url}, ...(acc.get(id) || [])])
          })
          return acc
        }, new Map())
      storeMap = CollectionUtils.mergeMap(storeMap, dataMap)
    }
  }

  if (storeMap.size === 0) {
    return { result: 'FAILED:: There are no jobs.' }
  }

  const teamMemberMap = new Map()

  const {body: teamRes} = await getTeam(token, org)
  for (const team of teamRes) {
    const {slug, id} = team
    const target = bundles.find(data => data.team.includes(slug))
    if (target) {
      const {body: members} = await getTeamMembers(token, id)
      teamMemberMap.set(slug, {
        members: members.map(m => m.login),
        repoToWrite: target.repoToWrite
      })
    }
  }

  const personalMap = new Map()

  for (const [key, value] of storeMap) {
    const name = await getNameOfUserId(token, key)
    if (name !== null && name !== undefined) {
      personalMap.set(key, _createUserTaskList(key, name, value))
    }
  }

  for (const [key, value] of teamMemberMap) {
    logger.info('key : ', key)
    const repo = value.repoToWrite
    const information = {
      'title': `📝 주간 업무 공유 ${DateUtils.weeklyTitle()} (${alias})`,
      'body': `> 주간 업무 공유 ${DateUtils.weeklyTitle()} 입니다. 진행한 내용 확인 부탁드립니다.\r\n\r\n` +
        `* ${DateUtils.weekAgoWorkTitle()} 한 주간 등록된 이슈의 **author**(작성자), **assigness**(담당자) 기준으로 집계 됩니다.\r\n`,
      'labels' : ['🗓 Weekly Report']
    }

    const issueRes = await postIssue(token, org, repo, information)
    const { statusCode, body: { number : issue_number } } = issueRes
    if (statusCode !== 201) {
      logger.info(`repo : [${org}/${repo}] - Failed here. Please check.`)
    }

    const tasks = value.members.map(v => personalMap.get(v))
    for (const task of tasks.filter(ele => ele))  {
      try {
        const { statusCode }  = await postIssueComment(token, org, repo, issue_number, {"body": task })
        if (statusCode !== 201) {
          logger.info(`comment : ${task}`)
        }
      } catch (e) {
        logger.error(e)
      }}

  }
  return { result: `${personalMap.size}` }
}

const _createUserTaskList = (id, name, tasks)  => {
  let str = `## ${name} <@${id}> 님의 금주 작업입니다. \r\n`
  const task = CollectionUtils.groupByKey(tasks, 'repo')
  for (const [key, value] of Object.entries(task)) {
    str += ` ### ${key} \r\n`
    value.forEach((issue) => {
      const {title, html_url} = issue
      str += `* [${title}](${html_url}) \r\n\r\n`
    })
  }
  return str
}

module.exports = {
  openWeeklyIssue,
}
