module.exports = {
    coverage: true,
    threshold: 96,
    globals: 'URL,URLSearchParams' //ignoring for node 10 with lab 14 (not udaru test issue), remove when lab upgraded to 15
}