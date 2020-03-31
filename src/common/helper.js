/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const superagent = require('superagent')

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
 * @return {String} the M2M token
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
  const url = `${config.GET_PROJECT_API_BASE}/${projectId}`
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .timeout(config.REQUEST_TIMEOUT)
  if (res.status !== 200) {
    throw new Error(`Failed to get project details of id ${projectId}: ${_.get(res.body, 'message')}`)
  }
  return res.body
}

/**
 * Search members of given member ids
 * @param {Array} memberIds the member ids
 * @return {Array} searched members
 */
async function searchMembers (memberIds) {
  if (!memberIds || memberIds.length === 0) {
    return []
  }
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const res = await superagent
    .get(config.SEARCH_MEMBERS_API_BASE)
    .set('Authorization', `Bearer ${token}`)
    .query({
      fields: 'handle',
      query: _.map(memberIds, id => `userId:${id}`).join(' OR '),
      limit: memberIds.length
    })
    .timeout(config.REQUEST_TIMEOUT)
  const success = _.get(res.body, 'result.success')
  const status = _.get(res.body, 'result.status')
  if (!success || !status || status < 200 || status >= 300) {
    throw new Error(`Failed to search members: ${_.get(res.body, 'result.content')}`)
  }
  return _.get(res.body, 'result.content') || []
}

/**
 * Create resource.
 * @param {String} challengeId the challenge id
 * @param {String} memberHandle the member handle
 * @return {Object} the created resource
 */
async function createResource (challengeId, memberHandle) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const res = await superagent
    .post(config.CREATE_RESOURCE_API)
    .set('Authorization', `Bearer ${token}`)
    .send({
      challengeId,
      memberHandle,
      roleId: config.RESOURCE_ROLE_ID
    })
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

module.exports = {
  getKafkaOptions,
  getProject,
  searchMembers,
  createResource
}
