const {logger, ArrayUtils} = require('../utils')

const {getRepos, getBranches, getPulls, deleteBranch, getTeam, getTeamMembers} = require('../common/api')
const {getEmailOfUser} = require('../common/helper')
const {groupByProd} = require("../config/groups");

const IGNORED_BRANCHES = ['master', 'develop']
const IGNORED_MERGED_BRANCHES = ['rb-', 'hf-', 'release']

/**
 * Deletion of old branches
 * action : Cron
 *
 * @param token
 * @param group
 * @returns {Promise<string>}
 */
const deleteStableBranch = async ({token, group}) => {
  const bundles = group || groupByProd

  logger.info('bundles : ', bundles)

  let str = '⚠️ 다음의 오래된 브랜치는 삭제됩니다. \r\n'
  for (const bundle of bundles) {
    const {owner, repo} = bundle
    const fullName = `${owner}/${repo}`
    str += `\r\n 🔥 ## Repo : ${fullName}`

    const { body: existingBranches }  = await getBranches(token, owner, repo, {protected: false, per_page: 100})
    const allBranches = new Set()
    existingBranches.forEach((branch) => {
      allBranches.add(branch.name)
    })

    const delBranches = await _delBranches(token, owner, repo, allBranches)

    for (const branch of delBranches) {
      const statusCode = await deleteBranch(token, fullName, branch)
      if (statusCode === 204) {
        logger.info(`stale branch : ${branch} is deleted.`)
        str += `\r\n  * ${branch}`
      }
    }
    if (delBranches.size === 0) {
      str += '\r\n  * 삭제할 브랜치가 존재하지 않습니다.'
    }
  }
  return str
}

const _delBranches = async (token, owner, repo, allBranches) => {
  const delBranches = new Set()
  const { body : closedPulls } = await getPulls(token, owner, repo, {state: 'closed', per_page: 100})
  closedPulls.forEach(({head: {ref: branch}}) => {
    if (IGNORED_BRANCHES.includes(branch) && allBranches.has(branch)) {
      delBranches.add(branch)
    }
  })
  const { body : openPulls } = await getPulls(token, owner, repo, {state: 'open', per_page: 100})
  openPulls.forEach(({head: {ref: branch}}) => {
    if (delBranches.has(branch)) {
      delBranches.delete(branch)
    }
  })
  return delBranches
}

/**
 * Branch deletion processing at merge time
 * action : Trigger
 *
 * @param token
 * @param action
 * @param pull_request
 * @param repository
 * @param ignoredMergedBranches
 * @param ignoredRules
 * @returns {Promise<{result: string}>}
 */
const deleteMergedBranch = async ({
  token,
  action,
  pull_request,
  repository,
  ignoredMergedBranches = IGNORED_MERGED_BRANCHES,
  ignoredRules = [],
}) => {
  const {merged_at, head: {ref: branchName}, base: { ref: targetBranch}} = pull_request
  const {full_name} = repository

  const isIgnore = IGNORED_BRANCHES.includes(branchName) || ignoredMergedBranches.some(br => branchName.includes(br))
  const isIgnoreByRules = ignoredRules.some((rule) => {
    const { branch, ignoreTarget } = rule
    return branch.some(ele => branchName.includes(ele)) && ignoreTarget.includes(targetBranch)
  })

  if (action !== 'closed' || !merged_at || isIgnore || isIgnoreByRules) {
    logger.info(`${full_name} : The branch is not subject to deletion.`)
    return {result: 'FAILED:: Not the target.'}
  }

  const {statusCode} = await _deleteBranch(token, full_name, branchName)
  return {result: `SUCCESS::${statusCode}`}
}

/**
 * Check and notify if a specific branch has not been merged
 * action : cron
 *
 * @param token
 * @param org
 * @param filter
 * @param teams
 * @returns {Promise<{result: string}>}
 */
const checkMergedBranch = async ({ token, org ='', filter = ['hf-', 'rb-'], teams = [''] }) => {
  logger.info(`Organization: ${org}`)
  logger.info(`filter: ${filter}`)

  const {body: repos = {}} = await getRepos(token, org, { per_page: 100})
  const repoNames = repos && repos.map(r => r.name) || []

  let text = ''
  if (ArrayUtils.gt(repoNames)) {
    for (const repo of repoNames) {
      const {body: existingBranches = []} = await getBranches(token, org, repo, {protected: false, per_page: 100})
      const data = existingBranches.map((branch) => branch.name).filter((name) => filter.some(f => name.includes(f)))
      if (ArrayUtils.isNotEmpty(data)) {
        logger.info(`[${repo}] Not yet merged : ${data.join(',')}`)
        text += ` \r\n- [${repo}]: ${data.join(' , ')}`
      }
    }
  }
  if (text === '') {
    return { result : 'PASSED'}
  }
  text = `⚠️ 다음 Repo 의 [${filter.join(' , ')}] 로 만들어진 Branch 가 머지 되질 않았을 수도 있습니다. 담당자는 확인 후 삭제 해주세요! \r\n${text}`

  for (const team of teams) {
    const accountIds = await _parsedTeamMember(token, org, team)
    //TODO. 결과를 직접 구현해주세요.
    const result = ''
    logger.info(`team send result: ${result}`)
  }
  return { result : 'Success' }
}


const _deleteBranch = async (token, full_name, branchName) => {
  const {statusCode} = await deleteBranch(token, full_name, branchName)
  return statusCode
}

const _parsedTeamMember = async (token, org, teamName) => {
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
  return members.map(({ldap_dn}) => getEmailOfUser(ldap_dn))
}

module.exports = {
  deleteStableBranch,
  deleteMergedBranch,
  checkMergedBranch,
}



