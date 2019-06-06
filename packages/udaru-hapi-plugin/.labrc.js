module.exports = {
    coverage: true,
    threshold: 99.85,
    globals: 'core,__core-js_shared__,globalThis' // ignoring for Node 10 & 12 with lab 14 (not udaru test issue), remove when lab upgraded to 15
}
