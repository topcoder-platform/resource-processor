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
      message: 'project not found for id 123',
      debug: 'Error: project not found for id 8913555\n    at /usr/src/app/dist/routes/projects/get.js:159:20\n    at Immediate._onImmediate (/usr/src/app/node_modules/async-listener/glue.js:188:31)\nFrom previous event:\n    at Immediate.<anonymous> (/usr/src/app/node_modules/async-listener/glue.js:188:31)\n    at runCallback (timers.js:781:20)\n    at tryOnImmediate (timers.js:743:5)\n    at processImmediate [as _immediateCallback] (timers.js:714:5)\nFrom previous event:\n    at retrieveProjectFromDB (/usr/src/app/dist/routes/projects/get.js:155:6)\n    at /usr/src/app/dist/routes/projects/get.js:197:14\n    at propagateAslWrapper (/usr/src/app/node_modules/async-listener/index.js:504:23)\n    at /usr/src/app/node_modules/async-listener/glue.js:188:31\n    at /usr/src/app/node_modules/async-listener/index.js:541:70\n    at /usr/src/app/node_modules/async-listener/glue.js:188:31\n    at <anonymous>\n    at process._tickDomainCallback (internal/process/next_tick.js:228:7)\n    at process.fallback (/usr/src/app/node_modules/async-listener/index.js:565:15)'
    }
  } else {
    result = {
      actualPrice: null,
      description: 'New project roles',
      lastActivityAt: '2020-03-14T22:40:31.268Z',
      billingAccountId: null,
      challengeEligibility: [],
      type: 'talent-as-a-service',
      templateId: 225,
      deletedBy: null,
      bookmarks: [],
      createdAt: '2020-03-11T22:16:01.699Z',
      lastActivityUserId: '40158997',
      terms: [],
      estimatedPrice: null,
      members: [
        {
          createdAt: '2020-03-11T22:16:01.699Z',
          role: 'customer',
          updatedBy: 88770049,
          createdBy: 88770049,
          isPrimary: true,
          id: 12506,
          userId: 88770049,
          projectId: projectId,
          deletedBy: null,
          updatedAt: '2020-03-11T22:16:01.731Z'
        },
        {
          createdAt: '2020-03-14T22:40:31.117Z',
          role: 'customer',
          updatedBy: 40158997,
          createdBy: 40158997,
          isPrimary: false,
          id: 12508,
          projectId: projectId,
          userId: 40158997,
          deletedBy: null,
          updatedAt: '2020-03-14T22:40:31.117Z'
        }
      ],
      invites: [],
      id: projectId,
      directProjectId: 21037,
      cancelReason: null,
      updatedAt: '2020-03-14T22:40:31.268Z',
      updatedBy: -101,
      version: 'v3',
      external: null,
      createdBy: 88770049,
      name: 'Roles &amp; Responsibilities',
      status: 'in_review'
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
