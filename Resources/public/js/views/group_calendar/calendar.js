// Requires jQuery and Backbone
function initializeGroupCalendar(base) {
    initializeBaseNoteView(base);
    initializeNoteView(base);
    initializeDayContainerView(base);
    initializeColumnView(base);

    base.GroupCalenarView = Backbone.View.extend({
        baseSchedule: null,

        // rivets bind data
        bindData: null,

        // Options for rivets
        defaultRenderOptions: {},
        renderOptions: {},

        // Encapsulated calendar interface
        defaultTrigger: {},
        calendarTrigger: null,

        /**
         * Required:
         * Schedule
         **/
        initialize: function(options) {
            this.baseSchedule = options.schedule;
            this.calendarTrigger = new CalendarTrigger(this.defaultTrigger, this);

            this.renderOptions = _.extend({}, this.defaultRenderOptions, viewListener);

            this.initializeDayContainers(options);

            this.customInitialize(options);

            this.changeDate();
        },
        customInitialize: function(options) {
        },

        changeDate: function() {

        },

        initializeDayContainers: function(options) {
            this.renderOptions.days = [];

            this.renderOptions.days.push(new base.DayContainerView(this, {
                'message': 'TEST'
            }))
        },

        // return NoteView
        createNote: function() {

        }
    });

    var CalendarTrigger = function(customOptions, calendar) {

    };

    var viewListener = {

    };
}