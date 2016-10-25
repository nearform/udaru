module.exports = [
  [0.1, 'Administrator', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.1, 'Read anything', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.1, 'Confidential', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.1, 'Company secret', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.2, 'Developer', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ]
]