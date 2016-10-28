const options = {
  localeMatcher: 'best fit',
  usage: 'sort',
  sensitivity: 'case',
  caseFirst: 'upper'
}

export default (a, b) => {
  return a.name.localeCompare(b.name, 'kf', options)
}
