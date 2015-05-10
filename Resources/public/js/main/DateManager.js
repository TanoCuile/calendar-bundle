if (!window.MainElements) {
    window.MainElements = {};
}
if (!window.MainElements.initAppCallStack) {
    window.MainElements.initAppCallStack = [];
}
window.MainElements.initAppCallStack.push(function(app){
    app.factory('DateManager', [
        function(){
            function Schedule(scheduleData) {
                angular.extend(this, scheduleData);

                this.getSupplyBoundaries = function() {
                    var from = null;
                    var to = null;

                    function parseSupply(supply) {
                        return {
                            month: Math.floor(supply/100),
                            day: supply % 100
                        }
                    }

                    if (scheduleData.supplyFrom) {
                        from = parseSupply(scheduleData.supplyFrom);
                    }
                    if (scheduleData.supplyTo) {
                        to = parseSupply(scheduleData.supplyTo);
                    }

                    return {
                        from: from,
                        to: to
                    };
                };

                this.getWorkDay = function (date) {
                    if (this.workDays[date.isoWeekday()]) {
                        return this.workDays[date.isoWeekday()];
                    }
                    return null;
                };
            }
            return {
                timeSectionDuration: 15,
                timeSectionHeight: 12,
                prepareSchedule: function(scheduleInfo) {
                    return new Schedule(scheduleInfo);
                },
                prepareDate: function(date) {
                    if(!date) {
                        return moment();
                    }
                    return moment(date);
                },
                checkSupply: function (date, schedule) {
                    var supply = schedule.getSupplyBoundaries();
                    if (supply.from && supply.to
                        (supply.from.month > date.month()
                            || (supply.from.month == date.month()
                            && supply.from.day > date.date()))
                        && (supply.to.month < date.month()
                        || (supply.to.month == date.month()
                        && supply.to.day < date.date()))) {
                        return true;
                    } else if (supply.from) {
                        if (supply.from.month > date.month()
                            || (supply.from.month == date.month()
                            && supply.from.day > date.date())) {
                            return true;
                        }
                    } else if (supply.to) {
                        if (supply.to.month < date.month()
                            || (supply.to.month == date.month()
                            && supply.to.day < date.date())) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                    return false;
                },
                checkDateAvailable: function (date, schedule, week) {
                    if (!week) {
                        if (schedule.getWorkDay(date) && this.checkSupply(date, schedule)) {
                            return true;
                        }
                    } else {
                        var startWeek = date.startOf('week');
                        var endWeek = date.endOf('week');
                        if (this.checkSupply(startWeek, schedule) || this.checkSupply(endWeek, schedule)) {
                            var available = true;
                            // TODO: Check any work day
                            return available;
                        }
                    }
                    return false;
                },
                getAvailableDate: function (date, schedule, weekStep, moveBack) {
                    var step = !weekStep ? 1 : 7;

                    if (moveBack)
                        step = -1 * step;

                    var i = 0;

                    while (i < 365) {
                        // Increase date and check it availability
                        date = date.add(step, 'd');

                        if (this.checkDateAvailable(date, schedule, weekStep)) {
                            return date;
                        }
                        i++;
                    }
                },
                checkDateInCurrentWeek: function (date, week) {
                    return !!week[date.startOf('day')];
                },
                getWeekDays: function (date, schedule) {
                    var startDay = date.startOf('week');
                    var week = {};

                    for (var i = 1; i < 7; ++i) {
                        var currentDay = startDay.add(i, 'day');
                        if (schedule.workDays[i - 1] && this.checkSupply(currentDay, schedule)) {
                            week[currentDay.unix()] = schedule.workDays[i - 1];
                        }
                    }

                    return week;
                },
                getCurrentDayFromWeek: function(date, week) {
                    if (week[date.startOf('day').unix()]) {
                        return week[date.startOf('day').unix()];
                    }
                    return null;
                },
                getWeekTimeSections: function(schedule) {
                    var view = this;
                    var from = null;
                    var to = null;

                    angular.forEach(schedule.workDays, function(workDay){
                        if (workDay.timeFrom < from || from == null) {
                            from = workDay.timeFrom;
                        }
                        if (workDay.timeTo > to || to == null) {
                            to = workDay.timeTo;
                        }

                        return view.calculateTimeSections(from, to);
                    });
                },
                getDayTimeSections: function(dayInfo) {
                    return this.calculateTimeSections(dayInfo.timeFrom, dayInfo.timeTo);
                },
                setGreatTimeStateOptions: function (greatTimeSections, greatSectionId) {
                    greatTimeSections[greatSectionId].height = greatTimeSections[greatSectionId].sections.length;
                    greatTimeSections[greatSectionId].display = {
                        height: greatTimeSections[greatSectionId].height * this.timeSectionHeight
                    };
                },
                calculateTimeSections: function(from, to) {
                    var greatTimeSections = {};

                    var newSection = true;
                    var greatSectionId = from;
                    var odd = false;
                    for (var i = from; i < to; i += this.timeSectionDuration) {
                        if (newSection) {
                            if (greatTimeSections[greatSectionId]) {
                                // Setting last section height
                                this.setGreatTimeStateOptions(greatTimeSections, greatSectionId);
                            }
                            // Setting new section
                            greatSectionId = i;
                            greatTimeSections[greatSectionId] = {
                                time: this.formatTime(i),
                                odd: odd,
                                sections: []
                            };
                            odd = !odd;
                        }

                        greatTimeSections[greatSectionId].sections.push({
                            time: this.formatTime(i),
                            display: {
                                height: this.timeSectionHeight
                            }
                        });
                        newSection = i % 60 == 45;
                    }
                    this.setGreatTimeStateOptions(greatTimeSections, greatSectionId);

                    return greatTimeSections;
                },
                formatTime: function(time) {
                    return Math.floor(time/60) + ':' + (time%60 > 10?time%60:'00');
                },
                timeToPixel: function(time) {
                    return time / this.timeSectionDuration * this.timeSectionHeight;
                },
                pixelToTime: function(pixels) {
                    return pixels / this.timeSectionHeight * this.timeSectionDuration;
                },
                generateDateString: function(date) {
                    var cDate = moment();
                    if (cDate.year() != date.year()) {
                        return date.format('D dd MM YYYY');
                    } else if (cDate.month() != date.month()) {
                        return date.format('D dd, MMMM');
                    } else {
                        return date.format('D dddd');
                    }
                }
            };
        }]);
});