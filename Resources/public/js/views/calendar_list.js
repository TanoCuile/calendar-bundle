function initializeCalendarListView(base) {
    base.CalendarList = Backbone.View.extend({
        calendars: null,
        initialize: function(options){
            this.calendars = options.calendars;
            if (!this.calendars) {
                this.calendars = [];
            }
            this.render();
        },
        addCalendar: function(e, params) {
            e.preventDefault(true);
            params.view.calendars.push(new base.Calendar({

            }));
        },
        render: function(){
            ////console.log('Render', this);
            ////console.log(this.$el);
            rivets.bind(this.$el[0], {
                view: this
            });
        }
    });
}