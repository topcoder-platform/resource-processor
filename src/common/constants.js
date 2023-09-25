const config = require('config')

const PROJECT_MEMBER_ROLE = {
  MANAGER: 'manager',
  OBSERVER: 'observer',
  CUSTOMER: 'customer',
  COPILOT: 'copilot'
}

const PROJECT_TO_RESOURCE_ROLE = {
  [PROJECT_MEMBER_ROLE.MANAGER]: config.get('MANAGER_RESOURCE_ROLE_ID'),
  [PROJECT_MEMBER_ROLE.OBSERVER]: config.get('OBSERVER_ROLE_ID'),
  [PROJECT_MEMBER_ROLE.CUSTOMER]: config.get('OBSERVER_ROLE_ID'),
  [PROJECT_MEMBER_ROLE.COPILOT]: config.get('OBSERVER_ROLE_ID')
}

module.exports = {
  PROJECT_MEMBER_ROLE,
  PROJECT_TO_RESOURCE_ROLE
}
