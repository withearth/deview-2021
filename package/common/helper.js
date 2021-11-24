const { getUser } = require('./api')

const getNameOfUserId = async ( token, userId ) => {
  if (!userId) return null
  const { body: { name } } = await getUser(token, userId)
  return name
}

const getEmailOfUserId = async ( token, userId ) => {
  if (!userId) return null
  const { body: { ldap_dn = null }} = await getUser(token, userId)
  return getEmailOfUser(ldap_dn)
}

const getEmailOfUser = ( ldap_dn ) => {
  const employeeNumber = ldap_dn.split(',')[0].replace('CN=', '')
  // FIXME. 이 부분은 챗봇영역입니다.
  const emailDomain = ''
  return `${employeeNumber}@${emailDomain}`
}

module.exports = {
  getNameOfUserId,
  getEmailOfUserId,
  getEmailOfUser
}
