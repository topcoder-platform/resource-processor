/**
 * Unit tests of the TopCoder challenge resources processor service.
 */

process.env.NODE_ENV = 'test'

const _ = require('lodash')
const should = require('should')
const logger = require('../../src/common/logger')
const service = require('../../src/services/ProcessorService')
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

describe('Topcoder Challenge Resources Processor Service Unit Tests', () => {
  let infoLogs = []
  let errorLogs = []
  const info = logger.info
  const error = logger.error

  /**
   * Assert validation error
   * @param err the error
   * @param message the message
   */
  function assertValidationError (err, message) {
    err.isJoi.should.be.true()
    should.equal(err.name, 'ValidationError')
    err.details.map(x => x.message).should.containEql(message)
    errorLogs.should.not.be.empty()
  }

  /**
   * Assert there is given info message
   * @param message the message
   */
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
    logger.error = (message) => {
      errorLogs.push(message)
      error(message)
    }
  })

  after(async () => {
    // restore logger
    logger.error = error
    logger.info = info
  })

  beforeEach(() => {
    // clear logs
    infoLogs = []
    errorLogs = []
  })

  for (const requiredField of requiredFields) {
    it(`test process message with invalid parameters, required field ${requiredField} is missing`, async () => {
      let message = _.cloneDeep(testMessage)
      message = _.omit(message, requiredField)
      try {
        await service.handleChallengeCreate(message)
      } catch (err) {
        assertValidationError(err, `"${_.last(requiredField.split('.'))}" is required`)
        return
      }
      throw new Error('should not throw error here')
    })
  }

  for (const stringField of stringFields) {
    it(`test process message with invalid parameters, invalid string type field ${stringField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, stringField, 123)
      try {
        await service.handleChallengeCreate(message)
      } catch (err) {
        assertValidationError(err, `"${_.last(stringField.split('.'))}" must be a string`)
        return
      }
      throw new Error('should not throw error here')
    })

    it(`test process message with invalid parameters, empty string field ${stringField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, stringField, '')
      try {
        await service.handleChallengeCreate(message)
      } catch (err) {
        assertValidationError(err, `"${_.last(stringField.split('.'))}" is not allowed to be empty`)
        return
      }
      throw new Error('should not throw error here')
    })
  }

  for (const guidField of guidFields) {
    it(`test process message with invalid parameters, invalid GUID type field ${guidField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, guidField, '12345')
      try {
        await service.handleChallengeCreate(message)
      } catch (err) {
        assertValidationError(err, `"${_.last(guidField.split('.'))}" must be a valid GUID`)
        return
      }
      throw new Error('should not throw error here')
    })
  }

  for (const positiveIntegerField of positiveIntegerFields) {
    it(`test process message with invalid parameters, invalid positive integer type field ${
      positiveIntegerField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, positiveIntegerField, -123)
      try {
        await service.handleChallengeCreate(message)
      } catch (err) {
        assertValidationError(err, `"${_.last(positiveIntegerField.split('.'))}" must be a positive number`)
        return
      }
      throw new Error('should not throw error here')
    })
  }

  for (const dateField of dateFields) {
    it(`test process message with invalid parameters, invalid date type field ${dateField}`, async () => {
      const message = _.cloneDeep(testMessage)
      _.set(message, dateField, 'abc')
      try {
        await service.handleChallengeCreate(message)
      } catch (err) {
        assertValidationError(err,
          `"${_.last(dateField.split('.'))}" must be a number of milliseconds or valid date string`)
        return
      }
      throw new Error('should not throw error here')
    })
  }

  it('test process message, project id is not found', async () => {
    const message = _.cloneDeep(testMessage)
    message.payload.projectId = notFoundProjectId
    try {
      await service.handleChallengeCreate(message)
    } catch (err) {
      should.equal(err.message, `Failed to get project details of id ${notFoundProjectId}: it is not found`)
      return
    }
    throw new Error('should not throw error here')
  })

  it('test process message, failed to create resource', async () => {
    const message = _.cloneDeep(testMessage)
    message.payload.id = createResourceFailedChallengeId
    try {
      await service.handleChallengeCreate(message)
    } catch (err) {
      should.equal(err.message, 'Internal Server Error')
      return
    }
    throw new Error('should not throw error here')
  })

  it('test process message successfully', async () => {
    await service.handleChallengeCreate(testMessage)
    assertInfoMessage(`Process message of challenge id ${
      testMessage.payload.id} and project id ${testMessage.payload.projectId}`)
    assertInfoMessage(`Successfully processed message of challenge id ${
      testMessage.payload.id} and project id ${testMessage.payload.projectId}`)
  })
})
