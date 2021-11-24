const isEmpty = (arr) => {
  if (!Array.isArray(arr)) return true
  return !arr || !arr.length
}

const isNotEmpty = (arr) => !isEmpty(arr)

const size = arr => (isEmpty(arr) ? 0 : arr.length)

const gte = (arr, number = 0) => compareOperators('gte')(arr, number)
const gt = (arr, number = 0) => compareOperators('gt')(arr, number)
const lte = (arr, number = 0) => compareOperators('lte')(arr, number)
const lt = (arr, number = 0) => compareOperators('lt')(arr, number)

const compareOperators = (type) => (arr, min) => {
  if (isEmpty(arr)) {
    return false
  }
  return {
    gt: (a, n = 0) => size(a) > n,
    gte: (a, n = 0) => size(a) >= n,
    lt: (a, n = 0) => size(a) < n,
    lte: (a, n = 0) => size(a) <= n,
  }[type](arr, min)
}

const splitArray = (arr, size) => {
  const setArray = []
  if (isEmpty(arr)) return setArray
  const pagePerSize = Math.ceil(arr.length / size)
  for (let i = 0; i < pagePerSize; i++) {
    setArray.push(arr.slice(i * size, size * (i + 1)))
  }
  return setArray
}

module.exports = {
  gte,
  gt,
  lte,
  lt,
  isEmpty,
  isNotEmpty,
  splitArray,
}
