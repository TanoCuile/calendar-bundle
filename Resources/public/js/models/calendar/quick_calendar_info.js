function initializeQuickCalendarInfo(base){
    base.DayCalendarInfo = base.CalendarInfo.extend({
        customInitialize: function(options) {
        },

        getColumn: function(columnId, cid) {
            return this.get('columns')[0];
        }
    })
}