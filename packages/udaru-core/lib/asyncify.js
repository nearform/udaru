module.exports = function (...names) {
  let promiseResolve = null
  let promiseReject = null

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  const cb = function (err, ...args) {
    if (err) return promiseReject(err)
    if (!names.length) return promiseResolve(args[0])

    const obj = {}
    for (let i = 0; i < names.length; i++) {
      obj[names[i]] = args[i]
    }

    promiseResolve(obj)
  }

  return [promise, cb]
}