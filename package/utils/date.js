const moment = require('moment')

const currentDate = () => moment().utc(true)
const weekAgoDate = () => currentDate().subtract(7, 'day')

const weekOfMonth = (date) =>
  date.week() - moment(date).startOf('month').week() + 1
const weeklyTitle = () => {
  const date = currentDate()
  return `${date.format('YY년 MM월')} ${weekOfMonth(date)} 주차`
}

const weeklyWorkTitle = () => workTitle(workingDay(1), workingDay(5))
const weekAgoWorkTitle = () => workTitle(weekAgoDate(), currentDate())
const workTitle = (before, current) => `${before.format('YY년 MM.DD')}~${current.format('MM.DD')}`

const workingDay = (d) => currentDate().weekday(d)
const deployDate = () => workingDay(4)
const betweenWorkingDays = (date) => {
  const pick = moment(date).utc(true)
  return pick.isSameOrAfter(workingDay(1)) && pick.isSameOrBefore(workingDay(5))
}
const betweenWeekAgoDays = (date) => {
  const pick = moment(date).utc(true)
  return pick.isSameOrAfter(weekAgoDate()) && pick.isSameOrBefore(currentDate())
}

const addDays = (d) => currentDate().add(d, 'days')

module.exports = {
  currentDate,
  weekAgoDate,
  weekOfMonth,
  weeklyTitle,
  weeklyWorkTitle,
  weekAgoWorkTitle,
  betweenWorkingDays,
  betweenWeekAgoDays,
  deployDate,
  addDays,
  moment,
}
