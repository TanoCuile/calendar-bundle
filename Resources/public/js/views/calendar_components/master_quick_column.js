function initializeMasterQuickColumn(base){
    base.MasterQuickColumn =  base.ColumnView.extend({
        offsetTop: 0,
        height: 0,
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
            currentNote.set('salon', this.model.get('id'));
            currentNote.set('date', this.calendarView.options.date);
            currentNote.set('duration', duration);
            currentNote.set('fromTime', time);
            currentNote.set('bySite', this.calendarView.options.bySite);
            currentNote.set('owner', this.model);
            currentNote.get('serviceData')['postName'] = this.model.get('name');
        },
        initializeNote: function (currentNote, time, duration) {
            if (base.ColumnView.validateNote(this.model, time, duration, null, this.calendarView.options.date)) {
                this.noteSetParameters(currentNote, duration, time);

                return this.initializeAddNoteView(currentNote);
            }
        },
        addNote: function (e, parameters) {
            e.preventDefault(true);
            e.stopPropagation(true);
            var offset = base.ColumnInfo.pixelsToTime(base.ColumnView.getDistance(e));
            var time = parameters.column.view.model.get('timeFrom') + offset - offset % 15;
            
//            var noteView = parameters.column.view.initializeNote(parameters.data.currentNote,time, parameters.column.view.getDefaultDuration(parameters));

            if (!parameters.data.currentNoteView) {
                var noteView = parameters.column.view.initializeNote(parameters.data.currentNote,time, parameters.column.view.getDefaultDuration(parameters));
            } else {
                parameters.column.view.noteSetParameters(parameters.data.currentNote, parameters.column.view.getDefaultDuration(parameters), time);

                var noteView = parameters.data.currentNoteView;
            }

            if (noteView) {
                parameters.column.showPopup = true;
                parameters.column.view.openedPopupsCount++;
                parameters.column.view.onNoteAdd.call(this, noteView, parameters.view, parameters.column.view);
            }
        },
        calculateBuffers: function () {
            _.each(this.buffers, function () {
                this.buffers.pop();
            }.bind(this));

            delete this.grid['topBuffer'];
            delete this.grid['bottomBuffer'];
            var interfaceColumn = this.interfaces[0];
            var day = this.model.get('schedule').get('workDays')[this.calendarInfo.get('currentDay').get('dayId') - 1];

            ////console.log("DAY", this.model.get('schedule'), day, this.calendarInfo.get('currentDay').get('dayId'));

            var timeTo = this.toTime;
            if (!timeTo) {
                timeTo = day.get('timeTo');
            }

            var timeFrom = this.fromTime;
            if (!timeFrom) {
                 timeFrom = day.get('timeFrom');
            }
            //console.log("TEST", timeFrom, timeTo);

            var height = base.ColumnInfo.timeToPixels(timeTo - timeFrom);
            if (day.get('active') && this.calendarInfo.get('schedule').checkSupply(this.date)) {
                ////console.log("Height", height);
                this.height = height;
                if (!this.fromTime) {
                    this.offsetTop = base.ColumnInfo.timeToPixels(timeFrom - this.calendarInfo.get('currentDay').get('fromTime'));
                }

                this.grid['topBuffer'] = { top: 0, duration: 0 };
                this.model.set('timeFrom', timeFrom);
                this.grid['bottomBuffer'] = { top: height, duration: 0 };
                this.model.set('timeTo', timeTo);

                ////console.log("Schedule", this.model);

                interfaceColumn.show = true;
            } else {
                interfaceColumn.show = false;
//                this.buffers.push(this.initializeBuffer(
//                    0,
//                    height
//                ));
            }
        },
        drag: function(column, event, ui) {
            base.MasterQuickColumn.onDrag(column, event, ui);
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
                    parameters.column.onNoteAdd.call(this, noteView);
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

            var currentNote = null;
            var currentColumn = null;

            // Getting info
            currentNote = column.view.model.getNote(noteId);

            // Process note
            if (currentNote) {
                var top = ui.position.top - column.view.grid['topBuffer'].duration;
//                    var valid = base.ColumnView.validateNote(column.view.model, currentNote.get('fromTime'), currentNote.get('duration'), currentNote.get('id'), column.date);

                currentNote.onDragStopParameters = {
                    categoryId: categoryId,
                    column: column.view,
                    dayId: dayId,
                    date: column.date,
                    top: top,
                    currentColumn: currentColumn
                };

                var valid = false;

                if (validateInsertNote(column.view, top, currentNote, column.view.calendarView.options.date)) {
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