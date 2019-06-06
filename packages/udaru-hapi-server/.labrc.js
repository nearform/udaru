module.exports = {
    coverage: false,
    globals: 'core,__core-js_shared__,queueMicrotask' // ignoring for Node 12 with lab 14 (not udaru test issue), remove when lab upgraded to 15
}
