/**
 * TopCoder challenge resources processor service.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')

const logger = require('../common/logger')
const helper = require('../common/helper')
const { PROJECT_MEMBER_ROLE, PROJECT_TO_RESOURCE_ROLE } = require('../common/constants')

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
  // create resource for each member
  for (const member of project.members) {
    const resource = await helper.createResource(challengeId, member.handle, PROJECT_TO_RESOURCE_ROLE[member.role])
    logger.info(`Created resource: ${JSON.stringify(resource)}`)
  }
  logger.info(`Successfully processed message of challenge id ${challengeId} and project id ${projectId}`)
}

handleChallengeCreate.schema = Joi.object({
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
}).required()

/**
 * Process kafka message of member added to a project
 * @param {Object} message the member added message
 */
async function handleMemberAdded (message, projectRole) {
  const challenges = await helper.getProjectChallenges(message.payload.projectId)
  console.info(`Challenge count: ${challenges.length}`)
  const handle = await helper.getMemberHandleById(message.payload.userId)
  if (!handle) {
    throw new Error(`User not found: ${message.payload.userId}`)
  }
  for (const challenge of challenges) {
    await helper.createResource(challenge.id, handle, PROJECT_TO_RESOURCE_ROLE[projectRole])
  }
  logger.info(`Successfully processed message of project id ${message.payload.projectId}`)
}

handleMemberAdded.schema = Joi.object({
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      projectId: Joi.number().integer().positive().required(),
      userId: Joi.number().integer().positive().required()
    }).unknown(true).required()
  }).required(),
  projectRole: Joi.string().valid(..._.values(PROJECT_MEMBER_ROLE))
}).required()

/**
 * Process kafka message of member removed to a project
 * @param {Object} message the member added message
 */
async function handleMemberRemoved (message) {
  const challenges = await helper.getProjectChallenges(message.payload.projectId)
  console.info(`Challenge count: ${challenges.length}`)
  const handle = await helper.getMemberHandleById(message.payload.userId)
  if (!handle) {
    throw new Error(`User not found: ${message.payload.userId}`)
  }
  for (const challenge of challenges) {
    await helper.deleteResource(challenge.id, handle, config.get('MANAGER_RESOURCE_ROLE_ID'))
    await helper.deleteResource(challenge.id, handle, config.get('OBSERVER_ROLE_ID'))
  }
  logger.info(`Successfully processed message of project id ${message.payload.projectId}`)
}

handleMemberRemoved.schema = Joi.object({
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
}).required()

// Exports
module.exports = {
  handleChallengeCreate,
  handleMemberAdded,
  handleMemberRemoved
}

logger.buildService(module.exports)
