function initializeColumn(base) {
    var staticProps = {
        validateNote: function (columnInfo, time, duration, noteId, date, proposeData) {
//            //console.log('Pre validate', columnInfo, columnInfo.get('timeFrom'), columnInfo.get('timeTo'));
            return base.OrderNote.validate(columnInfo.get('timeFrom'), columnInfo.get('timeTo'), columnInfo.get('notes'), time, time + duration, noteId, date, proposeData);
        },
        getNoteInfo: function (column, noteId, columnId, cid) {
            var currentNote = null;
            if (column.model.get('id') == columnId && column.model.get('category') == cid) {
                currentNote = column.model.getNote(noteId);
            } else {
                var currentColumn = column.calendarInfo.getColumn(columnId, cid);
                if (currentColumn) {
                    currentNote = currentColumn.getNote(noteId);
                } else {
                    console.error('Column not found', columnId, column);
                }
            }
            return currentNote;
        },
        getOnDragDistance: function(event) {
            var distance = event.pageY - $(event.target).offset().top;
            return distance;
        },
        getDistance: function (event) {
            if (event.gesture) {
                return event.gesture.center.y;
            }
            var distance = event.offsetY || event.pageY - $(event.target).offset().top;
            if (event.target.tagName == 'DIV') {
                distance = $(event.target).position().top + distance;
            }
            return distance;
        },
        onDrag: function(column, event, ui) {

            function AnotherColumnDrop(currentColumn, currentNote) {
                return function (noteView, parameters) {
                    var currentColumnView = parameters.column.calendarView.getColumnView(currentColumn.get('id'), parameters.categoryId, parameters.dayId);
                    if (currentColumnView) {
                        noteView.manipulateEement(function($el){
                            $el.css('left', 0);
                        });

                        currentColumnView.removeNoteView(currentNote);
                        currentColumnView.removeNote(currentNote);

                        noteView.model.set('owner', {
                            id: column.view.model.get('id')
                        });

                        if (parameters.date && parameters.date.day) {
                            noteView.model.set('date', parameters.date.day);
                        }
                        parameters.column.removeFromGrid(currentNote);

                        column.view.initializeAddNoteView(currentNote, noteView);
                        setTop(noteView, parameters);
//                    noteView.calculateTime(parameters.top, parameters.column.calendarInfo.get('currentDay').get('fromTime'));

                        noteView.calculateOffsetTop();
                        column.view.recalculateElement(noteView);
                        //console.log("CurrentNote", currentNote);
                        if (!currentNote.get('new')) {
                            currentNote.save();
                        }
                    }
                };
            }

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
                    //console.log("PARAMETERS", parameters);
                    setTop(noteView, parameters);
                    noteView.calculateOffsetTop();
                    noteView.manipulateEement(function($el){
                        $el.css('left', 0);
                    });
                    parameters.column.recalculateElement(noteView);
                    parameters.column.checkNoteOffsets(noteView.model);
                    if (!currentNote.get('new')) {
                        noteView.model.save();
                    }
                };
            }

            function validateInsertNote(columnView, top, note, date) {
                var calendarOffset = getTimeOffset(columnView);

                return base.ColumnView.validateNote(columnView.model, calendarOffset + base.ColumnInfo.pixelsToTime(top), note.get('duration'), note.get('id'), date, note.get('propose'));
            }
            var noteId = $(ui.draggable).attr('data-note');
            var columnId = $(ui.draggable).attr('data-column');
            var dayId = $(ui.draggable).attr('data-day-id');
            var categoryId = $(ui.draggable).attr('data-category');

            var currentNote = null;
            var currentColumn = null;

            // Getting info
            if (column.view.model.get('id') == columnId && ((dayId && column.workDay == dayId) || (categoryId && column.view.model.get('category') == categoryId))) {
                currentNote = column.view.model.getNote(noteId);
            } else {
                currentColumn = column.view.calendarInfo.getColumn(columnId, categoryId, dayId);
                if (currentColumn) {
                    currentNote = currentColumn.getNote(noteId);
                } else {
                    console.error('Column not found', columnId, column.view);
                }
            }

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

//                    if (!valid) {
//                        draggableRevert(ui.draggable);
//                        return false;
//                    } else {
                var valid = false;
                if (currentColumn) {
                    if (validateInsertNote(currentColumn, top, currentNote, column.date)) {
                        valid = true;
                        currentNote.onDragStop = AnotherColumnDrop(currentColumn, currentNote);
                    }
                } else {
                    if (validateInsertNote(column.view, top, currentNote, column.date)) {
                        valid = true;
                        currentNote.onDragStop = currentColumnDrop();
                    }
                }
//                    }
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
    };
    var BaseColumn = {
        calendarInfo: null,
        calendarView: null,
        buffers: null,
        regions: null,
        notes: null,
        defaultDuration: 60,
        height: 0,
        // simplified grid for calculating column notes
        grid: null,
        interfaces: null,
        openedPopupsCount: 0,
        initialize: function (options) {
            this.interfaces = [];
            this.grid = {};
            this.notes = [];
            this.buffers = [];
            this.regions = [];
            this.calendarInfo = options.baseInfo;
            this.calendarView = options.calendarView;
            if (options.date) {
                this.date = options.date;
            } else {
                this.date = this.calendarView.options.date;
            }
            this.model = options.model;
            if (!options.autoCalculate) {
                this.calendarInfo.on('change:currentDay', this.changeCurrentDay.bind(this));
            }
        },
        getDefaultDuration: function(parameters) {
            return parameters.column.view.defaultDuration?parameters.column.view.defaultDuration:60;
        },
        changeCurrentDay: function () {
            if (this.calendarView.calculateBuffers) {
                this.calendarView.calculateBuffers(this.calculateBuffers.bind(this), this);
            } else {
                this.calculateBuffers();
            }
        },

        calculateNoteOffset: function(baseNoteView) {
            var baseFrom = baseNoteView.model.get('fromTime');
            var baseTo = baseFrom + baseNoteView.model.get('duration');
            var offsetTop = false;
            var offsetBottom = false;
            _.each(this.notes, function(noteView) {
                if (baseNoteView.model.get('id') != noteView.model.get('id')) {
                    var from = noteView.model.get('fromTime');
                    var to = from + noteView.model.get('duration');
                    if (from < baseTo) {
                        offsetBottom = true;
                    }
                    if (baseFrom > to) {
                        offsetTop = true;
                    }
                }
            });

            baseNoteView.offsetBottom = offsetBottom;
            baseNoteView.offsetTop = offsetTop;
        },
        drag: function(column, event, ui) {
            base.ColumnView.onDrag(column, event, ui);
        },

        recalculateElement: function(note) {
            var grid = this.grid;

            if (grid[note.model.get('id')]) {
                grid[note.model.get('id')]['duration'] = note.model.get('duration');
                grid[note.model.get('id')]['top'] = note.topOffset;
            }
        },
        addToGrid: function(note) {
            this.grid[note.model.get('id')] = {
                top: note.topOffset,
                duration: note.model.get('duration')
            };
        },
        removeFromGrid: function(noteModel) {
            delete this.grid[noteModel.get('id')];
        },
        checkGrid: function (offsetTop, duration) {
            var res = true;
            _.each(this.grid, function(element){
                if ((offsetTop < element.top // offset 15 top
                    && element.top < offsetTop + duration - 18) // offset 15 bottom
                    ) {
                    res = false;
                    return {};
                }
            });
            return res;
        },


        initializeAddNoteView: function (orderNote, noteView) {
            this.model.get('notes').push(orderNote);

            if (!noteView) {
                noteView = new base.NoteView({
                    model: orderNote,
                    columnData: this.model,
                    calendarData: this.calendarInfo,
                    columnView: this
                });
            }

            // Hard code
            orderNote.view = noteView;

            this.checkNoteOffsets(noteView.model);

            this.addToGrid(noteView);
            this.notes.push(noteView);

            orderNote.on('change:edit', this.checkPopup.bind(this));

            orderNote.on('change:showInfo', this.checkPopup.bind(this));

            return noteView;
        },
        checkPopup: function(value, data) {
            if (data) {
                this.openedPopupsCount++;
                if(this.openedPopupsCount > 1) {
                    // Check if opened another popup hide it
                    _.each(this.notes, function(note) {
                        if (note && value.get('id') != note.model.get('id')) {
                            if (note.model.get('showInfo')) {
                                // Hide info popups
                                note.model.set('showInfo', false);
                            } else if (note.model.get('edit')) {
                                // Check if edit popup
                                if (note.model.get('new')) {
                                    // Remove new note
                                    note.model.set('edit', false);
                                    note.model.set('showPopup', false);
                                    this.removeNoteView(note.model);
                                    this.removeNote(note.model);
                                    note.model.remove();
                                } else {
                                    // Hide edit popup
                                    note.model.set('edit', false);
                                }
                            } else {
                                console.error('IMPOSIBLE POPUP', note);
                            }
                        }
                    }.bind(this));
                }
            } else {
                this.openedPopupsCount--;
            }

            this.calendarView.updateScrollBar();
        },
        initializeNote: function (time, duration) {
            if (base.ColumnView.validateNote(this.model, time, duration, null, this.date)) {
                var orderNote = new base.OrderNote({
                    date: this.date,
                    edit: true,
                    'new': true,
                    fromTime: time,
                    duration: duration,
                    bySite: this.calendarView.options.bySite,
                    owner: {
                        id: this.model.get('id')
                    }
                });

                this.model.get('notes').push(orderNote);

                return this.initializeAddNoteView(orderNote);
            }
        },
        initializeDefaultNote: function (time) {
            var duration = this.defaultDuration;

            return this.initializeNote(time, duration);
        },
        calculateTimeOffset: function (parameters, offset) {
//            var time = parameters.data.get('currentDay').get('fromTime') + offset - offset % 15;
            if (!parameters.view.fromTime) {
                return parameters.data.get('currentDay').get('fromTime') + offset - offset % 15;
            } else {
                return parameters.view.fromTime + offset - offset % 15;
            }
        },
        addNote: function (e, parameters) {
            e.preventDefault(true);
            e.stopPropagation(true);
            console.log("ADDNOTE", e);

            var offset = base.ColumnInfo.pixelsToTime(base.ColumnView.getDistance(e));
            var time = parameters.column.view.calculateTimeOffset(parameters, offset);
            ////console.log("TIME", time, parameters.view.fromTime, parameters.data.get('currentDay').get('fromTime'));

            var noteView = parameters.column.view.initializeDefaultNote(time);

            if (noteView) {
                parameters.column.showPopup = true;
                parameters.column.view.openedPopupsCount++;
                parameters.column.view.checkPopup(noteView.model, true);
            }
        },

        checkNoteOffsets: function(note) {
            var noteFrom = note.get('fromTime');
            var noteTo = noteFrom + note.get('duration');
            var reserveStart = false;
            var reserveEnd = false;
            _.each(this.notes, function(noteView) {
                var currentTo = noteView.model.get('fromTime') + noteView.model.get('duration');
                if (noteFrom < noteView.model.get('fromTime') && noteTo > noteView.model.get('fromTime')) {
                    reserveEnd = true;
                }

                if (noteTo > currentTo && noteFrom < currentTo) {
                    reserveStart = true;
                }
            });
            note.set('reserveStart', reserveStart);
            note.set('reserveEnd', reserveEnd);
        },

        stopPropagation: function (e) {
            e.preventDefault(true);
            e.stopPropagation(true);
        },
        getNote: function (nid) {
            var currentNote = null;
            _.each(this.notes, function (noteView) {
                if (noteView.model.get('id') == nid) {
                    currentNote = noteView;
                    return {};
                }
            });
            return currentNote;
        },
        removeNoteView: function (currentNote) {
            _.each(this.notes, function (noteView, id) {
                if (noteView && noteView.model.get('id') == currentNote.get('id')) {
                    this.notes.splice(id, 1);
                    return {};
                }
            }.bind(this));
        },
        removeNote: function (currentNote) {
            _.each(this.model.get('notes'), function (note, id) {
                if (note && currentNote.get('id') == note.get('id')) {
                    this.removeFromGrid(note);
                    this.model.get('notes').splice(id, 1);
                    return {};
                }
            }.bind(this));
        }
    };

    BaseColumn.createInterface = function(day, date, category) {
        var columnInterface = {
            markTop: 0,
            showPopup: false,
            marker: false,
            date: date,
            workDay: day,
            view: this
        };

        if (category) {
            columnInterface['category'] = category;
        }

        this.interfaces.push(columnInterface);

        return columnInterface;
    };

    BaseColumn.clear = function() {
        if (this.notes.length > 0) {
            _.each(this.notes, function(note, id){
                if (typeof(note) == 'object') {
                    this.removeNote(note.model);
                    this.notes.splice(id, 1);
                }
            }.bind(this));
        }
    };

    BaseColumn.getDayDate = function(dayId, date, result) {
        var currentDay = date.getDay();
        return result.setTime((date.getTime() -  date.getTime() % 3600*24) + (currentDay - dayId)*24*3600);
    };
    BaseColumn.regionLogic = function() {

    };

    BaseColumn.calculateBuffers = function (dayId, timeFrom, timeTo, interfaceColumn) {
        //console.log("Calc buffers", dayId, timeFrom, timeTo);
        _.each(this.buffers, function () {
            this.buffers.pop();
        }.bind(this));

        _.each(this.regions, function(){
            this.regions.pop();
        }.bind(this));

        delete this.grid['topBuffer'];
        delete this.grid['bottomBuffer'];

        // Base date
        this.date = new Date();

        if (!dayId) {
            var day = this.model.get('schedule').get('workDays')[this.calendarInfo.get('currentDay').get('dayId') - 1];
            this.getDayDate(this.calendarInfo.get('currentDay').get('dayId'), this.calendarView.options.date, this.date);
        } else {
            var day = this.model.get('schedule').get('workDays')[dayId - 1];
            this.getDayDate(dayId, this.calendarView.options.date, this.date);
        }

        if (!timeFrom) {
            timeFrom = this.calendarInfo.get('currentDay').get('timeFrom');
        }
        if (!timeTo) {
            timeTo = this.calendarInfo.get('currentDay').get('timeTo');
        }
//        ////console.log("COLUMN DAY", day, dayId, this.model.get('schedule'));
        if (day.get('active') && this.calendarInfo.get('schedule').checkSupply(this.date)) {
            if (timeFrom < day.get('timeFrom')) {
                var bufferHeight = base.ColumnInfo.timeToPixels(day.get('timeFrom') - timeFrom);
                this.buffers.push(this.initializeBuffer(0, bufferHeight));

                this.model.set('timeFrom', day.get('timeFrom'));

                this.grid['topBuffer'] = {
                    top: 0,
                    duration: bufferHeight
                };
            } else {
                this.grid['topBuffer'] = { top: 0, duration: 0 };
                this.model.set('timeFrom', timeFrom);
            }
            if (timeTo > day.get('timeTo')) {
                var bufferHeight = base.ColumnInfo.timeToPixels(timeTo - day.get('timeTo'));
                var bufferOffset = base.ColumnInfo.timeToPixels(day.get('timeTo') - timeFrom);
                this.buffers.push(this.initializeBuffer(bufferOffset, bufferHeight));

                this.model.set('timeTo', day.get('timeTo'));

                this.grid['bottomBuffer'] = {
                    top: bufferOffset,
                    duration: bufferHeight
                };
            } else {
                this.grid['bottomBuffer'] = { top: base.ColumnInfo.timeToPixels(timeTo - timeFrom), duration: 0 };
                this.model.set('timeTo', timeTo);
            }
            if (this.interfaces.length == 1 || interfaceColumn) {
                if (!interfaceColumn) {
                    interfaceColumn = this.interfaces[0];
                }
                interfaceColumn.show = true;
            }
        } else {
            if (this.interfaces.length == 1 || interfaceColumn) {
                if (!interfaceColumn) {
                    interfaceColumn = this.interfaces[0];
                }
                interfaceColumn.show = false;
            }
            this.buffers.push(this.initializeBuffer(
                0,
                base.ColumnInfo.timeToPixels(timeTo - timeFrom)
            ));
        }

        // Calculate region rules
        if (this.model.get('proposes')) {
            _.each(this.model.get('proposes'), function(proposeId) {
                var proposeData = this.calendarView.proposes[proposeId];
                if (this.checkProposeOnDay(proposeData, day)) {
                    this.regions.push({
                        height: base.ColumnInfo.timeToPixels(proposeData.toTime - proposeData.fromTime),
                        start: base.ColumnInfo.timeToPixels(proposeData.fromTime - timeFrom)
                    });
                }
            }.bind(this))
        }
    };

    BaseColumn.checkProposeOnDay = function(propose, currentDay) {
        if (propose.period_type === false) {
            switch (propose.applying_type) {
                case 1:
                    break;
                case 4:
                    if (!currentDay.get('weekend')) {
                        return false;
                    }
                    console.log("Propose", propose.period_type === false, propose.name, propose);
                    break;
                case 5:
                    if (currentDay.get('weekend')) {
                        return false;
                    }
                    break;
            }
        } else {
            console.log("Propose", this.date.getTime() < propose.fromDateTime, this.date.getTime(),  propose.toDateTime);
            if (this.date.getTime() < propose.fromDateTime || this.date.getTime() > propose.toDateTime) {
                return false;
            }
        }
        return true;
    };

    BaseColumn.initializeBuffer = function (start, height) {
        return {
            start: start,
            height: height
        };
    };
    base.ColumnView = Backbone.View.extend(BaseColumn, staticProps);
