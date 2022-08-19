/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const config = require('config')
const busApi = require('tc-bus-api-wrapper')
const busApiClient = busApi(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET', 'BUSAPI_URL', 'KAFKA_ERROR_TOPIC', 'AUTH0_PROXY_SERVER_URL']))
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const superagent = require('superagent')
const { v4: uuid } = require('uuid')

const logger = require('./logger')

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
 * Get all challenges for a specific project
 * @param {Number} projectId the project ID
 */
async function getProjectChallenges (projectId) {
  const token = await getM2MToken()
  const url = `${config.CHALLENGE_API}`
  let allChallenges = []
  let page = 1
  while (true) {
    const res = await superagent
      .get(url)
      .query({
        projectId,
        isLightweight: true,
        perPage: 100
      })
      .set('Authorization', `Bearer ${token}`)
    if (res.status !== 200) {
      throw new Error(`Failed to get project details of id ${projectId}: ${_.get(res.body, 'message')}`)
    }
    const challenges = res.body || []
    if (challenges.length === 0) {
      break
    }
    allChallenges = allChallenges.concat(_.map(challenges, c => _.pick(c, ['id'])))
    page += 1
    if (res.headers['x-total-pages'] && page > Number(res.headers['x-total-pages'])) {
      break
    }
  }
  return allChallenges
}

/**
 * Get challenge resources
 * @param {String} challengeId the challenge ID
 * @param {String} roleId the role ID
 */
async function getChallengeResources (challengeId, roleId) {
  const token = await getM2MToken()
  const url = `${config.RESOURCES_API}`
  let allResources = []
  let page = 1
  while (true) {
    const res = await superagent
      .get(url)
      .query({
        challengeId,
        roleId: roleId || config.RESOURCE_ROLE_ID,
        perPage: 100
      })
      .set('Authorization', `Bearer ${token}`)
    if (res.status !== 200) {
      throw new Error(`Failed to get resources for challenge id ${challengeId}: ${_.get(res.body, 'message')}`)
    }
    const resources = res.body || []
    if (resources.length === 0) {
      break
    }
    allResources = allResources.concat(resources)
    page += 1
    if (res.headers['x-total-pages'] && page > Number(res.headers['x-total-pages'])) {
      break
    }
  }
  return allResources
}

/**
 * Get challenge resources using v4 API
 * @param {String} legacyId the legacy challenge ID
 * @param {String} challengeId the challenge ID
 * @return {Array} list of observers
 */
async function getChallengeResourcesV4 (legacyId, challengeId) {
  const token = await getM2MToken()
  const url = `${config.V4_RESOURCES_API}` + legacyId + '/resources'
  const res = await superagent.get(url).set('Authorization', `Bearer ${token}`)
  if (res.status !== 200) {
    throw new Error(`Failed to get resources for challenge id ${challengeId}: ${JSON.stringify(_.get(res.body, 'result.content'))}`)
  }

  // TODO: Make generic and not hardcoded `OBSERVER`
  return _.filter(_.get(res.body, 'result.content'), { role: 'Observer' })
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
 * @param {String} roleId the role ID
 * @return {Object} the created resource
 */
async function createResource (challengeId, memberHandle, roleId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const res = await superagent
    .post(config.RESOURCES_API)
    .set('Authorization', `Bearer ${token}`)
    .send({
      challengeId,
      memberHandle,
      roleId: roleId || config.RESOURCE_ROLE_ID
    })
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

/**
 * Delete resource.
 * @param {String} challengeId the challenge id
 * @param {String} memberHandle the member handle
 * @param {String} roleId the role ID
 * @return {Object} the created resource
 */
async function deleteResource (challengeId, memberHandle, roleId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const res = await superagent
    .delete(config.RESOURCES_API)
    .set('Authorization', `Bearer ${token}`)
    .send({
      challengeId,
      memberHandle,
      roleId: roleId || config.RESOURCE_ROLE_ID
    })
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

/**
 * Search members of the given group ids
 * @param {Array} members
 * @param {Array} groupIds
 * @return {Array} filtered members
 */
async function filterMemberForGroups (memberIds, groupIds) {
  const memberList = []

  for (const memberId of memberIds) {
    const res = await Promise.allSettled(groupIds.map(groupId => checkMemberGroup(groupId, memberId)))
    const memberGroups = _.compact(_.flattenDeep(_.map(res, 'value')))

    if (memberGroups.length !== groupIds.length) memberList.push(memberId)
  }

  return memberList
}

/**
 * Check for membership against the provided group
 * @param {String} groupId
 * @param {String} memberId
 * @returns {String} memberId in case of member of group
 */
async function checkMemberGroup (groupId, memberId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const url = `${config.GROUPS_API_URL}/${groupId}/members/${memberId}`

  return superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .timeout(config.REQUEST_TIMEOUT)
}

/**
 * Remove resources using V4 API
 * @param {String} groupId
 * @param {String} memberId
 * @returns {String} memberId in case of member of group
 */
async function deleteResourcesV4 (challengeId, resources) {
  const payloads = []

  resources.map(resource => {
    payloads.push({
      id: uuid(),
      challengeId,
      memberId: resource['properties']['External Reference ID'],
      memberHandle: resource['properties']['Handle'],
      roleId: config.RESOURCE_ROLE_ID,
      created: resource['properties']['Handle'],
      createdBy: new Date().toUTCString()
    })
  })

  await Promise.allSettled(payloads.map(payload => postEvent(config.RESOURCE_DELETE_TOPIC, payload)))
}

/**
 * Send Kafka event message
 * @params {String} topic the topic name
 * @params {Object} payload the payload
 */
async function postEvent (topic, payload) {
  logger.info(`Publish event to Kafka topic ${topic}`)
  const message = {
    topic,
    originator: config.KAFKA_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload
  }
  await busApiClient.postEvent(message)
}

module.exports = {
  getKafkaOptions,
  getProject,
  searchMembers,
  createResource,
  deleteResource,
  getProjectChallenges,
  getChallengeResources,
  filterMemberForGroups,
  getChallengeResourcesV4,
  deleteResourcesV4
}
