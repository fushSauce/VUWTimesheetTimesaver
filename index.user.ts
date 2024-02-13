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

const parseICal = (icalData): any[] => {
  const rows = document.querySelectorAll('tbody#TSEntry tr')

  // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
  const ical = ICAL.parse(icalData)
  // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
  const comp = new ICAL.Component(ical)

  if (rows.length === 0) {
    throw new Error('No Entries!')
  }

  const subcomponents = comp.getAllSubcomponents('vevent')
  const ourEntries: any[] = []
  for (let sc of subcomponents) {
    // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
    sc = new ICAL.Event(sc)

    console.log('sc: ', sc)
    console.log(sc.startDate._time)

    const startDate = convertDate(sc.startDate)
    const endDate = convertDate(sc.endDate)
    const foo: any = sc.startDate._time

    const date = new Date(foo.year as number, foo.month - 1, foo.day as number, foo.hour as number, foo.minute as number, foo.second as number)

    const shortMonth = date.toLocaleString('en-nz', { month: 'short' }) /* Jun */


    const workDate = `${date.getDate()
      .toString()
      // @ts-expect-error idk bruh pad start be whilin
      .padStart(2, '0')}-${shortMonth}-${date.getFullYear()}`

    const day = date.toLocaleString('en-NZ', { weekday: 'short' }) 

    const units = (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60

    const startTime: string = startDate.toISOString().substring(11, 16)
    const finishTime: string = endDate.toISOString().substring(11, 16)
    const activity = sc.summary
    const breakLength = 0
    const payCode = 'ORDHR'
    const dayNumber = date.getDay()

    ourEntries.push({
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
    })
    // sort by week day
    ourEntries.sort((a, b) => {
      if (a.date.getTime() < b.date.getTime()) {
        return -1
      } else if (a.date.getTime() < b.date.getTime()) {
        return 1
      } else {
        return 0
      }
    })
  }
  console.log('ourEntries: ', ourEntries)

  return ourEntries
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

const addICalButton = (): void => {
  const cancelButton: Element | null = document.querySelector(
    'input[value="Cancel"]'
  )

  if (cancelButton !== null) {
    cancelButton.insertAdjacentHTML(
      'afterend',
      '&nbsp;&nbsp;&nbsp;&nbsp;<input type="button" value="Pass iCal Data" onclick="">'
    )
    const icalButton: HTMLButtonElement = cancelButton.nextElementSibling as HTMLButtonElement
    if (icalButton !== null) {
      icalButton.onclick = processICalData
    }
  }
}

/**
 * Finds nearest empty row and populates that row with the entry data.
 * @param entry
 * @param rows
 */
const insertEntryValues = (entry, rows): void => {
  // find nearest empty row
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

  const workDateInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_WORK_DATE')
  const startTimeInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_START_TIME')
  const finishTimeInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_FINISH_TIME')
  const breakInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_BREAK')
  const payCodeInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_PAYCODE')
  const activityInput: HTMLInputElement | null = nearestEmptyRow.querySelector(
    'input#P_TOPIC_DETAILS'
  )
  const unitsInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_UNITS')
  const dayInput: HTMLInputElement | null =
    nearestEmptyRow.querySelector('input#P_DAY')

  if (
    workDateInput === null ||
    startTimeInput === null ||
    finishTimeInput === null ||
    breakInput === null ||
    payCodeInput === null ||
    activityInput === null ||
    unitsInput === null ||
    dayInput === null
  ) {
    throw new Error("Can't find all inputs for timesheet entry.")
  }

  workDateInput.value = entry.workDate
  startTimeInput.value = entry.startTime
  finishTimeInput.value = entry.finishTime
  breakInput.value = entry.breakLength
  payCodeInput.value = entry.payCode
  activityInput.value = entry.activity
  unitsInput.value = entry.units
  dayInput.value = entry.day
}

const processICalData = (icalData): void => {
  const rows = document.querySelectorAll('tbody#TSEntry tr')
  for (const entry of parseICal(icalData)) {
    insertEntryValues(entry, rows)
  }
}

/**
 * Listen for paste and check if we can parse it as ical data.
 */
addEventListener('paste', (event) => {
  const pastedData: string = event.clipboardData.getData('text/plain')
  try {
    // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
    ICAL.parse(pastedData)
    const rows = document.querySelectorAll('tbody#TSEntry tr')
    if (rows !== null) {
      processICalData(pastedData)
    }
  } catch (e: any) {
    // Ignore errors parsing as that just means pasted content wasn't ical data
  }
})

// addICalButton()
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