//
//    base.Frame = function(column) {
//        this.
//    },


    rivets.binders['silent-move'] = function(el, column) {
        $(el).mousemove(function (event) {
//            event.preventDefault(true);
//            event.stopPropagation(true);
        });
        $(el).click(function(event){
            event.stopPropagation(true);
        });
        $(el).dblclick(function(event){
            event.stopPropagation(true);
        });
        $(el).hover(function(event){
            event.preventDefault(true);
            event.stopPropagation(true);

            column.calendarView.options.markAbility = false;

            _.each(column.calendarView.options.columns, function(currentColumn){
//                if (currentColumn.model.get('id') != column.model.get('id')) {
                    currentColumn.mark = false;
//                }
            });

//            column.mark = false;
        }.bind(this),function(event){
            event.preventDefault(true);
            event.stopPropagation(true);
            column.calendarView.options.markAbility = true;
        }.bind(this));
    };

    rivets.binders['dropable-column'] = function(el, column) {
        initializeRunMark.call(this, el, column);

        $(el).droppable({
            drop: function(event, ui) {
                column.view.drag(column, event, ui);
            }
        });
    };

    function initializeRunMark(el, column) {
        $(el).mousemove(function (event) {
            if (!$(event.target).hasClass('note')) {
                if (column.view.calendarView.options.markAbility) {
                    var distance = base.ColumnView.getDistance(event);

                    // Offset, check it
                    if (this.model.column.view.checkGrid(distance, this.model.column.view.getDefaultDuration(this.model))
                        && distance > 2
                        && (distance + this.model.column.view.getDefaultDuration(this.model)) < ($(el).height() + 25)) {
                        if (!this.model.column.mark) {
                            this.model.column.mark = true;
                        }
                        this.model.column.markTop = distance - distance % 12;
                    } else {
                        this.model.column.mark = false;
                    }
                }
            }
        }.bind(this));
        $(el).hover(function (event) {
            event.preventDefault(true);
            this.model.column.mark = true;
            column.mark = true;
        }.bind(this), function (event) {
            event.preventDefault(true);
//            event.stopPropagation(true);
            this.model.column.mark = false;
        }.bind(this));
    };

    var draggableRevert = function(draggable){
        draggable.draggable({revert: true});
    };
}