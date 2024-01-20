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

// function getToTimesheetPage (defaultDate): void {
//   const generalTimesheetButton: HTMLButtonElement | null =
//     document.querySelector("span[title='General Timesheet']")
//   if (generalTimesheetButton !== null) {
//     generalTimesheetButton.click()
//   }
//   const addTimesheetButton: HTMLButtonElement | null =
//     document.querySelector('body p a')
//   if (
//     addTimesheetButton !== null &&
//     addTimesheetButton.innerText === 'Click here to add a new timesheet'
//   ) {
//     addTimesheetButton.click()
//   }
//   const startDateInput: HTMLInputElement | null = document.querySelector(
//     "input[name='P_START_DATE']"
//   )
//   if (startDateInput !== null) {
//     startDateInput.value = defaultDate
//   }
//   const findEmployeeJobsButton: HTMLButtonElement | null =
//     document.querySelector("input[value='Find Employee Jobs']")
//   if (findEmployeeJobsButton !== null) {
//     findEmployeeJobsButton.click()
//   }
// }

const parseICal = (): void => {
  const tsentry = document.querySelectorAll('tbody#TSEntry tr')

  const icalString = prompt('Enter iCalendar Data')
  // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
  const ical = ICAL.parse(icalString)
  // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
  const comp = new ICAL.Component(ical)

  if (tsentry.length === 0) {
    throw new Error('No Entries!')
  }

  const subcomponents = comp.getAllSubcomponents('vevent')
  const ourEntries: any[] = []
  for (const subComponentIndex in subcomponents) {
    // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
    const sc = new ICAL.Event(subcomponents[subComponentIndex])
    let startDate = sc.startDate
    let endDate = sc.endDate

    const shortMonth = new Date(
      Date.UTC(
        startDate.year as number,
        startDate.month - 1,
        startDate.day - 1,
        startDate.hour as number,
        startDate.minute as number,
        startDate.second as number
      )
    ).toLocaleString('en-nz', {
      month: 'short',
      timeZone: 'Pacific/Auckland'
    }) /* Jun */
    const workDate = `${startDate.day
      .toString()
      .padStart(2, '0')}-${shortMonth}-${startDate.year}`

    const shortWeekday = new Date(
      Date.UTC(
        startDate.year as number,
        startDate.month - 1,
        startDate.day - 1,
        startDate.hour as number,
        startDate.minute as number,
        startDate.second as number
      )
    ).toLocaleString('en-nz', {
      weekday: 'short',
      timeZone: 'Pacific/Auckland'
    }) /* Jun */

    startDate = new Date(
      Date.UTC(
        startDate.year as number,
        startDate.month - 1,
        startDate.day - 1,
        startDate.hour as number,
        startDate.minute as number,
        startDate.second as number
      )
    )

    endDate = new Date(
      Date.UTC(
        endDate.year as number,
        endDate.month - 1,
        endDate.day - 1,
        endDate.hour as number,
        endDate.minute as number,
        endDate.second as number
      )
    )

    const nHours = (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60

    const startTime: string = startDate.toISOString().substring(11, 16)
    const endTime: string = endDate.toISOString().substring(11, 16)

    ourEntries.push({
      workDate,
      day: shortWeekday,
      startTime,
      finishTime: endTime,
      breakLength: 0,
      units: nHours,
      payCode: 'ORDHR',
      activity: sc.summary
    })
  }

  for (const entry of ourEntries) {
    insertEntryValues(entry, tsentry)
  }
}

const addICalButton = (): void => {
  const cancelButton: Element | null = document.querySelector(
    'input[value="Cancel"]'
  )

  if (cancelButton !== null) {
    cancelButton.insertAdjacentHTML(
      'afterend',
      '&nbsp;&nbsp;&nbsp;&nbsp;<input type="button" value="Pass iCal Data">'
    )
    const icalButton: HTMLButtonElement = cancelButton.nextElementSibling as HTMLButtonElement
    if (icalButton !== null) {
      icalButton.onclick = parseICal
    }
  }
}

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

addICalButton()