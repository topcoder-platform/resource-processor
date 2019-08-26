/**
 * This file defines common data used in tests.
 */

const testMessage = {
  topic: 'challenge.notification.create',
  originator: 'challenge-api',
  timestamp: '2019-07-08T00:00:00.000Z',
  'mime-type': 'application/json',
  payload: {
    id: '7d458700-bd2d-4b23-ab71-e79455844dba',
    typeId: '7d458700-bd2d-4b23-ab71-e79455844db2',
    track: 'code',
    name: 'test challenge',
    description: 'some description',
    challengeSettings: [{ type: '7d458700-bd2d-4b23-ab71-e79455844db3', value: 'value1' }],
    timelineTemplateId: '7d458700-bd2d-4b23-ab71-e79455844db5',
    phases: [{
      id: '7d458700-bd2d-4b23-ab71-e79455844db6',
      name: 'review',
      description: 'desc',
      isActive: true,
      duration: 10000
    }],
    prizeSets: [{
      type: 'win',
      prizes: [{
        type: 'first place',
        value: 800
      }]
    }],
    reviewType: 'community',
    tags: ['tag1', 'tag2'],
    projectId: 30055214,
    legacyId: 123,
    forumId: 456,
    startDate: '2019-07-09T00:00:00.000Z',
    status: 'Draft',
    groups: ['group1', 'group2'],
    gitRepoURLs: ['http://test.com/test.git'],
    created: '2019-07-08T00:00:00.000Z',
    createdBy: 'test'
  }
}

const requiredFields = ['originator', 'timestamp', 'mime-type', 'payload.id', 'payload.typeId', 'payload.track',
  'payload.name', 'payload.description', 'payload.timelineTemplateId', 'payload.phases', 'payload.prizeSets',
  'payload.reviewType', 'payload.tags', 'payload.projectId', 'payload.startDate', 'payload.status', 'payload.created',
  'payload.createdBy']

const stringFields = ['originator', 'mime-type', 'payload.track', 'payload.name', 'payload.description',
  'payload.reviewType', 'payload.status', 'payload.createdBy']

const guidFields = ['payload.id', 'payload.typeId', 'payload.timelineTemplateId']

const positiveIntegerFields = ['payload.projectId', 'payload.legacyId', 'payload.forumId']

const dateFields = ['timestamp', 'payload.startDate', 'payload.created']

const notFoundProjectId = 123

const createResourceFailedChallengeId = '55ba42a4-f7f9-4f1e-bf81-a8553ba53778'

module.exports = {
  testMessage,
  requiredFields,
  stringFields,
  guidFields,
  positiveIntegerFields,
  dateFields,
  notFoundProjectId,
  createResourceFailedChallengeId
}
