const packageJson = require('./package.json')

module.exports = {
  jsonEditor: true,
  reuseDefinitions: false,
  grouping: 'tags',
  info: {
    title: 'Udaru API Documentation',
    description: 'This page documents Udaru\'s API endpoints, along with their various inputs and outputs. For more information about Udaru please see the <a href="https://nearform.github.io/udaru">Documentation Site.</a>',
    version: packageJson.version
  },
  tags: [
    {
      name: 'policies',
      description: 'Manage policy objects'
    },
    {
      name: 'organizations',
      description: 'Manage organizations'
    },
    {
      name: 'teams',
      description: 'Manage teams within an organization'
    },
    {
      name: 'users',
      description: 'Manage users within an organization'
    },
    {
      name: 'authorization',
      description: 'Manage the actions a user can perform against a resource'
    },
    {
      name: 'private',
      description: 'Endpoints that require a service key'
    },
    {
      name: 'monitoring',
      description: 'Endpoints for monitoring and uptime'
    }
  ]
}
