const async = require('async')
const asyncify = require('./asyncify')
const registeredHooks = {}

function runHook (hook, error, args, result, done) {
  let promise = null
  if (typeof done !== 'function') [promise, done] = asyncify()

  async.each(
    registeredHooks[hook],
    (handler, next) => { // For each registered hook
      // Call the handler
      const handlerValue = handler(error, args, result, next)

      // Handle promise returns
      if (handlerValue && typeof handlerValue.then === 'function') handlerValue.then(next).catch(next)
    },
    done // Finish the call
  )

  return promise
}

function wrapWithCallback (name, original, args) {
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

function wrapWithPromise (name, original, args) {
  let hooksExecuted = false

  return original(...args) // Execute the original method
    .then((result) => {
      // Now execute hooks
      hooksExecuted = true
      return runHook(name, null, args, result).then(() => result)
    })
    .catch(error => {
      // Hooks are already executed, it means they threw an error, otherwise it comes from the original method
      const promise = hooksExecuted ? Promise.resolve() : runHook(name, error, args, null)

      // Once hooks execution is completed, return any error
      return promise.then(() => Promise.reject(error))
    })
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

  clearHook: function clearHook (name) {
    registeredHooks[name] = []
  },

  wrap: function wrap (name, original) {
    // Add the name to the list of supported hooks
    registeredHooks[name] = []

    // Return a wrapped function
    return function (...args) {
      if (typeof args[args.length - 1] !== 'function') return wrapWithPromise(name, original, args)

      wrapWithCallback(name, original, args)
    }
  }
}
