function initializeQuickColumn(base) {
    base.QuickColumn = base.ColumnView.extend({
        initialize: function (options) {
            this.interfaces = [];
            this.grid = {};
            this.notes = [];
            this.buffers = [];
            this.calendarInfo = options.calendarInfo;
            this.calendarView = options.calendarView;
            if (options.date) {
                this.date = options.date;
            } else {
                this.date = this.calendarView.options.date;
            }
            this.model = options.model;

            this.onNoteAdd = options.onNoteAdd;

//            this.calendarInfo.on('change:currentDay', this.changeCurrentDay.bind(this));
        },
        noteSetParameters: function (currentNote, duration, time) {
            currentNote.set('date', this.calendarView.options.date);
            currentNote.set('duration', duration);
            currentNote.set('fromTime', time);
            currentNote.set('bySite', this.calendarView.options.bySite);
        },
        initializeNote: function (currentNote, time, duration) {
            if (base.ColumnView.validateNote(this.model, time, duration, null, this.calendarView.options.date)) {
                this.noteSetParameters(currentNote, duration, time);
                return this.initializeAddNoteView(currentNote);
            }
        },
        initializeDefaultNote: function (time) {
            var duration = this.defaultDuration;

        },
        getDefaultDuration: function(parameters) {
            return parameters.data.currentDuration?parameters.data.currentDuration:parameters.column.view.defaultDuration;
        },
        addNote: function (e, parameters) {
            e.preventDefault(true);
            e.stopPropagation(true);
            var offset = base.ColumnInfo.pixelsToTime(base.ColumnView.getDistance(e));
            var time = parameters.calendar.options.data.get('currentDay').get('fromTime') + offset - offset % 15;

            if (!parameters.data.currentNoteView) {
                var noteView = parameters.column.view.initializeNote(parameters.data.currentNote,time, parameters.column.view.getDefaultDuration(parameters));
            } else {
                parameters.column.view.noteSetParameters(parameters.data.currentNote, parameters.column.view.getDefaultDuration(parameters), time);

                var noteView = parameters.data.currentNoteView;
            }

            if (noteView) {
                parameters.column.showPopup = true;
                parameters.column.view.openedPopupsCount++;
                parameters.column.view.onNoteAdd.call(this, noteView);
            }
        },
        calculateBuffers: function (day) {
            _.each(this.buffers, function () {
                this.buffers.pop();
            }.bind(this));

            delete this.grid['topBuffer'];
            delete this.grid['bottomBuffer'];

            if (day.get('active') && this.calendarInfo.get('schedule').checkSupply(this.date)) {
                var timeTo = day.get('timeTo');
                var timeFrom = day.get('timeFrom');

//                this.grid['topBuffer'] = { top: 0, duration: 0 };
                this.model.set('timeFrom', timeFrom);
//                this.grid['bottomBuffer'] = { top: base.ColumnInfo.timeToPixels(timeTo - timeFrom), duration: 0 };
                this.model.set('timeTo', timeTo);

                var interfaceColumn = this.interfaces[0];
                interfaceColumn.show = true;
            } else {
                var interfaceColumn = this.interfaces[0];
                interfaceColumn.show = false;
                this.buffers.push(this.initializeBuffer(
                    0,
                    base.ColumnInfo.timeToPixels(timeTo - timeFrom)
                ));
            }
        },
        drag: function(column, event, ui) {
            base.QuickColumn.onDrag(column, event, ui);
        }
    }, {
        onDrag: function(column, event, ui) {
            function getTimeOffset(column) {
                var calendarOffset = 0;
                if (!column.calendarView.fromTime) {
                    calendarOffset = column.calendarInfo.get('currentDay').get('fromTime');
                } else {
                    calendarOffset = column.calendarView.fromTime;
                }

                if (calendarOffset < column.model.get('timeFrom')) {
                    calendarOffset = column.model.get('timeFrom');
                }
                return calendarOffset;
            }

            function setTop(noteView, parameters) {
                var calendarOffset = getTimeOffset(parameters.column);
                noteView.calculateTime(parameters.top, calendarOffset);
            }

            function currentColumnDrop() {
                return function (noteView, parameters) {
                    setTop(noteView, parameters);
                    noteView.calculateOffsetTop();
                    noteView.manipulateEement(function($el){
                        $el.css('left', 0);
                    });
                    parameters.column.recalculateElement(noteView);
                    parameters.column.checkNoteOffsets(noteView.model);
                    parameters.column.onNoteAdd.call(this, noteView, true);
//                    noteView.model.save();
                };
            }

            function validateInsertNote(columnView, top, note, date) {
                var calendarOffset = getTimeOffset(columnView);

                return base.ColumnView.validateNote(columnView.model, calendarOffset + base.ColumnInfo.pixelsToTime(top), note.get('duration'), note.get('id'), date);
            }

            var draggableRevert = function(draggable){
                draggable.draggable({revert: true});
            };
            var noteId = $(ui.draggable).attr('data-note');
            var columnId = $(ui.draggable).attr('data-column');
            var dayId = $(ui.draggable).attr('data-day-id');
            var categoryId = $(ui.draggable).attr('data-category');

            var currentColumn = null;

            // Getting info
            var currentNote = column.view.model.getNote(noteId);

            // Process note
            if (currentNote) {
                var top = ui.position.top - column.view.grid['topBuffer'].duration;

                currentNote.onDragStopParameters = {
                    categoryId: categoryId,
                    column: column.view,
                    dayId: dayId,
                    date: column.date,
                    top: top,
                    currentColumn: currentColumn
                };

                var valid = false;

                if (valid = validateInsertNote(column.view, top, currentNote, column.view.calendarView.options.date)) {
                    valid = true;
                    currentNote.onDragStop = currentColumnDrop();
                }
                if (!valid) {
                    draggableRevert(ui.draggable);
                    return false;
                }
                return true;
            } else {
                draggableRevert(ui.draggable);
                return false;
            }
        }
    });
}