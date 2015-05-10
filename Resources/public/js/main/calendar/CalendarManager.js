if (!window.MainElements) {
    window.MainElements = {};
}
if (!window.MainElements.initAppCallStack) {
    window.MainElements.initAppCallStack = [];
}
window.MainElements.initAppCallStack.push(function (app) {
    app.factory('CalendarManager', [
        'CalendarData',
        'DateManager',
        'ScheduledDataFactory',
        'PlateFactory',
        'NoteManager',
        '$routeParams',
        function (calendarData, dateManager, scheduledData, plateFactory, noteManager, $routeParams) {
            function getWeekStyle() {
                var style = {};

                // Calculate height
                calculateCalendarHeight(calendarData.view.weekTimeSections, style);

                return style;
            }

            function calculateCalendarHeight(timesections, style) {
                var height = 0;
                angular.forEach(timesections, function (greatTimeSection) {
                    height += greatTimeSection.height;
                });
                style.height = height * (dateManager.timeSectionHeight + 1) + 36;
            }

            function getDayStyle() {
                var style = {};

                // Calculate height
                calculateCalendarHeight(calendarData.view.dayTimeSections, style);

                return style;
            }

            function initializeCalendarSystem() {
                // Prepare schedules
                calendarData.account.schedule = dateManager.prepareSchedule(calendarData.account.schedule);
                angular.forEach(calendarData.columns, function (column) {
                    column.schedule = dateManager.prepareSchedule(column.schedule);
                });

                // Week plates
                calendarData.weekPlates = {};
                // Day plates
                calendarData.dayPlates = {};

                calendarData.view.weekTimeSections = dateManager.getWeekTimeSections(calendarData.account.schedule);
                calendarData.view.weekStyle = getWeekStyle();

                // Set and\or prepare default date
                calendarData.changeDate(calendarData.date ? calendarData.date : new Date());
            }

            function changeWeek(date) {
                var week = dateManager.getWeekDays(date, calendarData.account.schedule);
                var weekBlanks = {};
                var weekPlates = {};

                // Initialize work blanks(column and day)
                angular.forEach(week, function (day, dayTimestamp) {
                    weekBlanks[dayTimestamp] = scheduledData.generateScheduledBlanks(day, calendarData.columns);

                    weekPlates[dayTimestamp] = {};
                    // Initialize day plates(for calendar view(work-blank and category))

                    angular.forEach(weekBlanks[dayTimestamp], function (blank) {
                        angular.forEach(blank.column.categories, function (cid) {
                            if (!weekPlates[dayTimestamp][cid]) {
                                weekPlates[dayTimestamp][cid] = {};
                            }

                            weekPlates[dayTimestamp][cid][blank.column.id] =
                                plateFactory.generatePlate(blank, calendarData.servicesHierarchy[cid]);
                        });
                    });
                });

                calendarData.weekBlanks = weekBlanks;
                calendarData.week = weekPlates;

                loadNotes(calendarData.weekBlanks);

                return week;
            }

            function loadNotes(blanks) {
                console.log("BLANKS", blanks);
            }

            function changeDay(date) {
                calendarData.currentDay = dateManager.getCurrentDayFromWeek(date, calendarData.week);

                calendarData.view.dayTimeSections = dateManager.getDayTimeSections(calendarData.account.schedule.getWorkDay(date));
                calendarData.view.dayStyle = getDayStyle();

                angular.forEach(calendarData.columns, function(column) {
                    var workDay = calendarData.account.schedule.getWorkDay(date);
                    column.setWorkDay(column.schedule.getWorkDay(date), workDay.timeFrom, workDay.timeTo);
                });
            }

            calendarData.checkDateAvailable = function (date, schedule){
                if (!dateManager.checkDateAvailable(date, schedule)) {
                    return false;
                }
            };

            calendarData.changeDate = function (date, back) {
                // Firstly prepare date
                date = dateManager.prepareDate(date);

                // Check is date available to set
                if (!calendarData.checkDateAvailable(date, calendarData.account.schedule)) {
                    date = dateManager.getAvailableDate(date, calendarData.account.schedule, calendarData.weekMode, back);
                }
                calendarData.date = date;

                // Make changes
                if (dateManager.checkDateInCurrentWeek(date, calendarData)) {
                    // Change currentDay data
                    changeDay(date);
                } else {
                    // Change week and current day data
                    changeWeek(date);

                    changeDay(date);
                }
                calendarData.dateStr = dateManager.generateDateString(date);
            };

            initializeCalendarSystem();
            console.log("CALENDAR", calendarData);

            return calendarData;
        }]);
});