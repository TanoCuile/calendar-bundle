function initializeCalendar(base) {
    base.Calendar = Backbone.Model.extend({
        defaults: {
            masters: [],
            notes: []
        },
        initialize: function(options){
            if (!this.get('id')) {
                this.set('id', Math.random().toString(36).substring(10));
            }
            this.set('evenMasters', new Backbone.Collection([], {
                model: base.EvenMaster
            }));
            if (options.eventMasters && options.evenMasters.length > 0) {
                _.each(options.EvenMaster, function(master){
                    this.get('evenMasters').add(master);
                }.bind(this));
            }
            this.set('notes', new Backbone.Collection([], {
                model: base.EvenMaster
            }));
            if (options.notes && options.notes.length > 0) {
                this.get('notes').add(options.notes);
            }
        }
    })
}