module.exports = function buildHooks () {
  const registered = {}

  function runHandlersCallback (done, waiting, err) {
    if (err) { // Errored
      if (waiting > 0) { // No errors propagated yet
        waiting = -1
        done(err)
      }

      return
    }

    waiting--

    if (waiting === 0) done() // No other waiting, complete
  }

  function runHandlers (name, error, args, results, done) {
    const hooks = registered[name]
    const cb = runHandlersCallback.bind(null, done, hooks.length)

    for (const hook of hooks) {
      hook(error, args, results, cb)
    }
  }

  function wrapWithCallback (name, original, args) {
    const originalCallback = args.pop() // Save the original callback

    // Call the original method with a new callback which will invoke runHook
    original.apply(this, args.concat(function () {
      const cbArgs = Array.prototype.slice.call(arguments)

      // The setImmediate call here otherwise any error in the originalCallback will trigger an unhandledRejection
      runHandlers(name, cbArgs[0], args, cbArgs.slice(1), err => {
        if (err) cbArgs[0] = err

        originalCallback.apply(null, cbArgs)
      })
    }))
  }

  function wrapWithPromise (name, original, args) {
    return new Promise((resolve, reject) => {
      return original.apply(this, args) // Execute the original method
        .then((result) => {
          runHandlers(name, null, args, result, err => {
            if (err) return reject(err)

            resolve(result)
          })
        })
        .catch(error => {
          runHandlers(name, error, args, null, err => reject(err || error))
        })
    })
  }

  return {
    registered,

    add: function add (hook, handler) {
      // Validate the arguments
      if (typeof hook !== 'string') throw new TypeError('The hook name must be a string')
      if (typeof handler !== 'function') throw new TypeError('The hook callback must be a function')
      if (!registered.hasOwnProperty(hook)) throw new Error(`${hook} hook not supported`)

      // Wrap the handler so that we can handle both callback and promises
      registered[hook].push(function (error, args, result, done) {
        const handlerValue = handler(error, args, result, done)
        if (handlerValue && typeof handlerValue.then === 'function') handlerValue.then(done).catch(done)
      })
    },

    clear: function clear (name) {
      registered[name] = []
    },

    wrap: function wrap (name, original) {
      // Add the name to the list of supported hooks
      registered[name] = []

      // Return a wrapped function
      return function () {
        const args = Array.prototype.slice.call(arguments)

        if (registered[name].length === 0) { // No hooks registered, just call the function
          return original.apply(this, args)
        } else if (typeof args[args.length - 1] !== 'function') { // Promise style
          return wrapWithPromise(name, original, args)
        }

        return wrapWithCallback(name, original, args)
      }
    }
  }
}
