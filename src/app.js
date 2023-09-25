/**
 * The application entry point
 */

const QPromise = require('bluebird')
const config = require('config')
const Kafka = require('no-kafka')
const _ = require('lodash')
const healthcheck = require('topcoder-healthcheck-dropin')
const logger = require('./common/logger')
const helper = require('./common/helper')
const { PROJECT_MEMBER_ROLE } = require('./common/constants')
const ProcessorService = require('./services/ProcessorService')

// create consumer
const consumer = new Kafka.GroupConsumer(helper.getKafkaOptions())

// data handler
const dataHandler = (messageSet, topic, partition) => QPromise.each(messageSet, (m) => {
  const message = m.message.value.toString('utf8')
  logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${m.offset}; Message: ${message}.`)
  let messageJSON
  try {
    messageJSON = JSON.parse(message)
  } catch (e) {
    logger.error('Invalid message JSON.')
    logger.logFullError(e)
    // ignore the message
    return
  }
  if (messageJSON.topic !== topic) {
    logger.error(`The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`)
    // ignore the message
    return
  }

  return (async () => {
    if (_.includes(config.IGNORED_ORIGINATORS, messageJSON.originator)) {
      logger.error(`The message originator is in the ignored list. Originator: ${messageJSON.originator}`)
    } else {
      if (topic === config.CHALLENGE_CREATE_TOPIC) {
        await ProcessorService.handleChallengeCreate(messageJSON)
      } else if (topic === config.PROJECT_MEMBER_ADDED_TOPIC) {
        await ProcessorService.handleMemberAdded(messageJSON, PROJECT_MEMBER_ROLE.OBSERVER)
      } else if (topic === config.PROJECT_COPILOT_ADDED_TOPIC) {
        await ProcessorService.handleMemberAdded(messageJSON, PROJECT_MEMBER_ROLE.COPILOT)
      } else if (topic === config.PROJECT_MANAGER_ADDED_TOPIC) {
        await ProcessorService.handleMemberAdded(messageJSON, PROJECT_MEMBER_ROLE.MANAGER)
      } else if (topic === config.PROJECT_MEMBER_REMOVED_TOPIC || topic === config.PROJECT_MEMBER_LEFT_TOPIC) {
        await ProcessorService.handleMemberRemoved(messageJSON)
      }
      logger.debug('Successfully processed message')
    }
  })()
    // commit offset
    .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
    .catch((err) => logger.logFullError(err))
})

// check if there is kafka connection alive
function check () {
  if (!consumer.client.initialBrokers && !consumer.client.initialBrokers.length) {
    return false
  }
  let connected = true
  consumer.client.initialBrokers.forEach(conn => {
    if (!conn.connected) {
      logger.error(`url ${conn.server()} - connected=${conn.connected}`)
    }
    connected = conn.connected & connected
  })
  return connected
}

logger.info('Starting kafka consumer')
consumer
  .init([{
    subscriptions: [
      config.CHALLENGE_CREATE_TOPIC,
      config.PROJECT_MEMBER_ADDED_TOPIC,
      config.PROJECT_COPILOT_ADDED_TOPIC,
      config.PROJECT_MANAGER_ADDED_TOPIC,
      config.PROJECT_MEMBER_REMOVED_TOPIC,
      config.PROJECT_MEMBER_LEFT_TOPIC
    ],
    handler: dataHandler
  }])
  .then(() => {
    healthcheck.init([check])
    logger.info('Kafka consumer initialized successfully')
  })
  .catch(logger.logFullError)

if (process.env.NODE_ENV === 'test') {
  module.exports = consumer
}
