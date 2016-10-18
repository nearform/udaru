const users = [
  {
    id: 1,
    name: 'Walter White',
    policies: [{
      id: 1,
      name: 'policy 1',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 2,
      name: 'policy 2',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 3,
      name: 'policy 3',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 1,
      name: 'Team Gorilla'
    }, {
      id: 3,
      name: 'Team Orangutan'
    }]
  }, {
    id: 2,
    name: 'Jesse Pinkman',
    policies: [{
      id: 1,
      name: 'policy 1',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 1,
      name: 'Team Gorilla'
    }]
  }, {
    id: 3,
    name: 'Hank Schrader',
    policies: [{
      id: 1,
      name: 'policy 1',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 2,
      name: 'policy 2',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 6,
      name: 'policy 6',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: []
  }, {
    id: 4,
    name: 'Skyler White',
    policies: [],
    teams: [{
      id: 1,
      name: 'Team Gorilla'
    }, {
      id: 2,
      name: 'Team Chimpanzee'
    }, {
      id: 3,
      name: 'Team Orangutan'
    }]
  }, {
    id: 5,
    name: 'Marie Schrader',
    policies: [{
      id: 6,
      name: 'policy 6',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 3,
      name: 'Team Orangutan'
    }]
  }, {
    id: 6,
    name: 'Gus Fring',
    policies: [{
      id: 1,
      name: 'policy 1',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 3,
      name: 'Team Orangutan'
    }]
  }, {
    id: 7,
    name: 'Mike Ehrmantraut',
    policies: [{
      id: 1,
      name: 'policy 1',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 2,
      name: 'policy 2',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 2,
      name: 'Team Chimpanzee'
    }, {
      id: 3,
      name: 'Team Orangutan'
    }]
  }, {
    id: 8,
    name: 'Saul Goodman',
    policies: [{
      id: 4,
      name: 'policy 4',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 6,
      name: 'policy 6',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 1,
      name: 'Team Gorilla'
    }, {
      id: 3,
      name: 'Team Orangutan'
    }]
  }, {
    id: 9,
    name: 'Tuco Salamanca',
    policies: [{
      id: 1,
      name: 'policy 1',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 2,
      name: 'policy 2',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 3,
      name: 'policy 3',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 4,
      name: 'policy 4',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 5,
      name: 'policy 5',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }, {
      id: 6,
      name: 'policy 6',
      resource: 'someresource',
      action: 'someaction',
      effect: 'someeffect'
    }],
    teams: [{
      id: 1,
      name: 'Team Gorilla'
    }, {
      id: 2,
      name: 'Team Chimpanzee'
    }, {
      id: 3,
      name: 'Team Orangutan'
    }]
  }
]

const policies = [
  {
    id: 1,
    name: 'policy 1',
    resource: 'someresource',
    action: 'someaction',
    effect: 'someeffect'
  },
  {
    id: 2,
    name: 'policy 2',
    resource: 'someresource',
    action: 'someaction',
    effect: 'someeffect'
  },
  {
    id: 3,
    name: 'policy 3',
    resource: 'someresource',
    action: 'someaction',
    effect: 'someeffect'
  },
  {
    id: 4,
    name: 'policy 4',
    resource: 'someresource',
    action: 'someaction',
    effect: 'someeffect'
  },
  {
    id: 5,
    name: 'policy 5',
    resource: 'someresource',
    action: 'someaction',
    effect: 'someeffect'
  },
  {
    id: 6,
    name: 'policy 6',
    resource: 'someresource',
    action: 'someaction',
    effect: 'someeffect'
  }
]

const teams = [
  {
    id: 1,
    name: 'Team Gorilla'
  },
  {
    id: 2,
    name: 'Team Chimpanzee'
  },
  {
    id: 3,
    name: 'Team Orangutan'
  }
]

export {
  users,
  policies,
  teams
}
