function initializeCalendarNote(base) {
    base.CalendarNote = Backbone.Model.extend({
        baseDefaults: {
            fromTime: 0,
            toTime: 0,
            'duration': 0,
        },
        customDefaults: {},
        defaults: function(){
            return _.extend({}, this.baseDefaults, this.customDefaults)
        },
        baseInitialize: function(options){},
        getHoursFrom: function(){
            return this.get('fromTime')/60;
        },
        getMinutesFrom: function(){
            return this.get('fromTime')%60;
        },
        getHoursTo: function(){
            return this.get('toTime')/60;
        },
        getMinutesTo: function(){
            return this.get('toTime')%60;
        }
    })
}