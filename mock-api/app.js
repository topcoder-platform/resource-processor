/**
 * The application entry point for mock TC APIs
 */

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('config')
const winston = require('winston')
const uuid = require('uuid/v4')

const app = express()
app.set('port', config.PORT)

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// create resource
app.post('/v5/resources', (req, res) => {
  winston.info(`Create resource: ${JSON.stringify(req.body, null, 4)}`)

  if (req.body.challengeId === '55ba42a4-f7f9-4f1e-bf81-a8553ba53778') {
    winston.info('Failed to create resource.')
    res.status(500).json({ message: 'there is error' })
    return
  }

  const result = req.body
  result.id = uuid()
  result.memberId = uuid()
  result.created = new Date()
  result.createdBy = 'mock-api'

  winston.info(`Created resource: ${JSON.stringify(result, null, 4)}`)
  res.json(result)
})

// get project by id
app.get('/v4/projects/:projectId', (req, res) => {
  const projectId = req.params.projectId
  winston.info(`Get project of id: ${projectId}`)

  let result
  if (projectId === '123') {
    result = {
      id: '6eba42a4-f7f9-4f1e-bf81-a8553ba5372a',
      version: 'v4',
      result: {
        success: false,
        status: 404,
        content: 'it is not found'
      }
    }
  } else {
    result = {
      id: '7eba42a4-f7f9-4f1e-bf81-a8553ba5371a',
      version: 'v4',
      result: {
        success: true,
        status: 200,
        content: {
          id: projectId,
          directProjectId: null,
          billingAccountId: null,
          name: 'Alpha',
          description: 'And away we go.',
          external: null,
          bookmarks: null,
          estimatedPrice: '0.00',
          actualPrice: null,
          terms: [],
          type: 'app_dev',
          status: 'paused',
          details: {
            fontIds: [],
            offlineAccess: null,
            deviceIds: ['PHONE'],
            offlineAccessComment: null,
            orientationIds: ['PORTRAIT'],
            iconsetIds: [],
            usesPersonalInformation: null,
            colorSwatchIds: [],
            modelType: 'app-project',
            version: null,
            securityLevel: null,
            features: '[ ]',
            apiIntegration: null,
            designNotes: null
          },
          challengeEligibility: null,
          cancelReason: null,
          templateId: null,
          createdAt: '2016-04-27T22:15:04.285Z',
          updatedAt: '2016-10-01T17:33:44.000Z',
          deletedBy: null,
          createdBy: 40141336,
          updatedBy: 40152933,
          version: 'v2',
          lastActivityAt: '2016-10-01T17:33:44.000Z',
          lastActivityUserId: '40152933',
          members: [{
            id: 995,
            userId: 40152933,
            role: 'manager',
            isPrimary: true,
            createdAt: '2016-10-01T17:33:32.000Z',
            updatedAt: '2016-10-01T17:33:32.000Z',
            deletedBy: null,
            createdBy: 40152933,
            updatedBy: 40152933,
            projectId
          }, {
            id: 998,
            userId: 40141336,
            role: 'manager',
            isPrimary: true,
            createdAt: '2016-10-02T17:33:32.000Z',
            updatedAt: '2016-10-02T17:33:32.000Z',
            deletedBy: null,
            createdBy: 40152933,
            updatedBy: 40152933,
            projectId
          }],
          attachments: [],
          invites: [],
          scopeChangeRequests: []
        },
        metadata: {
          totalCount: 1
        }
      }
    }
  }

  winston.info(`Result: ${JSON.stringify(result, null, 4)}`)
  res.json(result)
})

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' })
})

app.use((err, req, res, next) => {
  winston.error(err)
  res.status(500).json({
    error: err.message
  })
})

app.listen(app.get('port'), '0.0.0.0', () => {
  winston.info(`Express server listening on port ${app.get('port')}`)
})
