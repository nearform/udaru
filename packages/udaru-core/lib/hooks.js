const async = require('async')
const registeredHooks = {}

function runHook (hook, error, args, result, done) {
  async.each(
    registeredHooks[hook],
    (handler, next) => { // For each registered hook
      // Call the handler
      handler(error, args, result, next)
    },
    done // Finish the call
  )
}

module.exports = {
  registeredHooks,

  addHook: function addHook (hook, handler) {
    // Validate the arguments
    if (typeof hook !== 'string') throw new TypeError('The hook name must be a string')
    if (typeof handler !== 'function') throw new TypeError('The hook callback must be a function')
    if (!registeredHooks.hasOwnProperty(hook)) throw new Error(`${hook} hook not supported`)

    // Add the handler to the list of registered handlers
    registeredHooks[hook].push(handler)
  },

  wrap: function wrap (name, original) {
    // Add the name to the list of supported hooks
    registeredHooks[name] = []

    // Return a wrapped function
    return function (...args) {
      const originalCallback = args.pop() // Save the original callback
      const originalArgs = Array.from(args) // Save the original arguments

      args.push((error, ...result) => { // Add the new callback to the udaru method
        runHook(name, error, originalArgs, result, (err) => { // Run all hooks
          originalCallback(error || err, ...result) // Call the original callback with the error either from the udaru method or from one of the hooks
        })
      })

      // Call the original method
      original(...args)
    }
  }
}
