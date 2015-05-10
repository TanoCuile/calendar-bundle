function initializeCalendarInfo(base) {
    base.CalendarInfo = Backbone.Model.extend({
        defaults: {
            activeMasters: [],
            activeJob: {},
            activeDurations: {},
            notes: []
        },
        getMaster: function(id){
            var master = null;
            _.each(this.get('activeMasters'), function(masterObj){
                if (masterObj.get('id') == id) {
                    master = masterObj;
                    return {};
                }
            });
            return master;
        },
        initialize: function(options) {

        }
    })
}