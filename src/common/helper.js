/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const axios = require('axios')

/**
 * Get Kafka options
 * @return {Object} the Kafka options
 */
function getKafkaOptions () {
  const options = { connectionString: config.KAFKA_URL, groupId: config.KAFKA_GROUP_ID }
  if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
    options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
  }
  return options
}

/**
 * Get M2M token.
 * @return {Promise<String>} the M2M token
 */
async function getM2MToken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Get project details.
 * @param {Number} projectId the project id
 * @return {Object} project details
 */
async function getProject (projectId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const { data } = await axios.get(`${config.PROJECT_API}/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return data
}

/**
 * Get all challenges for a specific project
 * @param {Number} projectId the project ID
 */
async function getProjectChallenges (projectId) {
  const token = await getM2MToken()
  let allChallenges = []
  let page = 1
  while (true) {
    const res = await axios.get(`${config.CHALLENGE_API}?projectId=${projectId}&isLightweight=true&page=${page}&perPage=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const challenges = res.data
    if (_.isEmpty(challenges)) {
      break
    }
    allChallenges = _.concat(allChallenges, _.map(_.filter(challenges, c => _.includes(['New', 'Draft', 'Active'], c.status)), c => _.pick(c, ['id'])))
    page += 1
    if (res.headers['x-total-pages'] && page > _.toNumber(res.headers['x-total-pages'])) {
      break
    }
  }
  return allChallenges
}

/**
 * Search members of given member id
 * @param {Number} userId the member id
 * @return {Promise<String>|undefined} searched member
 */
async function getMemberHandleById (userId) {
  const token = await getM2MToken()
  const { data: members } = await axios.get(`${config.get('MEMBER_API')}?fields=handle&userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return _.get(members, '[0].handle')
}

/**
 * Create resource.
 * @param {String} challengeId the challenge id
 * @param {String} memberHandle the member handle
 * @param {String} roleId the role ID
 */
async function createResource (challengeId, memberHandle, roleId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const res = await axios.post(config.get('RESOURCES_API'), { challengeId, memberHandle, roleId }, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: _ => true
  })
  if (res.status > 201) {
    console.error(JSON.stringify(res.data))
  } else {
    console.info(`User ${memberHandle} added to challenge ${challengeId} with roleId ${roleId}`)
  }
}

/**
 * Delete resource.
 * @param {String} challengeId the challenge id
 * @param {String} memberHandle the member handle
 * @param {String} roleId the role ID
 */
async function deleteResource (challengeId, memberHandle, roleId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const res = await axios.delete(config.get('RESOURCES_API'), {
    headers: { Authorization: `Bearer ${token}` },
    data: { challengeId, memberHandle, roleId },
    validateStatus: _ => true
  })
  if (res.status > 204) {
    console.error(JSON.stringify(res.data))
  } else {
    console.info(`User ${memberHandle} deleted from challenge ${challengeId} with roleId ${roleId}`)
  }
}

module.exports = {
  getKafkaOptions,
  getProject,
  getMemberHandleById,
  createResource,
  deleteResource,
  getProjectChallenges
}
