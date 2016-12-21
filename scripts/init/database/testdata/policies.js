module.exports = [
  [0.1, 'Director', 'WONKA', {
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
  [0.1, 'Accountant', 'WONKA', {
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
  [0.1, 'Sys admin', 'WONKA', {
    'Statement':
      [
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
      ]}
  ],
  [0.1, 'Finance Director', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['finance:EditBalanceSheet'],
          'Resource': ['database:pg01:balancesheet']
        }
      ]}
  ],
  [0.1, 'DB Admin', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['database:*'],
          'Resource': ['database:pg01:*']
        }
      ]}
  ],
  [0.1, 'DB Only Read', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['database:Read'],
          'Resource': ['database:pg01:*']
        }
      ]}
  ],
  [0.1, 'DB only one table', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['database:*'],
          'Resource': ['database:pg01:balancesheet']
        }
      ]}
  ],
  [0.1, 'URI read', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['Read'],
          'Resource': ['/my/site/*']
        }
      ]}
  ],
  [0.1, 'SuperAdmin', 'ROOT', {
    'Statement': [
      {
        'Effect': 'Allow',
        'Action': ['*'],
        'Resource': ['*']
      }
    ]
  }]
]
