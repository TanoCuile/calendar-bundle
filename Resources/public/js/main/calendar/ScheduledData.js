if (!window.MainElements) {
    window.MainElements = {};
}
if (!window.MainElements.initAppCallStack) {
    window.MainElements.initAppCallStack = [];
}
MainElements.initAppCallStack.push(function(app){

    app.factory('ScheduledDataFactory', ['NoteManager', 'DateManager', function(noteManager, dateManager){
        var ScheduledData = function(day, column){
            this.day = day;
            this.column = column;
            this.plates = {};
            this.notes = {};

            this.createNote = function(startTime, duration) {
                var note = noteManager.prepareNote(noteManager.getDefaultNoteInfo());
                note.blank = this;
                note.setDuration(duration);
                note.setFromTime(startTime);

                this.notes[note.id] = note;
            };
            this.getPlanStart = function() {
                return this.column.getTopBoundary();
            };

            this.checkPlane = function(fromTime, duration, noteId) {
                var valid = true;

                if (this.column.getTopBoundary() > fromTime) {
                    return false;
                }

                if (this.column.getBottomBoundary() < fromTime + duration) {
                    return false;
                }

                var top = 0;
                var bottom = 0;

                // Offset defaults
                var offsetTop = false;
                var offsetBottom = false;
                var fromTimeOffset = fromTime + dateManager.timeSectionDuration;
                var toTime = fromTime + duration;
                var toTimeOffset = fromTime + duration -  - dateManager.timeSectionDuration;

                // Check collapsing with other notes
                angular.forEach(this.notes, function(note) {
                    if (!valid) return null;
                    if (noteId && note.id !== noteId) {
                        top = note.getFromTime();
                        bottom = note.getDuration() + top;

                        // Check valid with offsets
                        if ((top < fromTimeOffset && bottom > fromTimeOffset)
                            || (top < toTimeOffset && bottom > toTimeOffset)) {
                            valid = false;
                        }

                        // Check offsets
                        if (top < fromTime && bottom > fromTime) {
                            offsetTop = true;
                        }
                        if (top < toTimeOffset && bottom > toTimeOffset) {
                            offsetBottom = true;
                        }

                        // If both offsets invalid place
                        if (offsetBottom && offsetTop) {
                            valid = false;
                        }
                    }
                });

                // If invalid
                if (!valid) {
                    return false;
                }

                // Offsets
                if (offsetBottom) {
                    return 3;
                } else if (offsetTop) {
                    return 2;
                }

                return true;
            };
        };
        return {
            generateScheduledBlanks: function(day, columns) {
                var scheduledData = {};

                angular.forEach(columns, function(column, columnId) {
                    scheduledData[columnId] = new ScheduledData(day, column);
                });

                return scheduledData;
            },
            setNotes: function(notes) {

            }
        };
    }]);
});