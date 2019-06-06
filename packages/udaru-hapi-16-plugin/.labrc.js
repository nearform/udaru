module.exports = {
    coverage: true,
    threshold: 100,
    globals: 'URL,URLSearchParams,core,__core-js_shared__,BigUint64Array,BigInt64Array,BigInt,TextEncoder,TextDecoder,queueMicrotask' //ignoring for Node 10 & 12 with lab 14 (not udaru test issue), remove when lab upgraded to 15
}
