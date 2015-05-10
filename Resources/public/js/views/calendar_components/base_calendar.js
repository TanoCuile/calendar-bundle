function initializeBaseCalendar(base) {
    base.BaseCalendarView = Backbone.View.extend({
        bind: null,
        loadNotesUrl: '/api/calendar/order/load',
        $datepicker: null,
        showNotes: [],
        daysFull: {
            1: 'понедельник',
            2: 'вторник',
            3: 'среда',
            4: 'четверг',
            5: 'пятница',
            6: 'субота',
            0: 'воскесение'
        },
        days: {
            1: 'пн',
            2: 'вт',
            3: 'ср',
            4: 'чт',
            5: 'пт',
            6: 'сб',
            0: 'вс'
        },
        months: {
            1: 'января',
            2: 'февраля',
            3: 'марта',
            4: 'апреля',
            5: 'мая',
            6: 'июня',
            7: 'июля',
            8: 'августа',
            9: 'сентября',
            10: 'октября',
            11: 'ноября',
            12: 'декабря'
        },
        options: {

        },
        defaults: {
            odd: false,
            hidden: true,
            reload: true,
            date: null,
            rows: null,
            times: null,
            dateStr: '',
            columns: null,
            buSite: true,
            markAbility: false,
            calendarOptions: {
                workGridStart: 'start60',
                calendarHeight: 0,
                height: 0
            }
        },
        addDays: function (date, amount) {
            var tzOff = date.getTimezoneOffset() * 60 * 1000,
                t = date.getTime(),
                d = new Date(),
                tzOff2;

            t += (1000 * 60 * 60 * 24) * amount;
            d.setTime(t);

            tzOff2 = d.getTimezoneOffset() * 60 * 1000;
            if (tzOff != tzOff2) {
                var diff = tzOff2 - tzOff;
                t += diff;
                d.setTime(t);
            }

            return d;
        },
        getWeekDays: function (date) {
            var weekDay = date.getDay();
            var week = [];

            var dayId = 0;
            for (var i = weekDay * -1; i < 7 - weekDay; ++i) {
                week.push({ day: this.addDays(date, i + 1), day_id: dayId});
                dayId++;
            }
            return week;
        },

        getWorkDay: function (date) {
            return this.options.data.get('schedule').get('workDays')[(date.getDay() > 0) ? (date.getDay() - 1) : 6];
        },
        initialize: function(options){
            if (options.error) {
                MainElements.messageManager.showMessage(options.error);
            } else {
                this.options = _.extend(this.defaults, this.options, options);

                this.options.data = new base.DayCalendarInfo(_.extend(options, {categories: this.options.categories}));
                ////console.log("DATA", this.options.data);
                this.options.view = this;
                this.options.rows = [];
                this.options.times = [];
                this.options.columns = [];

                this.proposes = options.proposes;

                if (!this.options.date) {
                    this.options.date = new Date();
                }
                this.customInitialize(options);

                this.initializeColumns();
                this.initializeDatePicker();
                // Change default date
                this.changeDate(this.options.date);

                this.bind = rivets.bind(this.el, this.options);

                this.$el.removeClass('hidden');
            }
        },

        getColumnView: function(mid, cid, date){
            var columnVew = null;
            _.each(this.options.columns, function(column){
                if (column.view.model.get('id') == mid && column.view.model.get('category') == cid) {
                    columnVew = column.view;
                    return {};
                }
            });
            return columnVew;
        },
        activateAll: function(el, parameters) {
        },
        customInitialize: function(options){
        },

        updateScrollBar: function() {
            console.log("this", this.options.data.get('weekCalendar'), this.weekCalendar.scrollPane, this.dayCalendar.scrollPane);
            if (this.weekCalendar.scrollPane && this.options.data.get('weekCalendar')) {
                this.weekCalendar.scrollPane.find('.mCSB_container').css('width', 865);
                this.weekCalendar.scrollPane.mCustomScrollbar('update');
            } else if (this.dayCalendar.scrollPane) {
                this.dayCalendar.scrollPane.find('.mCSB_container').css('width', 865);
                this.dayCalendar.scrollPane.mCustomScrollbar('update');
            }
        },
        changeDate: function(date) {
            // Check is Sunday
            var workDay = this.options.data.get('schedule').get('workDays')[(date.getDay() > 0)?(date.getDay() - 1):6];
            this.options.date = date;
            if (workDay.get('active') && this.options.data.get('schedule').checkSupply(date)) {
                this.options.reload = true;

                this.dateStrGenerate();

                this.options.data.set('currentDay', workDay);

                this.initializeRows();
                this.heightAlgorithm(this);

                this.loadNotes();

                this.trigger('change:date', this);
                this.options.reload = true;
                this.options.hidden = false;
            } else {
                MainElements.messageManager.showMessage("Сегодня (" + this.days[date.getDay()] + ") вы не работаете.", 10000);
                this.options.hidden = true;
            }
        },

        heightAlgorithm: function (info) {
            // Set height +2 - for bottom
            info.options.calendarOptions.height = info.options.rows.length * info.options.data.get('cellHeight') + 2;

            info.options.calendarOptions.calendarHeight = info.options.calendarOptions.height + 75;
        },
        // Create rows array (by default use default schedule)
        initializeRows: function () {
            // Clear rows
            _.each(this.options.rows, function () {
                this.options.rows.pop();
            }.bind(this));
            _.each(this.options.times, function () {
                this.options.times.pop();
            }.bind(this));

            // Generate rows
            var hourLeft = 60;
            var timeFrom = this.options.data.get('currentDay').get('timeFrom');
            var timeTo = this.options.data.get('currentDay').get('timeTo');
            if (this.fromTime) {
                timeFrom = this.fromTime
            }
            if (this.toTime) {
                timeTo = this.toTime;
            }
            if (timeFrom % 60 > 0) {
                hourLeft = 60 - (timeFrom % 60);
            }

            this.options.calendarOptions.workGridStart = 'start' + hourLeft;

            for (var i = timeFrom; i <= timeTo;) {
                var baseTime = Math.floor((i % 60));
                var c = i + hourLeft;
                var minLeft = 15;
                if (c + baseTime + 15 > timeTo) {
                    minLeft = timeTo - (c + baseTime + 15);
                }
                for (var j = 0; j < hourLeft; j += minLeft) {
                    var minOffset = 60 - hourLeft;
                    minLeft = 15;
                    var row = {
                        timeShow: false
                    };
                    row.id = (i + j);
                    var hour = (Math.floor(i / 60));
                    if (hour % 2 == 0) {
                        row.odd = true;
                    }
                    row.time = (hour < 10 ? '0' + hour : hour) + ':' + (minOffset + j > 10 ? minOffset + j : '00');
                    if (j == 0) {
                        row.timeShow = true;
                        this.options.times.push({
                            timeSize: hourLeft,
                            time: row.time
                        });
                        row.timeSize = hourLeft;
                        row.first = true;
                    } else if (j == hourLeft - 15) {
                        row.last = true;
                    } else {
                        row.empty = true;
                    }
                    this.options.rows.push(row);
                }
                i += hourLeft;
                hourLeft = 60;
                if (i + hourLeft > timeTo) {
                    hourLeft = timeTo - i;
                }
                if (i == timeTo) {
                    break;
                }
            }

            // Set columns height for active masters
            if (this.$calendar) {
                this.$calendar.find('.work-field .workDaysmaster').css('height', this.options.columnHeight);
            } else {
                this.options.workColumnStyle += 'height:' + this.options.columnHeight + 'px;';
            }
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
                        if (day.fromTime > this.options.fromTime) {
                            this.createBufferElement(master, day.fromTime - this.options.fromTime, 0);
                        }
                        if (day.timeTo < this.options.toTime) {
                            var diff = this.options.toTime - day.timeTo;
                            this.createBufferElement(master, diff, this.options.toTime - diff - this.options.timeFrom);
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

        zebra: function() {
            return function(el, parameters) {
                this.model.odd = !this.model.odd;
                if (!this.model.odd) {
                    $(el).addClass('odd');
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
                'timeFrom': time,
                'toTime': endTime,
                'service': (type && type.id?type.id:type),
                'editable': isNew||editable,
                'owner': currentMaster,
                'new': isNew,
                'edit': isNew||edit||this.options.showNotes.indexOf(additional.id),
                'checkType': false,
                'oneMaster': false
            }, additional));
        },

        loadNotes: function () {
            var masters = {};
            _.each(this.options.columns, function(master) {
                masters[master.view.model.get('id')] = master.view.model;
                master.view.clear();
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
                    dateTo: {

                    },
                    masters: _.keys(masters)
                }
            }).success(function (data) {
                    if (data.status == 1) {
//                        this.options.data.setNotes(data.notes);
                        _.each(data.notes, function (note, id) {
                            var noteModel = this.createNoteModel(
                                this.options.date,
                                note.timeFrom,
                                note.toTime,
                                masters[note.owner.id],
                                note.service,
                                false,
                                false,
                                false,
                                note);
                            this.getColumnView(note.owner.id, note.category).initializeAddNoteView(noteModel);
                        }.bind(this));
                    }
                }.bind(this));
        },
        initializeTable: function() {
            var view = this;            
            return function(el, parameters) {
                $(el).hover(function(event) {
                    parameters.markAbility = true;
                }.bind(this), function(event){
                    parameters.markAbility = false;
                }.bind(this));
            }
        },

        checkNextActiveDay: function(date) {
            var workDay = this.getWorkDay(date);
            if (!workDay.get('active') || !this.options.data.get('schedule').checkSupply(date)) {
                date.setTime(date.getTime() + 24*3600);
                workDay = this.checkNextActiveDay(date);
            }

            return workDay;
        },
        checkPrevActiveDay: function(date) {
            var workDay = this.getWorkDay(date);
            if (!workDay.get('active') || !this.options.data.get('schedule').checkSupply(date)) {
                date.setTime(date.getTime() - 24*3600);
                workDay = this.checkPrevActiveDay(date);
            }

            return workDay;
        },
        createNoteModel: function(date, time, endTime, currentMaster, type, isNew, editable, edit, additional) {
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

        dateStrGenerate: function () {
            this.options.dateStr = this.options.date.getDate() + ' ' + this.months[(this.options.date.getMonth() + 1)] + ', ' + this.days[this.options.date.getDay()];
        },

        loadPrev: function (e, parametrs) {
            parametrs.date.setTime(parametrs.date.getTime() - 24*3600);
            console.log("Test", parametrs.date.getDate());
            parametrs.view.checkPrevActiveDay(parametrs.date);
            parametrs.view.changeDate(parametrs.date);
        },
        loadCurrent: function (e, parametrs) {
            parametrs.view.changeDate(parametrs.date);
        },
        loadNext: function (e, parametrs) {
            parametrs.date.setTime(parametrs.date.getTime() + 24*3600);
            parametrs.view.checkNextActiveDay(parametrs.date);
            parametrs.view.changeDate(parametrs.date);
        },

        initializeDatePicker: function() {
            var view = this;
            this.$el.find('.datepicker-icon input').datepicker({
                defaultDate: this.date,
                showOtherMonths: true,
                firstDay: 1,
                onSelect: function(e, ui) {
                    view.options.date.setDate(ui.selectedDay);
                    view.options.date.setMonth(ui.selectedMonth);
                    view.options.date.setYear(ui.selectedYear);
                    view.changeDate(view.options.date);
                },
                beforeShowDay: view.checkDatePickerDay.bind(view)
            });
            this.$datepicker = this.$el.find('.datepicker-icon input');
            this.$datepicker.datepicker('hide');
        },

        checkDatePickerDay: function(date) {
            var mid = 0;
            var cDate = new Date();
            cDate.setDate(cDate.getDate() - 1);
            if (!(date >= cDate)) {
                return [false];
            }
//                    if (this.master) {
//                        mid = this.master.get('id');
//                    }
//                    if () {
//
//                    }
//                    if (view.options.additionalDateCheck) {
//                        return view.options.additionalDateCheck(view, date);
//                    }
            return [true];
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
        },
        showPicker: function(e, parameters) {
            parameters.view.$datepicker.datepicker('show');
        }
    });

    rivets.binders['remove-drop'] = function(el, calendar) {
        $(el).droppable({
            drop: function(event, ui) {
                var noteId = $(ui.draggable).attr('data-note');
                var columnId = $(ui.draggable).attr('data-column');
                var categoryId = $(ui.draggable).attr('data-category');
                var currentColumn = calendar.options.data.getColumn(columnId, categoryId);
                var currentNote = currentColumn.getNote(noteId);

                var currentColumnView = calendar.getColumnView(columnId, categoryId, currentNote.get('date'));

                currentColumnView.removeNoteView(currentNote);
                currentColumnView.removeNote(currentNote);

                currentNote.remove();

                ////console.log('Note deleted');
            }
        });
    }
}