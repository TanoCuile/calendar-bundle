function initializeWorkingNote(base) {
    base.WorkingNote = base.CalendarNote.extend({
        customDefaults: {},
        initialize: function(options){
            this.defaultInitialize(options);
        }
    })
}