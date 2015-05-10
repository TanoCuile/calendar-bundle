function initializeCalendar(base) {
    // value structure:
    // base.categories
    // base.categories[i].masters
    // base.categories[i].masters[k].schedule
    // base.categories[i].types
    // base.categories[i].types[j].jobTypes
    base.CalendarWidgetView = Backbone.View.extend({
        rivets: null,
        $calendar: null,
        $header: null,
        $scrollPane: null,
        options: {

        },
        defaults: {
            popupHeight: 220,
            heightAppend: 49,
            widgetWidthOffset: 70,
            headerHeight: 48,
            show: false,
            rows: [],
//            bufferElements: {},
//            notes: {},
            baseSchedule: {},
            cellHeight: 12,
            fromTime: 8 * 60,
            toTime: 22 * 60,
            colWidth: 220,
            // For header
            columnStyle: 'width:220px;',
            // For work field
            workColumnStyle: 'width:220px;',
            dateStr: '',
            tableStyle: '300px;',
            date: new Date,
            columnHeight: 0,
            onAddNote: false,
            editPopup: {
                editNote: false,
                activeNote: null,
                activeNoteView: null
            },
            noteSaveCallback: false,
            additionalDateCheck: false,
            afterMastersChange: false
        },
        widget: null,
        loadNotesUrl: '/api/calendar/order/load',
        days: {
            1: 'понедельник',
            2: 'вторник',
            3: 'среда',
            4: 'четверг',
            5: 'пятница',
            6: 'субота',
            0: 'воскесение'
        },
        months: {
            1: 'Января',
            2: 'Февраля',
            3: 'Марта',
            4: 'Апреля',
            5: 'Мая',
            6: 'Июня',
            7: 'Июля',
            8: 'Августа',
            9: 'Сентября',
            10: 'Октября',
            11: 'Ноября',
            12: 'Декабря'
        },
        initialize: function (options) {
            this.options = _.extend(this.defaults, options);

            // Set data
            this.data = options.data;
            this.data.on('change:activeMasters', this.changeMasters.bind(this));
            if (!this.data.get('notes')) {
                this.data.set('notes', {});
            }

            // Base initialize masters
            this.changeMasters();

            // Initialize rivets
            this.options = _.extend(this.options, {view: this});
            this.rivets = rivets.bind(this.el, this.options);

            this.$header = this.$el.find('.calendar-header');
            this.$header.removeClass('hidden');
            this.initializeDatePicker();

            this.options.show = true;

            this.$calendar = this.$el.find('.calendar.field');
            this.$calendar.removeClass('hidden');
            var width = this.$calendar.find('.table').width();
            var calendarWidget = this.$calendar.find('.calendar-widget');
            calendarWidget.css('width', width - this.options.widgetWidthOffset);

            if (_.has(calendarWidget, 'jScrollPane')) {
                calendarWidget.jScrollPane();
                this.$scrollPane = calendarWidget.data('jsp');
            }

            this.dateStrGenerate();

            // Initialize messages
            this.data.on('change:message', this.messageTrigger.bind(this));
        },
        initializeDatePicker: function() {
            var view = this;
            this.$header.find('.datepicker input').datepicker({
                defaultDate: this.date,
                showOtherMonths: true,
                firstDay: 1,
                onSelect: function(e, ui) {
                    view.options.date.setDate(ui.selectedDay);
                    view.options.date.setMonth(ui.selectedMonth);
                    view.options.date.setYear(ui.selectedYear);
                    view.dateStrGenerate();
                    view.loadNotes();
                },
                beforeShowDay: function(date) {
                    var mid = 0;
                    var cDate = new Date();
                    cDate.setDate(cDate.getDate() - 1);
                    if (!(date >= cDate)) {
                        return [false];
                    }
                    if (this.master) {
                        mid = this.master.get('id');
                    }
                    if (view.options.additionalDateCheck) {
                        return view.options.additionalDateCheck(view, date);
                    }
                    return [false];
                }
            });
            this.$header.find('.datepicker').datepicker('hide');
        },
        showPicker: function (e, parameters) {
            parameters.view.$header.find('.datepicker input').datepicker('show');
        },
        dateStrGenerate: function () {
            this.options.dateStr = this.options.date.getDate() + ' ' + this.months[(this.options.date.getMonth() + 1)] + ', ' + this.days[this.options.date.getDay()];
        },
        loadPrev: function (e, parametrs) {
            parametrs.date.setDate(parametrs.date.getDate() - 1);
            parametrs.view.dateStrGenerate();
            parametrs.view.loadNotes();
        },
        loadCurrent: function (e, parametrs) {
            parametrs.view.loadNotes();
        },
        loadNext: function (e, parametrs) {
            parametrs.date.setDate(parametrs.date.getDate() + 1);
            parametrs.view.dateStrGenerate();
            parametrs.view.loadNotes();
        },
        // Master with schedule
        // Masters with active filed
        changeMasters: function () {
            // TODO: check schedule
            // TODO: initialize rows
            this.onMastersChange();
            this.loadNotes();
        },
        changeMasterActive: function () {
            this.onMastersChange();
        },
        changeScheduleRows: function () {
            var fromTime = -1;
            var toTime = -1;

            _.each(this.data.get('activeMasters'), function (master) {
                if (master.get('notes').length == 0 && this.data.get('notes')[master.get('id')]) {
                    _.after(this.data.get('notes')[master.get('id')], function (note) {
                        master.get('notes').push(note);
                    });
                } else if (!this.data.get('notes')[master.get('id')]) {
                    this.data.get('notes')[master.get('id')] = master.get('notes');
                }
                if (master.get('schedule') && master.get('active')) {
                    var day = null;
                    if (day = master.get('schedule').workDays[this.options.date.getDay()]) {
                        if (fromTime < 0 || fromTime > day.timeFrom) {
                            fromTime = day.timeFrom;
                        }
                        if (toTime < 0 || toTime < day.timeTo) {
                            toTime = day.timeTo;
                        }
                        master.set('inWork', true);
                    } else {
                        master.set('inWork', false);
                    }
                }
                //master.on('change:active', this.changeMasterActive.bind(this));
            }.bind(this));

            if (fromTime > 0 && toTime > 0) {
                this.options.fromTime = fromTime;
                this.options.toTime = toTime;
            } else {
                this.options.fromTime = this.defaults.fromTime;
                this.options.toTime = this.defaults.toTime;
            }

            this.initializeRows();
        },
        onMastersChange: function () {
            this.changeScheduleRows();
            var countActiveMasters = 0;
            _.each(this.data.get('activeMasters'), function (master) {
                if (master.get('active') && master.get('inWork')) {
                    countActiveMasters += 1;
                }
            });

            // Set table width
            if (this.$calendar) {
                this.$calendar.find('.calendar-field-wrapper').css('width', (countActiveMasters * this.options.colWidth + 1));
                this.$calendar.find('.calendar-widget').css('height', this.options.columnHeight + this.options.heightAppend);
                this.$calendar.find('.calendar-field-wrapper').css('min-height', this.options.columnHeight);
                //this.$calendar.find('.calendar-field-wrapper').css('min-height', this.options.columnHeight + 42);
            }

            // Scroll pane change
            if (this.$scrollPane) {
                ////console.log('Reinitialize');
                this.$scrollPane.reinitialise({height: this.options.columnHeight + this.options.headerHeight});
            }

            if (this.options.afterMastersChange) {
                this.options.afterMastersChange.call(this);
            }
        },

        // Create rows array (by default use default schedule)
        initializeRows: function () {
            _.each(this.options.rows, function () {
                this.options.rows.pop();
            }.bind(this));
            var hourLeft = 60;
            if (this.options.fromTime % 60 > 0) {
                hourLeft = 60 - (this.options.fromTime % 60);
            }
            for (var i = this.options.fromTime; i <= this.options.toTime;) {
                var baseTime = Math.floor((i % 60));
                var c = i + hourLeft;
                var minLeft = 15;
                if (c + baseTime + 15 > this.options.toTime) {
                    minLeft = this.options.toTime - (c + baseTime + 15);
                }
                for (var j = 0; j < hourLeft; j += minLeft) {
                    minLeft = 15;
                    var row = {
                        timeShow: false
                    };
                    row.id = (i + j);
                    if (j == 0) {
                        row.timeShow = true;
                        row.time = (Math.floor(i / 60)) + ':' + (baseTime > 10 ? baseTime : '00');
                        row.timeSize = hourLeft;
                    } else if (j == hourLeft - 15) {
                        row.last = true;
                    } else {
                        row.empty = true;
                    }
                    this.options.rows.push(row);
                }
                i += hourLeft;
                hourLeft = 60;
                if (i + hourLeft > this.options.toTime) {
                    hourLeft = this.options.toTime - i;
                }
                if (i == this.options.toTime) {
                    break;
                }
            }

            // Set columns height for active masters
            this.options.columnHeight = this.options.rows.length * this.options.cellHeight;
            if (this.$calendar) {
                this.$calendar.find('.work-field .master').css('height', this.options.columnHeight);
            } else {
                this.options.workColumnStyle += 'height:' + this.options.columnHeight + 'px;';
            }
            this.initializeBuffers();
        },
        // Initialize buffers
        initializeBuffers: function () {
            var currentDate = new Date();
            // Clear bufferElements
            _.each(this.data.get('activeMasters'), function (master) {
                if (!master.get('bufferElements')) {
                    master.set('bufferElements', []);
                } else {
                    _.each(master.get('bufferElements'), function () {
                        master.get('bufferElements').pop();
                    }.bind(this))
                }
                var schedule = null;
                if (schedule = master.get('schedule')) {
                    var day = null;
                    if (day = schedule.workDays[currentDate.getDay()]) {
                        if (day.timeFrom > this.options.fromTime) {
                            this.createBufferElement(master, day.timeFrom - this.options.fromTime, 0);
                        }
                        if (day.timeTo < this.options.toTime) {
                            var diff = this.options.toTime - day.timeTo;
                            this.createBufferElement(master, diff, this.options.toTime - diff - this.options.fromTime);
                        }
                    }
                }
            }.bind(this));
        },
        createBufferElement: function (master, difference, offset) {
            master.get('bufferElements').push(new base.BufferView({
                start: offset / 15 * 12,
                diff: difference / 15 * 12
            }));
        },
        getValidateData: function (options, currentMaster) {
            var toTime = options.toTime;
            var fromTime = options.fromTime;
            var currentDate = new Date();
            if (currentMaster) {
                var workDay = currentMaster.get('schedule').workDays[currentDate.getDay()];

                if (workDay && toTime > workDay.timeTo) {
                    toTime = workDay.timeTo;
                }
                if (workDay && fromTime < workDay.timeFrom) {
                    fromTime = workDay.timeFrom;
                }
            }
            return {toTime: toTime, fromTime: fromTime};
        },
        validateNote: function (view, note, currentMaster, createNoteView, errorCallback) {
            var __ret = this.getValidateData(view.options, currentMaster);
            var toTime = __ret.toTime;
            var fromTime = __ret.fromTime;
            if (note.validate(fromTime, toTime, currentMaster.get('notes'))) {
                createNoteView(note, currentMaster, view);
            } else if(errorCallback) {
                errorCallback(note, currentMaster, view);
            }
        },
        createNoteView: function (view, note, options) {
            return new base.NoteView({
                calendar: view,
                model: note,
                fromTime: options.fromTime,
                toTime: options.toTime,
                popupHeight: options.popupHeight
            });
        },
        initializeNote: function (view, time, endTime, currentMaster, type, isNew, editable, edit, additional) {
            if (!editable) editable = false;
            if (!edit) edit = false;
            var note = view.createNote(view.options.date, time, endTime, currentMaster, type, isNew, editable, edit, additional);

            var createNoteView = function (note, currentMaster, view) {
                currentMaster.get('notes').push(note);
                var options = view.options;
                var noteView = view.createNoteView(view, note, options);
                currentMaster.get('noteViews').push(noteView);
                if (view.options.onAddNote) {
                    view.options.onAddNote(noteView,view);
                }
            }.bind(this);

            view.validateNote(view, note, currentMaster, createNoteView);
        },
        addNote: function (e, parameters) {
            e.preventDefault(true);
            var type = null;
            if ((type = parameters.data.get('activeJob')) && !parameters.data.get('onEdit')) {
                var currentMaster = parseInt($(e.target).attr('data-master'));
                var duration = 0;
                if (duration = parameters.data.get('activeDurations')[currentMaster]) {
                    _.each(parameters.view.data.get('activeMasters'), function (master) {
                        if (master.get('id') == currentMaster) {
                            currentMaster = master;
                            return {};
                        }
                    });
                    var offset = e.offsetY / 12 * 15;
                    var time = parameters.fromTime + offset - offset % 15;
                    parameters.view.initializeNote(parameters.view, time, time + duration, currentMaster, type, true);
                }
            }
        },
        createNote: function (date, time, endTime, currentMaster, type, isNew, editable, edit, additional) {
            if (!isNew) {
                isNew = false;
            }
            if (!additional) {
                additional = {};
            }
            return new base.OrderNote(_.extend({
                'date': date,
                'fromTime': time,
                'toTime': endTime,
                'service': (type && type.id?type.id:type),
                'editable': isNew||editable,
                'owner': currentMaster,
                'new': isNew,
                'edit': isNew||edit,
                'checkType': false,
                'oneMaster': false
            }, additional));
        },
        bufferClick: function (e) {
            e.preventDefault(true);
            e.stopPropagation();
        },
        loadNotes: function () {
            var masters = [];
            _.each(this.data.get('activeMasters'), function(master) {
                masters.push(master.get('id'));
            });
            $.ajax({
                url: this.loadNotesUrl,
                type: 'POST',
                data: {
                    date: {
                        d: this.options.date.getDate(),
                        m: this.options.date.getMonth() + 1,
                        y: this.options.date.getFullYear()
                    },
                    masters: masters
                }
            }).success(function (data) {
                    if (data.status == 1) {
                        this.clearNotes();
                        _.each(data.notes, function (note, id) {
                            this.initializeNote(this,
                                note.fromTime,
                                note.toTime,
                                this.options.data.getMaster(note.owner.id),
                                note.service,
                                false,
                                false,
                                false,
                                note);
                        }.bind(this));
                    }

                    this.onMastersChange();
                }.bind(this));
        },
        clearNotes: function () {
            _.each(this.data.get('activeMasters'),function(master){
                _.each(master.get('notes'), function(){
                    master.get('notes').pop();
                    master.get('noteViews').pop();
                })
            });
        },
        getNoteData: function (containerData, noteData, options) {
            var masterId = parseInt(containerData.attr('data-master'));
            var master = null;
            var currentMasterId = parseInt(noteData.attr('data-master'));
            var noteId = noteData.attr('data-note');
            var currentMaster = null;
            _.each(options.data.get('activeMasters'), function (masterObj) {
                if (masterObj.get('id') == masterId) {
                    master = masterObj;
                }
                if (masterObj.get('id') == currentMasterId) {
                    currentMaster = masterObj;
                }
            });
            var note = null;
            var duration = options.data.get('activeDurations')[masterId];
            _.each(options.data.get('notes')[currentMasterId], function (noteObj) {
                if (noteObj && noteObj.get('id') == noteId) {
                    note = noteObj;
                    return {};
                }
            });
            if (!note) {
                _.each(options.data.get('notes')[masterId], function (noteObj) {
                    if (noteObj && noteObj.get('id') == noteId) {
                        note = noteObj;
                        return {};
                    }
                });
            }
            var noteFromTime = options.fromTime + parseInt(noteData.css('top')) / 12 * 15;
            if (note) {
                if (!duration) {
                    duration = note.get('duration');
                }

                if (note.get('reserveStart')) {
                    noteFromTime += 15;
                }
            } else {
//                ////console.log('error', noteId, masterId, currentMasterId, options.data.get('notes'));
            }
            return {
                masterId: masterId, master: master, currentMasterId: currentMasterId,
                duration: duration, note: note, noteFromTime: noteFromTime, currentMaster: currentMaster
            };
        },
        getDroppableOptions: function () {
            ////console.log('Droppable options', this.options);
            var options = this.options;
            var view = this;
            return {
                accept: function (el) {
                    var containerData = $(this);
                    var noteData = $(el);

                    var data = view.getNoteData(containerData, noteData, options);
                    var masterId = data.masterId;
                    var master = data.master;
                    var currentMasterId = data.currentMasterId;
                    var duration = data.duration;
                    var note = data.note;
                    var noteFromTime = data.noteFromTime;
                    if (!master) {
                        return false;
                    }


                    var timeData = view.getValidateData(options, master);
                    var toTime = timeData.toTime;
                    var fromTime = timeData.fromTime;

                    if (!note) {
                        ////console.log('Note not found');
                        //////console.log(options.data.get('notes')[masterId]);
                    }
//                    ////console.log(duration, note);

                    if (duration && note) {
                        //////console.log(options.fromTime/60, noteFromTime/60, noteFromTime%60, options.data.get('notes')[masterId]);
                        var valid = base.OrderNote.validate(
                            fromTime,
                            toTime,
                            master.get('notes'),
                            noteFromTime,
                            noteFromTime + duration,
                            note.get('id'),
                            note.get('oneMaster'),
                            currentMasterId
                        );
                        ////console.log('accept', valid);
                        return valid;
                    }
                    return false;
                },
                drop: function (e, ui) {
                    var containerData = $(e.target);
                    var noteData = $(ui.draggable[0]);
                    var data = view.getNoteData(containerData, noteData, options);
                    var toTime = data.noteFromTime + data.duration;
                    if (data.duration && data.note) {
                        data.note.set('fromTime', data.noteFromTime);
                        data.note.set('toTime', toTime);
                        // If drag on same row nothing delete
                        if (data.currentMasterId != data.masterId){
                            data.master.get('notes').push(data.note);
                            data.note.set('owner', data.master);

                            _.each(data.currentMaster.get('notes'), function(note, id) {
                                if (note && note.get('id') == data.note.get('id')) {
                                    data.currentMaster.get('notes').splice(id,1);
                                }
                            });

                            _.each(data.currentMaster.get('noteViews'), function(noteView, id) {
                                if (noteView && noteView.model.get('id') == data.note.get('id')) {
                                    data.master.get('noteViews').push(view.createNoteView(view, data.note, options));
                                    data.currentMaster.get('noteViews').splice(id,1);
                                }
                            });
                        }
                    }
                }
            };
        },

        messageTrigger: function() {
            var message = this.data.get('message');
            if (message.length > 0) {
                this.showMessage(message);
            } else {
                this.hideMessage();
            }
        },
        showMessage: function(message) {
            var view = this;
            view.data.set('message', message);
            var $message = this.$el.find('.message');
            $message.fadeIn(400, function(){
                $message.removeClass('hidden');
            });
        },
        hideMessage: function() {
            var view = this;
            var $message = this.$el.find('.message');
            $message.hide(400, function(){
                $message.addClass('hidden');
                view.data.set('message', false);
            });
        },
        closeMessage: function(e, parameters) {
            parameters.view.hideMessage();
        }
    }, {

    });
}