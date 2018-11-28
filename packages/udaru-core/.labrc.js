module.exports = {
    coverage: true,
    threshold: 90,
    globals: 'URL,URLSearchParams,core,__core-js_shared__,BigUint64Array,BigInt64Array,BigInt' //ignoring for Node 10 with lab 14 (not udaru test issue), remove when lab upgraded to 15
}
