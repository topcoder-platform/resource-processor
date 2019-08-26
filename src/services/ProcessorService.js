/**
 * TopCoder challenge resources processor service.
 */

const _ = require('lodash')
const Joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Process Kafka message of challenge created
 * @param {Object} message the challenge created message
 */
async function processMessage (message) {
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

processMessage.schema = {
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

// Exports
module.exports = {
  processMessage
}

logger.buildService(module.exports)
