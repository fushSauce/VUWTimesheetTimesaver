<p align="center">
    <a href="https://github.com/fushSauce/timesheetProject" alt="Timesheet icon">
    <img src="https://cdn-icons-png.flaticon.com/512/5246/5246293.png" height="150"/></a>
</p>

<h1 align="center"> VUW Timesheet Time Saver </h1>

<h4 align="center">
    Copy your calendar events directly into your timesheet.
</h4>


<center>
    <img src="./readmeAssets/spedUpDemo.gif">
</center>

Disclaimer: This userscript isn't affiliated with VUW, I just don't like manually inputting my calendar event details into their timesheet page.

## Usage

Select the events you want to insert from your Thunderbird calendar and copy and paste the events into the VUW Timesheet page. The data will be parsed and each event will be added as a row.

## Dependencies

- A browser compatible with [Violent Monkey](https://violentmonkey.github.io/).
- [Thunderbird](https://www.thunderbird.net/en-GB/)
  - Thunderbird is presently required as it's the only calendar app (that I'm aware of) that lets you select multiple events and copy them as iCal data. Apples mac os calendar does let you select multiple but copying them doesn't give a standardised format like ical.

## Installation

Assuming Violent Monkey is being used on a Chromium browser, once file access is given to the extension, just drag `index.user.js` into the browser window and click the install button.
