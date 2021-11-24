const {logger, ArrayUtils} = require('../../utils')

const {getRepos, getPulls, getTeam, getTeamMembers} = require('../common/api')

const encourageReview = async ({
  token,
  org = '',
  group = []
}) => {
  logger.info(`Organization: ${org},  group: ${group}`)

  const {body: repos = {}} = await getRepos(token, org, {per_page: 100})
  const repoNames = repos && repos.map(r => r.name) || []

  const teamMemberMap = new Map()
  const {body: teamRes} = await getTeam(token, org)
  for (const team of teamRes) {
    const {slug, id} = team
    const target = group.find(data => data === slug)
    if (target) {
      const {body: members} = await getTeamMembers(token, id)
      teamMemberMap.set(slug, members.map(m => ({
        user: m.login,
        ldap_dn: m.ldap_dn,
      })))
    }
  }

  if (ArrayUtils.isNotEmpty(repoNames)) {
    for (const repo of repoNames) {
      logger.info(`repo : ${repo}`)

      const pullsMap = new Map()
      const {body: openPulls} = await getPulls(token, org, repo, {state: 'open', per_page: 100})
      const pulls = openPulls
        .filter(pr => !pr.draft)
        .map(pr => ({
          number: pr.number,
          user: pr.user.login,
          url: pr.html_url,
          title: pr.title,
        }))
      for (const [key, value] of teamMemberMap) {
        const data = pulls.filter(pr => value.map(v => v.user).includes(pr.user))
        pullsMap.set(key, data)
      }

      for (const part of group) {
        const members = teamMemberMap.get(part)
        const pullRequests = pullsMap.get(part)

        if (ArrayUtils.isNotEmpty(pullRequests)) {
          //TODO. 결과를 직접 구현해주세요.
        }
      }
    }
  }
}


module.exports = {
  encourageReview
}
