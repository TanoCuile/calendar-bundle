function initializeScheduleSwitcher(base) {
    base.ScheduleSwitcher = Backbone.View.extend({
        master: null,
        schedule: null,
        rivets: null,
        initialize: function(options){
            this.master = options.master;
            this.schedule = new base.Schedule(options.schedule);
            this.rivets = rivets.bind(this.el, {schedule: this.schedule});
            this.$el.removeClass('hidden');
        },
        changeDay: function(date) {
            _.each(this.schedule.get('workDays'), function(day){
                if (day.get('dayId') == date.getDay()) {
                    ////console.log(day.get('dayId'), date.getDay());
                    day.set('current', true);
                } else {
                    day.set('current', false);
                }
            });
        }
    });
}