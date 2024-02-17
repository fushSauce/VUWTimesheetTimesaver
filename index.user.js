// ==UserScript==
// @name        VUW Timesheet Time Saver
// @namespace   Violentmonkey Scripts
// @match       https://vuwp.ascenderpay.com/ords/*
// @grant       none
// @version     0.1
// @author      fushSauce
// @require https://cdnjs.cloudflare.com/ajax/libs/ical.js/1.5.0/ical.min.js
// @description Copy your calendar events directly into your VUW timesheet.
// ==/UserScript==
// *********************
// Get Data
// *********************
/**
 * Listen for paste and check if we can parse it as ical data, if so, insert
 * the entries we get from ical data.
 */
addEventListener('paste', function (event) {
    var pastedData = event.clipboardData.getData('text/plain');
    var rows = document.querySelectorAll('tbody#TSEntry tr');
    try {
        // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
        ICAL.parse(pastedData);
    }
    catch (e) {
        // Ignore if not ical data
        return;
    }
    // only insert entries if we were able to parse ical data hence return in catch.
    for (var _i = 0, _a = icalToEntryList(pastedData); _i < _a.length; _i++) {
        var entry = _a[_i];
        insertEntryValues(entry, rows);
    }
});
// *********************
// Process
// *********************
var Entry = /** @class */ (function () {
    function Entry() {
    }
    return Entry;
}());
/**
 * Convert ical data to a list of entries
 * @param icalData ical data that is pasted by user
 * @returns list of entries
 */
var icalToEntryList = function (icalData) {
    // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
    var ical = ICAL.parse(icalData);
    // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
    var comp = new ICAL.Component(ical);
    var subcomponents = comp.getAllSubcomponents('vevent');
    // map ical events into entries which only contain data we need
    return subcomponents.map(function (event) {
        // @ts-expect-error Since Userscript, we use @require icaljs lib but typescript doesn't know
        event = new ICAL.Event(event);
        var startDate = convertDate(event.startDate);
        var endDate = convertDate(event.endDate);
        var startDateTime = event.startDate._time;
        var date = new Date(startDateTime.year, startDateTime.month - 1, startDateTime.day, startDateTime.hour, startDateTime.minute, startDateTime.second);
        var shortMonth = date.toLocaleString('en-nz', { month: 'short' }); /* Jun */
        var workDate = "".concat(date.getDate()
            .toString()
            // @ts-expect-error idk bruh pad start be whilin
            .padStart(2, '0'), "-").concat(shortMonth, "-").concat(date.getFullYear());
        var day = date.toLocaleString('en-NZ', { weekday: 'short' });
        var units = (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60;
        var startTime = startDate.toISOString().substring(11, 16);
        var finishTime = endDate.toISOString().substring(11, 16);
        var activity = event.summary;
        var breakLength = 0;
        var payCode = 'ORDHR';
        var dayNumber = date.getDay();
        return {
            workDate: workDate,
            day: day,
            date: date,
            dayNumber: dayNumber,
            startTime: startTime,
            finishTime: finishTime,
            breakLength: breakLength,
            units: units,
            payCode: payCode,
            activity: activity
        };
    }).sort(function (entry1, entry2) {
        if (entry1.date.getTime() < entry2.date.getTime()) {
            return -1;
        }
        else if (entry1.date.getTime() < entry2.date.getTime()) {
            return 1;
        }
        else {
            return 0;
        }
    });
};
/**
 * Convert ical.js date to vanilla JS Date to get delta in dates more easily.
 * @param icaljsDate
 * @returns JS Date instance
 */
var convertDate = function (icaljsDate) {
    return new Date(Date.UTC(icaljsDate.year, 
    // -1 because JS Date uses 0 indexed months and days
    icaljsDate.month - 1, icaljsDate.day - 1, icaljsDate.hour, icaljsDate.minute, icaljsDate.second));
};
var findNearestEmptyRow = function (rows) {
    var nearestEmptyRow;
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var workDateInput = row.querySelector("input[name='P_WORK_DATE']").value;
        if (workDateInput === '') {
            nearestEmptyRow = row;
            break;
        }
    }
    if (nearestEmptyRow === null) {
        throw new Error("Couldn't find empty row!");
    }
    return nearestEmptyRow;
};
/**
 * Finds nearest empty row and populates that row with the entry data.
 * @param entry
 * @param rows
 */
var insertEntryValues = function (entry, rows) {
    var nearestEmptyRow = findNearestEmptyRow(rows);
    // each input in the row has id and the entry property name that corresponds to it
    var idToEntryProperty = {
        'input#P_WORK_DATE': 'workDate',
        'input#P_START_TIME': 'startTime',
        'input#P_FINISH_TIME': 'finishTime',
        'input#P_BREAK': 'breakLength',
        'input#P_PAYCODE': 'payCode',
        'input#P_TOPIC_DETAILS': 'activity',
        'input#P_UNITS': 'units',
        'input#P_DAY': 'day'
    };
    // iterate inputs and set the values using the entry properties.
    Object.keys(idToEntryProperty).forEach(function (s) {
        // get given input area
        var inputArea = nearestEmptyRow.querySelector(s);
        // set value in input area to the corresponding entry property value
        inputArea.value = entry[idToEntryProperty[s]];
    });
};
// *********************
// Debugging
// *********************
/**
 * Takes ages to manually get to timesheet page when debugging, this automates
 * it, just add the date you want the timesheet to start at.
 * ex usage: debugGetToTimesheetPage('11-FEB-2024')
 * @param defaultDate
 */
function debugGetToTimesheetPage(defaultDate) {
    var generalTimesheetButton = document.querySelector("span[title='General Timesheet']");
    if (generalTimesheetButton !== null) {
        generalTimesheetButton.click();
    }
    var addTimesheetButton = document.querySelector('body p a');
    if (addTimesheetButton !== null &&
        addTimesheetButton.innerText === 'Click here to add a new timesheet') {
        addTimesheetButton.click();
    }
    var startDateInput = document.querySelector("input[name='P_START_DATE']");
    if (startDateInput !== null) {
        startDateInput.value = defaultDate;
    }
    var findEmployeeJobsButton = document.querySelector("input[value='Find Employee Jobs']");
    if (findEmployeeJobsButton !== null) {
        findEmployeeJobsButton.click();
    }
}
