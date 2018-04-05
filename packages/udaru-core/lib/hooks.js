module.exports = function buildHooks () {
  const registered = {}

  function runHook (hook, error, args, result) {
    const hooks = registered[hook]

    return Promise.all(hooks.map(h => h(error, args, result))) // Execute all hooks, in parallels
  }

  function wrapWithCallback (name, original, args) {
    const originalCallback = args.pop() // Save the original callback

    // Call the original method with a new callback which will invoke runHook
    original.apply(this, args.concat(function () {
      const cbArgs = Array.prototype.slice.call(arguments)

      // The setImmediate call here otherwise any error in the originalCallback will trigger an unhandledRejection
      runHook(name, cbArgs[0], args, cbArgs.slice(1))
        .then(() => {
          cbArgs.unshift(originalCallback)
          setImmediate.apply(null, cbArgs)
        })
        .catch(err => {
          cbArgs[0] = err

          cbArgs.unshift(originalCallback)
          setImmediate.apply(null, cbArgs)
        })
    }))
  }

  function wrapWithPromise (name, original, args) {
    let hooksExecuted = false

    return original.apply(this, args) // Execute the original method
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

  return {
    registered,

    add: function add (hook, handler) {
      // Validate the arguments
      if (typeof hook !== 'string') throw new TypeError('The hook name must be a string')
      if (typeof handler !== 'function') throw new TypeError('The hook callback must be a function')
      if (!registered.hasOwnProperty(hook)) throw new Error(`${hook} hook not supported`)

      // Make sure the hooks is in promises form
      const finalHandler = function (error, args, result, done) {
        let promiseResolve
        let promiseReject

        const promise = new Promise((resolve, reject) => {
          promiseResolve = resolve
          promiseReject = reject
        })

        const handlerValue = handler(error, args, result, err => {
          if (err) return promiseReject(err)

          promiseResolve()
        })

        return (handlerValue && typeof handlerValue.then === 'function') ? handlerValue : promise
      }

      // Add the handler to the list of registered handlers
      registered[hook].push(finalHandler)
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

        if (registered[name].length === 0) {
          return original.apply(this, args)
        } else if (typeof args[args.length - 1] !== 'function') {
          return wrapWithPromise(name, original, args)
        }

        return wrapWithCallback(name, original, args)
      }
    }
  }
}
