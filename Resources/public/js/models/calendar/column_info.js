function initializeColumnInfo(base) {
    base.ColumnInfo = Backbone.Model.extend({
        defaults: {
            firstName: null,
            lastName: null,
            notes: null,
            schedule: null,
            active: false,
            timeFrom: null,
            timeTo: null,
            category: null,
            hardHide: false
        },
        initialize: function (options) {
//            this.set('durations', options.durations);
            this.set('category', options.category);
            this.set('timeTo', 0);
            this.set('timeFrom', 0);
            this.set('firstName', options.firstName);
            this.set('lastName', options.lastName);
            this.set('notes', []);
            if (!_.has(options.schedule, 'attributes')) {
                this.set('schedule', new base.Schedule(options.schedule));
            } else {
                this.set('schedule', options.schedule);
            }

            this.on('change:notes', this.changeNotes.bind(this));
        },
        changeNotes: function(){
            _.each(this.get('notes'), function(note, id){
                this.get('notes')[id] = new base.OrderNote(note);
            }.bind(this));
        },
        getNote: function(noteId) {
            var currentNote = null;
            _.each(this.get('notes'), function(note) {
                if (note.get('id') == noteId) {
                    currentNote = note;
                    return {};
                }
            });
            return currentNote;
        }
    }, {
        pixelsToTime: function(pixels) {
            return pixels/12*15;
        },
        timeToPixels: function (time){
            return time/15*12;
        }
    });
}