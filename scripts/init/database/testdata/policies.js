module.exports = [
  [
    'policyId1',
    '0.1',
    'Director',
    'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['finance:ReadBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        },
        {
          'Effect': 'Deny',
          'Action': ['finance:ImportBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        },
        {
          'Effect': 'Allow',
          'Action': ['finance:ReadCompanies'],
          'Resource': ['database:pg01:companies']
        },
        {
          'Effect': 'Deny',
          'Action': ['finance:UpdateCompanies'],
          'Resource': ['database:pg01:companies']
        },
            {
          'Effect': 'Deny',
          'Action': ['finance:DeleteCompanies'],
          'Resource': ['database:pg01:companies']
        }
      ]}
  ],
  [
    'policyId2',
    '0.1',
    'Accountant',
    'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['finance:ReadBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        },
        {
          'Effect': 'Deny',
          'Action': ['finance:ImportBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        },
        {
          'Effect': 'Deny',
          'Action': ['finance:ReadCompanies'],
          'Resource': ['database:pg01:companies']
        },
        {
          'Effect': 'Deny',
          'Action': ['finance:UpdateCompanies'],
          'Resource': ['database:pg01:companies']
        },
            {
          'Effect': 'Deny',
          'Action': ['finance:DeleteCompanies'],
          'Resource': ['database:pg01:companies']
        }
      ]}
  ],
  [
    'policyId3',
    '0.1',
    'Sys admin',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['finance:ReadBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        },
        {
          'Effect': 'Allow',
          'Action': ['finance:ImportBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        },
        {
          'Effect': 'Allow',
          'Action': ['finance:ReadCompanies'],
          'Resource': ['database:pg01:companies']
        },
        {
          'Effect': 'Allow',
          'Action': ['finance:UpdateCompanies'],
          'Resource': ['database:pg01:companies']
        },
            {
          'Effect': 'Allow',
          'Action': ['finance:DeleteCompanies'],
          'Resource': ['database:pg01:companies']
        }
      ]
    }
  ],
  [
    'policyId4',
    '0.1',
    'Finance Director',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['finance:EditBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        }
      ]
    }
  ],
  [
    'policyId5',
    '0.1',
    'DB Admin',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['database:*'],
          'Resource': ['database:pg01:*']
        }
      ]
    }
  ],
  [
    'policyId6',
    '0.1',
    'DB Only Read',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['database:Read'],
          'Resource': ['database:pg01:*']
        }
      ]
    }
  ],
  [
    'policyId7',
    '0.1',
    'DB only one table',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['database:*'],
          'Resource': ['database:pg01:balancesheet']
        }
      ]
    }
  ],
  [
    'policyId8',
    '0.1',
    'URI read',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['Read'],
          'Resource': ['/my/site/*']
        }
      ]
    }
  ],
  [
    'policyId9',
    0.1,
    'SuperAdmin',
    'ROOT',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['*'],
          'Resource': ['*']
        }
      ]
    }
  ],
  [
    'policyId10',
    '0.1',
    'Read All users',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['Read'],
          'Resource': ['/myapp/users/*']
        }
      ]
    }
  ],
  [
    'policyId11',
    '0.1',
    'Read, Delete and Modify specific user',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['Read', 'Delete', 'Edit'],
          'Resource': ['/myapp/users/username']
        }
      ]
    }
  ],
  [
    'policyId12',
    '0.1',
    'Read and Delete teams',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['Read', 'Delete'],
          'Resource': ['/myapp/teams/*']
        }
      ]
    }
  ],
  [
    'policyId13',
    '0.1',
    'Edit teams',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': ['Edit'],
          'Resource': ['/myapp/teams/*']
        }
      ]
    }
  ],
  [
    'policyId14',
    '0.1',
    'Deny access to specif document',
    'WONKA',
    {
      'Statement': [
        {
          'Effect': 'Deny',
          'Action': ['Read'],
          'Resource': ['/myapp/documents/no_access']
        }
      ]
    }
  ]
]
