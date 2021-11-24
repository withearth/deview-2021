const {rp: {rp, headers}} = require("../utils")

// 사용하시는 URL을 입력하세요. 
const defaultUrl = ''

/**
 *
 * @param token
 * @param url
 * @returns {Promise<unknown>}
 */
const getRequest = async ( token, url ) =>
  await rp({
    method: 'GET',
    url: url,
    headers: headers(token),
  })

/**
 *
 * @param token
 * @param user
 * @returns {Promise<{statusCode, body}>}
 */
const getUser = async (token, user) =>
  await rp({
    method: 'GET',
    url: `${defaultUrl}/users/${user}`,
    headers: headers(token),
  })

/**
 *
 * https://developer.github.com/v3/pulls/#list-pull-requests
 *
 * @param token
 * @param owner
 * @param repo
 * @param qs
 * @returns {Promise<{statusCode, body}>}
 */
const getPulls = async (token, owner, repo, qs) =>
  await rp(({
    method: 'GET',
    url: `${defaultUrl}/repos/${owner}/${repo}/pulls`,
    qs: qs,
    headers: headers(token),
  }))

/**
 *
 * https://developer.github.com/v3/repos/branches/#list-branches
 *
 * @param token
 * @param owner
 * @param repo
 * @param qs
 * @returns {Promise<{statusCode, body}>}
 */
const getBranches = async (token, owner, repo, qs) =>
  await rp({
    method: 'GET',
    url: `${defaultUrl}/repos/${owner}/${repo}/branches`,
    qs: qs,
    headers: headers(token),
  })

/**
 *
 * @param token
 * @param fullName
 * @param branchName
 * @returns {Promise<{statusCode, body}>}
 */
const deleteBranch = async (token, fullName, branchName) =>
  await rp({
    method: 'DELETE',
    url: `${defaultUrl}/repos/${fullName}/git/refs/heads/${branchName}`,
    headers: headers(token),
  })

/**
 * https://developer.github.com/v3/repos/#list-organization-repositories
 * @param token
 * @param org
 * @param qs
 * @returns {Promise<{statusCode, body}>}
 */
const getRepos = async (token, org, qs) =>
  await rp({
    method: 'GET',
    url: `${defaultUrl}/orgs/${org}/repos`,
    qs: qs,
    headers: headers(token),
  })

/**
 * https://developer.github.com/v3/issues/#list-repository-issues
 * @param token
 * @param org
 * @param repo
 * @param qs
 * @returns {Promise<{statusCode, body}>}
 */
const getIssues = async (token, org, repo, qs) =>
  await rp(({
    method: 'GET',
    url: `${defaultUrl}/repos/${org}/${repo}/issues`,
    qs: qs,
    headers: headers(token),
  }))

/**
 *
 * https://developer.github.com/v3/issues/#create-an-issue
 * @param token
 * @param owner
 * @param repo
 * @param information
 * @returns {Promise<{statusCode, body}>}
 */
const postIssue = async (token, owner, repo, information) =>
  await rp({
    method: 'POST',
    url: `${defaultUrl}/repos/${owner}/${repo}/issues`,
    headers: headers(token),
    body: information,
    json: true,
  })

/**
 *
 * https://docs.github.com/en/rest/reference/issues#create-an-issue-comment
 * @param token
 * @param owner
 * @param repo
 * @param issue_number
 * @param information
 * @returns {Promise<unknown>}
 */
const postIssueComment = async (token, owner, repo, issue_number, information) =>
  await rp({
    method: 'POST',
    url: `${defaultUrl}/repos/${owner}/${repo}/issues/${issue_number}/comments`,
    headers: headers(token),
    body: information,
    json: true,
  })

/**
 * https://developer.github.com/v3/issues/milestones/#list-milestones
 * @param token
 * @param owner
 * @param repo
 * @param qs
 * @returns {Promise<{statusCode, body}>}
 */
const getMilestones = async (token, owner, repo, qs) =>
  await rp({
    method: 'GET',
    url: `${defaultUrl}/repos/${owner}/${repo}/milestones`,
    qs: qs,
    headers: headers(token),
  })

/**
 * https://developer.github.com/v3/issues/milestones/#create-a-milestone
 * @param token
 * @param owner
 * @param repo
 * @param information
 * @returns {Promise<{statusCode, body}>}
 */
const postMilestone = async (token, owner, repo, information) =>
  await rp({
    method: 'POST',
    url: `${defaultUrl}/repos/${owner}/${repo}/milestones`,
    headers: headers(token),
    body: information,
    json: true,
  })


/**
 * https://developer.github.com/v3/issues/milestones/#update-a-milestone
 * @param token
 * @param owner
 * @param repo
 * @param number
 * @param qs
 * @returns {Promise<{statusCode, body}>}
 */
const patchMilestone = async (token, owner, repo, number, qs) =>
  await rp({
    method: 'PATCH',
    url: `${defaultUrl}/repos/${owner}/${repo}/milestones/${number}`,
    qs: qs,
    headers: headers(token),
  })

/**
 * https://developer.github.com/v3/teams/#list-teams
 * @param token
 * @param org
 * @returns {Promise<{statusCode, body}>}
 */
const getTeam = async (token, org) =>
  await rp({
    method: 'GET',
    url: `${defaultUrl}/orgs/${org}/teams`,
    headers: headers(token),
  })

/**
 * https://developer.github.com/v3/teams/members/#list-team-members (not used)
 * https://developer.github.com/enterprise/2.19/v3/teams/members/#list-team-members
 * @param token
 * @param teamId
 * @returns {Promise<{statusCode, body}>}
 */
const getTeamMembers = async (token, teamId) =>
  await rp({
    method: 'GET',
    url: `${defaultUrl}/teams/${teamId}/members`,
    headers: headers(token),
  })


module.exports = {
  getRequest,
  getUser,
  getPulls,
  getBranches,
  deleteBranch,
  getRepos,
  getIssues,
  postIssue,
  postIssueComment,
  getMilestones,
  postMilestone,
  patchMilestone,
  getTeam,
  getTeamMembers
}
