// ==UserScript==
// @name        Ascender Pay iCalendar import
// @namespace   Violentmonkey Scripts
// @match       https://vuwp.ascenderpay.com/ords/*
// @grant       none
// @version     1.0
// @author      -
// @require https://cdnjs.cloudflare.com/ajax/libs/ical.js/1.5.0/ical.min.js
// @description 16/01/2024, 14:57:38
// ==/UserScript==

class Entry {
  workDate: string
  day: string
  date: string
  dayNumber: string
  startTime: string
  finishTime: string
  breakLength: string
  units: string
  payCode: string
  activity: string
}

const icalToEntryList = (icalData): Entry[] => {
  // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
  const ical = ICAL.parse(icalData)
  // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
  const comp = new ICAL.Component(ical)
  const subcomponents = comp.getAllSubcomponents('vevent')

  // map ical events into entries which only contain data we need
  return subcomponents.map((event) => {
    // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
    event = new ICAL.Event(event)

    const startDate = convertDate(event.startDate)
    const endDate = convertDate(event.endDate)
    const startDateTime: any = event.startDate._time
    const date = new Date(startDateTime.year as number, startDateTime.month - 1, startDateTime.day as number, startDateTime.hour as number, startDateTime.minute as number, startDateTime.second as number)
    const shortMonth = date.toLocaleString('en-nz', { month: 'short' }) /* Jun */

    const workDate = `${date.getDate()
      .toString()
      // @ts-expect-error idk bruh pad start be whilin
      .padStart(2, '0')}-${shortMonth}-${date.getFullYear()}`
    const day = date.toLocaleString('en-NZ', { weekday: 'short' })
    const units = (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60
    const startTime: string = startDate.toISOString().substring(11, 16)
    const finishTime: string = endDate.toISOString().substring(11, 16)
    const activity = event.summary
    const breakLength = 0
    const payCode = 'ORDHR'
    const dayNumber = date.getDay()

    return {
      workDate,
      day,
      date,
      dayNumber,
      startTime,
      finishTime,
      breakLength,
      units,
      payCode,
      activity
    }
  }).sort((entry1, entry2) => {
    if (entry1.date.getTime() < entry2.date.getTime()) {
      return -1
    } else if (entry1.date.getTime() < entry2.date.getTime()) {
      return 1
    } else {
      return 0
    }
  })
}

/**
 * Convert ical.js date to vanilla JS Date to get delta in dates more easily.
 * @param icaljsDate
 * @returns JS Date instance
 */
const convertDate = (icaljsDate): Date => {
  return new Date(
    Date.UTC(
      icaljsDate.year as number,
      // -1 because JS Date uses 0 indexed months and days
      icaljsDate.month - 1,
      icaljsDate.day - 1,
      icaljsDate.hour as number,
      icaljsDate.minute as number,
      icaljsDate.second as number
    )
  )
}

const findNearestEmptyRow = (rows): Element => {
  let nearestEmptyRow: Element | null = null

  for (const row of rows) {
    const workDateInput: string = row.querySelector("input[name='P_WORK_DATE']").value
    if (workDateInput === '') {
      nearestEmptyRow = row
      break
    }
  }
  if (nearestEmptyRow === null) {
    throw new Error("Couldn't find empty row!")
  }
  return nearestEmptyRow
}

/**
 * Finds nearest empty row and populates that row with the entry data.
 * @param entry
 * @param rows
 */
const insertEntryValues = (entry, rows): void => {
  const nearestEmptyRow = findNearestEmptyRow(rows)

  // each input in the row has id and the entry property name that corresponds to it
  const idToEntryProperty = {
    'input#P_WORK_DATE': 'workDate',
    'input#P_START_TIME': 'startTime',
    'input#P_FINISH_TIME': 'finishTime',
    'input#P_BREAK': 'breakLength',
    'input#P_PAYCODE': 'payCode',
    'input#P_TOPIC_DETAILS': 'activity',
    'input#P_UNITS': 'units',
    'input#P_DAY': 'day'
  }

  // iterate inputs and set the values using the entry properties.
  Object.keys(idToEntryProperty).forEach((s) => {
    // get given input area
    const inputArea: HTMLInputElement = nearestEmptyRow.querySelector(s)
    // set value in input area to the corresponding entry property value
    inputArea.value = entry[idToEntryProperty[s]]
  })
}

/**
 * Listen for paste and check if we can parse it as ical data.
 */
addEventListener('paste', (event) => {
  const pastedData: string = event.clipboardData.getData('text/plain')
  const rows = document.querySelectorAll('tbody#TSEntry tr')
  for (const entry of icalToEntryList(pastedData)) {
    insertEntryValues(entry, rows)
  }
})

// debugGetToTimesheetPage('11-Feb-2024')

// *********************
// Debugging
// *********************

/**
 * Takes ages to manually get to timesheet page when debugging, this automates 
 * it, just add the date you want the timesheet to start at.
 * ex usage: debugGetToTimesheetPage('11-FEB-2024')
 * @param defaultDate
 */
function debugGetToTimesheetPage (defaultDate): void {
  const generalTimesheetButton: HTMLButtonElement | null =
    document.querySelector("span[title='General Timesheet']")
  if (generalTimesheetButton !== null) {
    generalTimesheetButton.click()
  }
  const addTimesheetButton: HTMLButtonElement | null =
    document.querySelector('body p a')
  if (
    addTimesheetButton !== null &&
    addTimesheetButton.innerText === 'Click here to add a new timesheet'
  ) {
    addTimesheetButton.click()
  }
  const startDateInput: HTMLInputElement | null = document.querySelector(
    "input[name='P_START_DATE']"
  )
  if (startDateInput !== null) {
    startDateInput.value = defaultDate
  }
  const findEmployeeJobsButton: HTMLButtonElement | null =
    document.querySelector("input[value='Find Employee Jobs']")
  if (findEmployeeJobsButton !== null) {
    findEmployeeJobsButton.click()
  }
}
