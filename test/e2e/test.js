/**
 * E2E tests of the TopCoder challenge resources processor.
 */

process.env.NODE_ENV = 'test'

const _ = require('lodash')
const config = require('config')
const helper = require('../../src/common/helper')
const request = require('superagent')
const Kafka = require('no-kafka')
const should = require('should')
const logger = require('../../src/common/logger')
const {
  testMessage,
  requiredFields,
  stringFields,
  guidFields,
  positiveIntegerFields,
  dateFields,
  notFoundProjectId,
  createResourceFailedChallengeId
} = require('../common/testData')

describe('Topcoder Challenge Resources Processor E2E Tests', () => {
  let app
  let infoLogs = []
  let errorLogs = []
  let debugLogs = []
  const info = logger.info
  const error = logger.error
  const debug = logger.debug

  const producer = new Kafka.Producer(helper.getKafkaOptions())

  /**
   * Sleep with time from input
   * @param time the time input
   */
  async function sleep (time) {
    await new Promise((resolve) => {
      setTimeout(resolve, time)
    })
  }

  /**
   * Send message
   * @param message the test message to send to Kafka
   */
  async function sendMessage (message) {
    await producer.send({
      topic: message.topic,
      message: {
        value: JSON.stringify(message)
      }
    })
  }

  /**
   * Consume not committed messages before e2e tests
   */
  async function consumeMessages () {
    // remove all not processed messages
    const consumer = new Kafka.GroupConsumer(helper.getKafkaOptions())
    await consumer.init([{
      subscriptions: [config.KAFKA_TOPIC],
      handler: (messageSet, topic, partition) => Promise.each(messageSet,
        (m) => consumer.commitOffset({ topic, partition, offset: m.offset }))
    }])
    // make sure process all not committed messages before tests
    await sleep(2 * config.WAIT_TIME)
    await consumer.end()
  }

  /**
   * Wait job finished with successful log or error log is found
   */
  async function waitJob () {
    while (true) {
      if (errorLogs.length > 0) {
        break
      }
      if (infoLogs.some(x => String(x).includes('Successfully processed message'))) {
        break
      }
      // wait for a while before next check
      await sleep(config.WAIT_TIME)
    }
  }

  function assertErrorMessage (message) {
    errorLogs.should.not.be.empty()
    errorLogs.some(x => String(x).includes(message)).should.be.true()
  }

  function assertInfoMessage (message) {
    infoLogs.should.not.be.empty()
    infoLogs.some(x => String(x).includes(message)).should.be.true()
  }

  before(async () => {
    // inject logger with log collector
    logger.info = (message) => {
      infoLogs.push(message)
      info(message)
    }
    logger.debug = (message) => {
      debugLogs.push(message)
      debug(message)
    }
    logger.error = (message) => {
      errorLogs.push(message)
      error(message)
    }
    await consumeMessages()
    // start kafka producer
    await producer.init()
    // start the application (kafka listener)
    app = require('../../src/app')
    // wait until consumer init successfully
    while (true) {
      if (infoLogs.some(x => String(x).includes('Kafka consumer initialized successfully'))) {
        break
      }
      await sleep(config.WAIT_TIME)
    }
  })

  after(async () => {
    // restore logger
    logger.error = error
    logger.info = info
    logger.debug = debug

    try {
      await producer.end()
    } catch (err) {
      // ignore
    }
    try {
      await app.end()
    } catch (err) {
      // ignore
    }
  })

  beforeEach(() => {
    // clear logs
    infoLogs = []
    debugLogs = []
    errorLogs = []
  })

  it('Should setup healthcheck with check on kafka connection', async () => {
    const healthcheckEndpoint = `http://localhost:${process.env.PORT || 3000}/health`
    const result = await request.get(healthcheckEndpoint)
    should.equal(result.status, 200)
    should.deepEqual(result.body, { checksRun: 1 })
    debugLogs.should.match(/connected=true/)
  })

  it('Should handle invalid json message', async () => {
    await producer.send({
      topic: testMessage.topic,
      message: {
        value: '[ invalid'
      }
    })
    await waitJob()
    assertErrorMessage('Invalid message JSON.')
  })

  it('Should handle incorrect topic field message', async () => {
    const message = _.cloneDeep(testMessage)
    message.topic = 'invalid'
    await producer.send({
      topic: testMessage.topic,
      message: {
        value: JSON.stringify(message)
      }
    })
    await waitJob()
    assertErrorMessage(`The message topic ${message.topic} doesn't match the Kafka topic ${testMessage.topic}.`)
  })

  for (const requiredField of requiredFields) {
    it(`test process message with invalid parameters, required field ${requiredField} is missing`, async () => {
      let message = _.cloneDeep(testMessage)
      message = _.omit(message, requiredField)

      await sendMessage(message)
      await waitJob()

      assertErrorMessage(`"${_.last(requiredField.split('.'))}" is required`)
    })
  }

  for (const stringField of stringFields) {
    it(`test process message with invalid parameters, invalid string type field ${stringField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, stringField, 123)

      await sendMessage(message)
      await waitJob()

      assertErrorMessage(`"${_.last(stringField.split('.'))}" must be a string`)
    })

    it(`test process message with invalid parameters, empty string field ${stringField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, stringField, '')

      await sendMessage(message)
      await waitJob()

      assertErrorMessage(`"${_.last(stringField.split('.'))}" is not allowed to be empty`)
    })
  }

  for (const guidField of guidFields) {
    it(`test process message with invalid parameters, invalid GUID type field ${guidField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, guidField, '12345')

      await sendMessage(message)
      await waitJob()

      assertErrorMessage(`"${_.last(guidField.split('.'))}" must be a valid GUID`)
    })
  }

  for (const positiveIntegerField of positiveIntegerFields) {
    it(`test process message with invalid parameters, invalid positive integer type field ${
      positiveIntegerField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, positiveIntegerField, -123)

      await sendMessage(message)
      await waitJob()

      assertErrorMessage(`"${_.last(positiveIntegerField.split('.'))}" must be a positive number`)
    })
  }

  for (const dateField of dateFields) {
    it(`test process message with invalid parameters, invalid date type field ${dateField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, dateField, 'abc')

      await sendMessage(message)
      await waitJob()

      assertErrorMessage(`"${_.last(dateField.split('.'))}" must be a number of milliseconds or valid date string`)
    })
  }

  it('test process message, project id is not found', async () => {
    const message = _.cloneDeep(testMessage)
    message.payload.projectId = notFoundProjectId

    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`Failed to get project details of id ${notFoundProjectId}: it is not found`)
  })

  it('test process message, failed to create resource', async () => {
    const message = _.cloneDeep(testMessage)
    message.payload.id = createResourceFailedChallengeId

    await sendMessage(message)
    await waitJob()

    assertErrorMessage('Internal Server Error')
  })

  it('test process message successfully', async () => {
    await sendMessage(testMessage)
    await waitJob()
    assertInfoMessage(`Process message of challenge id ${
      testMessage.payload.id} and project id ${testMessage.payload.projectId}`)
    assertInfoMessage(`Successfully processed message of challenge id ${
      testMessage.payload.id} and project id ${testMessage.payload.projectId}`)
  })
})
