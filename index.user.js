// ==UserScript==
// @name        New script 
// @namespace   Violentmonkey Scripts
// @match       https://vuwp.ascenderpay.com/ords/*
// @grant       none
// @version     1.0
// @author      -
// @require https://cdnjs.cloudflare.com/ajax/libs/ical.js/1.5.0/ical.min.js
// @require https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require https://cdn.jsdelivr.net/npm/dayjs@1/plugin/customParseFormat.js
// @description 16/01/2024, 14:57:38
// ==/UserScript==

// console.log("hello world!")

// function doYaBusiness() {
//     general_timesheet_button = document.querySelector("span[title='General Timesheet']")
//     if (general_timesheet_button !== null) {
//         general_timesheet_button.click()
//     }
//     add_timesheet_button = document.querySelector("body p a")
//     if (add_timesheet_button !== null && add_timesheet_button.innerText === "Click here to add a new timesheet") {
//         add_timesheet_button.click()
//     }
//     start_date_input = document.querySelector("input[name='P_START_DATE']")
//     if (start_date_input !== null) {
//         start_date_input.value = '15-Jan-2024'
//     }
//     find_employee_jobs_button = document.querySelector("input[value='Find Employee Jobs']")
//     if (find_employee_jobs_button !== null) {
//         find_employee_jobs_button.click()
//     }
// }

// doYaBusiness()

tsentry = document.querySelectorAll("tbody#TSEntry tr")

foo = () => {
    const ical_string = prompt("Enter iCalendar Data")
    const ical = ICAL.parse(ical_string)
    const comp = new ICAL.Component(ical);

    if (tsentry.length === 0) {
        throw new Error("No Entries!")
    }

    subcomponents = comp.getAllSubcomponents("vevent")
    our_entries = []
    for (let subComponentIndex in subcomponents) {

        sc = new ICAL.Event(subcomponents[subComponentIndex])
        startDate = sc.startDate
        endDate = sc.endDate

        let shortMonth = new Date(Date.UTC(startDate.year,startDate.month-1,startDate.day-1,startDate.hour,startDate.minute,startDate.second)).toLocaleString('en-nz', { month: 'short', timeZone: 'Pacific/Auckland' }); /* Jun */
        workDate = `${startDate.day.toString().padStart(2,'0')}-${shortMonth}-${startDate.year}`

        let shortWeekday = new Date(Date.UTC(startDate.year,startDate.month-1,startDate.day-1,startDate.hour,startDate.minute,startDate.second)).toLocaleString('en-nz', { weekday: 'short', timeZone: 'Pacific/Auckland' }); /* Jun */

        startDate = new Date(Date.UTC(startDate.year,startDate.month-1,startDate.day-1,startDate.hour,startDate.minute,startDate.second))

        endDate = new Date(Date.UTC(endDate.year,endDate.month-1,endDate.day-1,endDate.hour,endDate.minute,endDate.second))

        nHours = (((endDate.getTime()-startDate.getTime())/1000)/60)/60

        startTime = startDate.toISOString().substring(11,16)
        endTime = endDate.toISOString().substring(11,16)

        our_entries.push({workDate:workDate,day:shortWeekday,startTime:startTime,finishTime:endTime,breakLength:0,units:nHours,payCode:"ORDHR",activity:sc.summary})
    }
    console.log("our Entries: ",our_entries);

    for (let entryIndex in our_entries) {
        entry = our_entries[entryIndex]
        insertEntry(entry,tsentry)
    }
}

cancelButton = document.querySelector("input[value=\"Cancel\"]")
cancelButton.insertAdjacentHTML("afterend",'&nbsp;&nbsp;&nbsp;&nbsp;<input type="button" value="Pass iCal Data" onclick="foo()">')

insertEntry = (entry,rows) => {
    // find nearest empty row
    nearest_empty_row = null
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        row = rows[rowIndex]
        work_date_input = row.querySelector("input[name='P_WORK_DATE']").value
        console.log("type: ",typeof(work_date_input))
        if (!work_date_input) {
            nearest_empty_row = row
            break
        }
    }
    if (nearest_empty_row === null) {
        throw new Error("Couldn't find empty row!")
    }
    console.log("entry: ",entry)
    console.log("ner: ",nearest_empty_row)

    work_date_input = nearest_empty_row.querySelector("input#P_WORK_DATE")
    start_time_input = nearest_empty_row.querySelector("input#P_START_TIME")
    finish_time_input = nearest_empty_row.querySelector("input#P_FINISH_TIME")
    break_input = nearest_empty_row.querySelector("input#P_BREAK")
    pay_code_input = nearest_empty_row.querySelector("input#P_PAYCODE")
    activity_input = nearest_empty_row.querySelector("input#P_TOPIC_DETAILS")
    units_input = nearest_empty_row.querySelector("input#P_UNITS")
    day_input = nearest_empty_row.querySelector("input#P_DAY")

    work_date_input.value = entry.workDate
    start_time_input.value = entry.startTime
    finish_time_input.value = entry.finishTime
    break_input.value = entry.breakLength
    pay_code_input.value = entry.payCode
    activity_input.value = entry.activity
    units_input.value = entry.units
    day_input.value = entry.day
}
