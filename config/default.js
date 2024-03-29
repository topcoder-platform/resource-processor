/**
 * The default configuration file.
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING
    ? process.env.DISABLE_LOGGING.toLowerCase() === 'true'
    : false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

  // used to get M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder-dev.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'challenge-resources-processor',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,
  // Topics
  CHALLENGE_CREATE_TOPIC: process.env.CHALLENGE_CREATE_TOPIC || 'challenge.notification.create',
  PROJECT_MEMBER_ADDED_TOPIC: process.env.PROJECT_MEMBER_ADDED_TOPIC || 'connect.notification.project.member.joined',
  PROJECT_COPILOT_ADDED_TOPIC: process.env.PROJECT_COPILOT_ADDED_TOPIC || 'connect.notification.project.member.copilotJoined',
  PROJECT_MANAGER_ADDED_TOPIC: process.env.PROJECT_MANAGER_ADDED_TOPIC || 'connect.notification.project.member.managerJoined',
  PROJECT_MEMBER_REMOVED_TOPIC: process.env.PROJECT_MEMBER_REMOVED_TOPIC || 'connect.notification.project.member.removed',
  PROJECT_MEMBER_LEFT_TOPIC: process.env.PROJECT_MEMBER_LEFT_TOPIC || 'connect.notification.project.member.left',

  OBSERVER_ROLE_ID: process.env.OBSERVER_ROLE_ID || '2a4dc376-a31c-4d00-b173-13934d89e286',
  MANAGER_RESOURCE_ROLE_ID: process.env.MANAGER_RESOURCE_ROLE_ID || '0e9c6879-39e4-4eb6-b8df-92407890faf1',

  PROJECT_API: process.env.PROJECT_API || 'https://api.topcoder-dev.com/v5/projects',
  RESOURCES_API: process.env.RESOURCES_API || 'https://api.topcoder-dev.com/v5/resources',
  CHALLENGE_API: process.env.CHALLENGE_API || 'https://api.topcoder-dev.com/v5/challenges',
  MEMBER_API: process.env.MEMBER_API || 'https://api.topcoder-dev.com/v5/members',

  IGNORED_ORIGINATORS: process.env.IGNORED_ORIGINATORS ? process.env.IGNORED_ORIGINATORS.split(',') : ['legacy-migration-script']
}
