function initializeCalendarInfo(base) {
    base.CalendarInfo = Backbone.Model.extend({
        defaults: function(){
            return _.extend({}, this.baseDefaults, this.customDefaults);
        },
        baseDefaults: {
            columns: null,
            schedule: {},
            fromTime: null,
            toTime: null,
            cellHeight: 12
        },
        customDefaults: {

        },
        hours: [],
        minutes: [],
        // Use as rule: salon calendar get's borders of all master calendars
        initialize: function(options){
            for (var h = 0; h < 24; ++h){
                this.hours.push({
                    val: h,
                    label: (h < 10? '0' + h:h)
                });
            }
            for (var m = 0; m < 60; m+=15){
                this.minutes.push({
                    val: m,
                    label: (m < 10? '0' + m: m)
                })
            }

            this.set('columns', []);
            var scheduleInfo = {};
            if (options.schedule) {
                scheduleInfo = options.schedule;
            }

            if (_.has(scheduleInfo, 'attributes')) {
                this.set('schedule', scheduleInfo);
            } else {
                this.set('schedule', new base.Schedule(scheduleInfo));
            }

            this.customInitialize(options);
        }
    });
}