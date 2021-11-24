const mergeMap = (...maps) => maps.reduce((acc, ele) => {
  ele.forEach((v, k) => acc.set(k, [...v, ...(acc.get(k) || [])]))
  return acc
}, new Map())

const groupByKey = (arr, key) => arr.reduce((acc, elm) => {
  if (!acc[elm[key]]) acc[elm[key]] = []
  acc[elm[key]].push(elm)
  return acc
}, [])

module.exports = {
  mergeMap,
  groupByKey
}
