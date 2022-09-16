/**
 * TopCoder challenge resources processor service.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')

const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Process Kafka message of challenge created
 * @param {Object} message the challenge created message
 */
async function handleChallengeCreate (message) {
  const challengeId = message.payload.id
  const projectId = message.payload.projectId
  logger.info(`Process message of challenge id ${challengeId} and project id ${projectId}`)

  // get project details
  const project = await helper.getProject(projectId)
  // get member ids
  const memberIds = _.map(project.members, m => m.userId)
  logger.info(`Found member ids [${memberIds.join(', ')}] of project id ${projectId}`)

  // search members
  const members = await helper.searchMembers(memberIds)

  // create resource for each member
  for (const member of members) {
    const resource = await helper.createResource(challengeId, member.handle)
    logger.info(`Created resource: ${JSON.stringify(resource, null, 4)}`)
  }
  logger.info(`Successfully processed message of challenge id ${challengeId} and project id ${projectId}`)
}

handleChallengeCreate.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(), // challenge id
      projectId: Joi.number().integer().positive().required()
    }).unknown(true).required()
  }).required()
}

/**
 * Process Kafka message of challenge updated
 * @param {Object} message the challenge update message
 */
async function handleChallengeUpdate (message) {
  const legacyId = message.payload.legacyId
  const challengeId = message.payload.id
  const projectId = message.payload.projectId

  if (!legacyId) {
    logger.info(`Skipping update message of challenge id ${challengeId} and project id ${projectId} as legacyId not present`)
  } else {
    logger.info(`Process update message of challenge id ${challengeId} and project id ${projectId}`)

    // get challenge resources (all observers for the challenge)
    const challengeResources = await helper.getChallengeResourcesV4(legacyId, challengeId)

    // get all challenge groups
    const groupIds = _.difference(message.payload.groups, config.GROUPS_TO_IGNORE)

    // filter members who are NOT part of all the groups
    if (groupIds.length > 0 && challengeResources.length > 0) {
      let memberIds = challengeResources.map(resource => resource['properties']['External Reference ID'])

      const filteredResources = await helper.filterMemberForGroups(memberIds, groupIds)
      const resourcesToDelete = challengeResources.filter(resource => filteredResources.includes(resource['properties']['External Reference ID']))

      await helper.deleteResourcesV4(challengeId, resourcesToDelete)
    }

    logger.info(`Successfully processed update message of challenge id ${challengeId} and project id ${projectId}`)
  }
}

handleChallengeUpdate.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(), // challenge id
      projectId: Joi.number().integer().positive().required()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle project member changes
 * @param {Number} projectId the project ID
 * @param {Number} userId the user ID
 * @param {Boolean} isDeleted flag to indicate that a member has been deleted
 */
async function handleProjectMemberChange (projectId, userId, isDeleted) {
  // verify project exists
  await helper.getProject(projectId)
  // get project challenges
  const challenges = await helper.getProjectChallenges(projectId)
  // get member handle
  const [memberDetails] = await helper.searchMembers([userId])
  const { handle } = memberDetails
  for (const challenge of challenges) {
    const challengeResources = await helper.getChallengeResources(challenge.id, config.MANAGER_RESOURCE_ROLE_ID)
    const existing = _.find(challengeResources, r => _.toString(r.memberId) === _.toString(userId))
    if (isDeleted) {
      if (existing) {
        await helper.deleteResource(challenge.id, handle, config.MANAGER_RESOURCE_ROLE_ID)
      }
    } else {
      if (!existing) {
        await helper.createResource(challenge.id, handle, config.MANAGER_RESOURCE_ROLE_ID)
      }
    }
  }
}

/**
 * Process kafka message of member added to a project
 * @param {Object} message the member added message
 */
async function handleMemberAdded (message) {
  await handleProjectMemberChange(message.payload.projectId, message.payload.userId)
}

handleMemberAdded.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      projectId: Joi.number().integer().positive().required(),
      userId: Joi.number().integer().positive().required()
    }).unknown(true).required()
  }).required()
}

/**
 * Process kafka message of member removed to a project
 * @param {Object} message the member added message
 */
async function handleMemberRemoved (message) {
  await handleProjectMemberChange(message.payload.projectId, message.payload.userId, true)
}

handleMemberRemoved.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      projectId: Joi.number().integer().positive().required(),
      userId: Joi.number().integer().positive().required()
    }).unknown(true).required()
  }).required()
}

// Exports
module.exports = {
  handleChallengeCreate,
  handleMemberAdded,
  handleMemberRemoved,
  handleChallengeUpdate
}

logger.buildService(module.exports)
