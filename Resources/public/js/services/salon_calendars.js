(function($){
    function initializeCalendarSystem() {
        initializeEvenMasterModel(CalendarSystem);
        initializeCalendarNote(CalendarSystem);
        initializeWorkingNote(CalendarSystem);
        initializeOrderNote(CalendarSystem);
        initializeCalendar(CalendarSystem);
        var calendars = [];
        _.each(CalendarSystem.calendarInfo, function initCalendar(calendarData){
            calendars.push(new CalendarSystem.Calendar(calendarData));
        });
        initializeCalendarWidgetView(CalendarSystem);
        initializeCalendarView(CalendarSystem);
        initializeRivetsCalendar(CalendarSystem);
        initializeCalendarListView(CalendarSystem);
        CalendarSystem.calendars = new CalendarSystem.CalendarList({
            el: $('.calendar-list')[0],
            calendars: calendars
        });
    }
    $(document).ready(function(){
        setTimeout(initializeCalendarSystem, 1);
    });
})(jQuery);