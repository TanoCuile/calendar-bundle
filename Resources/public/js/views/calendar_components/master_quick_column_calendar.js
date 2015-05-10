function initializeMasterQuickColumnCalendar(base) {
    base.MasterQuickColumnCalendar = base.BaseCalendarView.extend({
        loadDateNotesUrl: '/api/calendar/order/load/date',
        fromTime: null,
        toTime: null,
        initialize: function(options){
            this.options = _.extend(this.defaults, this.options, options);

            ////console.log("Options", options.schedule);
            this.options.data = new base.DayCalendarInfo(_.extend(options, {categories: this.options.categories}));
            ////console.log("Options", this.options.data.get('schedule'));
            this.options.view = this;
            this.options.rows = [];
            this.options.times = [];
            this.options.columns = [];

            if (!this.options.date) {
                this.options.date = new Date();
            }
            if (options.onNoteAdd) {
                this.onNoteAdd = options.onNoteAdd;
            }

            this.options.salons = {};
            if (options.salons) {
                _.each(options.salons, function(salon) {
                    this.options.salons[salon.id] = new base.EvenSalon(salon);
                }.bind(this));
            }
            this.options.days = [];
            var newWeek = this.getWeekDays(this.options.date);

            _.each(newWeek, function(day, id) {
                var workDayWeek = this.getWorkDay(day.day);
                if (workDayWeek.get('active')) {
                    this.options.days[id] = day;
                }
            }.bind(this));

            this.$el.removeClass('hidden');

//            if (this.options.date && this.options.data.get('schedule').get('id')) {
//                // Change default date
//                this.changeDate(this.options.date);
//            }
        },
        
        initializeTable: function() {
            var view = this;
            return function(el, parameters) {
                $(el).hover(function(event) {
                    parameters.calendar.options.markAbility = true;
                }.bind(this), function(event){
                    parameters.calendar.options.markAbility = false;
                }.bind(this));
                //console.log("ACTIVATE");
            }
        },
        showCalendar: function() {
            this.options.hidden = false;

            this.options.data.set('currentDay', this.getWorkDay(this.options.date));

            this.initializeColumns();
            this.changeDate(this.options.date);
        },

        compareDay: function (timeCurrent, baseTime) {
            return Math.floor(timeCurrent / (1000 * 60 * 60 * 24)) == Math.floor(baseTime / (1000 * 60 * 60 * 24));
        },
        loadNotes: function () {
            var salons = {};
            _.each(this.options.salons, function(salon) {
                if (typeof(salon) == 'object') {
                    salons[salon.id] = salon;
                }
            });
            this.executeForColumns(function(dayInfo, column) {
                if (typeof(salon) == 'object') {
                        column.view.clear();
                }
            });
            dates = [];

            dates.push({
                d: this.options.date.getDate(),
                m: this.options.date.getMonth() + 1,
                y: this.options.date.getFullYear()
            });

            $.ajax({
                url: this.loadDateNotesUrl,
                type: 'POST',
                data: {
                    dates: dates,
                    owners: _.keys(salons)
                }
            }).success(function (data) {
                    if (data.status == 1) {
//                        this.options.data.setNotes(data.notes);
                        _.each(data.notes, function (note, id) {
                            note.static = true;
                            var noteModel = this.createNoteModel(
                                this.options.date,
                                note.fromTime,
                                note.toTime,
                                salons[note.owner.id],
                                note.service,
                                false,
                                false,
                                false,
                                note);
                            this.getColumnView(note.owner.id, note.category, noteModel.get('date')).initializeAddNoteView(noteModel);
                        }.bind(this));
                    }
                }.bind(this));
        },
        getColumnView: function(mid, cid, date){
            var columnVew = null;
            var calendar = this;
            var callback = function(column){
                if (column.view.model.get('id') == mid) {
                    columnVew = column.view;
                    return {};
                }
            };
            _.each(this.options.columns, function(columnInfo) {
                callback.call(calendar, columnInfo);
            });

            return columnVew;
        },
        calculateBuffers: function(callback, columnView) {
            callback.call(callback, columnView.model.get('dayId') + 1, this.fromTime, this.toTime);
        },
        executeForColumns: function(callback) {
            var calendar = this;
            _.each(this.options.columns, function(column) {
                callback.call(calendar, column);
            })
        },
        clear: function() {
            _.each(this.options.columns, function(columnInterface) {
                _.each(columnInterface.view.notes, function(note, id) {
                    if (typeof(note.model.get('id')) != 'number') {
//                        ////console.log(note.get('id'));
                        columnInterface.view.removeNote(note.model);
                        columnInterface.view.notes.splice(id, 1);
                    }
                });
            })
        },
        initializeColumns: function () {
            var info = this;

            if (this.options.columns.length > 0) {
                _.each(this.options.columns, function() {
                    this.options.columns.pop();
                }.bind(this));
            }
            var currantDay = this.getWorkDay(info.options.date);
            _.each(info.options.salons, function(salon) {
                var columnInfo = new base.ColumnInfo(salon);
                var dayId = currantDay.get('dayId');
                columnInfo.set('dayId', dayId, this.onNoteAdd);

                var columnView = new base.MasterQuickColumn({
                    model: columnInfo,
                    calendarInfo: info.options.data,
                    calendarView: info,
                    date: currantDay,
                    onNoteAdd: info.onNoteAdd
                });
                var interfaceColumn = columnView.createInterface(dayId, currantDay);
                info.options.columns.push(interfaceColumn);
//                info.options.salons.push(columnInfo);
                columnInfo.set('active', true);

                info.options.data.get('columns').push(columnInfo);
            });
        },

        getWorkDay: function (date) {
            return this.options.data.get('schedule').get('workDays')[(date.getDay() > 0) ? (date.getDay() - 1) : 6];
        },
        changeDate: function (date) {
            // Check is Sunday
            var workDay = this.getWorkDay(date);
            this.options.date = date;
//            ////console.log("Schedule", this.options.data.get('schedule'));
            ////console.log("Check", this.options.data.get('schedule').checkSupply(date));
            if (workDay.get('active') && this.options.data.get('schedule').checkSupply(date)) {
                this.options.reload = true;

                this.dateStrGenerate();
                var current = null;
                var fromTime = null;
                var toTime = null;
                ////console.log("sdsdsd");
                _.each(this.options.columns, function(column) {
                    var day = column.view.model.get('schedule').get('workDays')[workDay.get('dayId') - 1];
                    if (day.get('timeFrom') < fromTime || fromTime == null) {
                        fromTime = day.get('timeFrom');
                    }
                    if (day.get('timeTo') > toTime || toTime == null) {
                        toTime = day.get('timeTo');
                    }
                });

                if (this.options.maxToTime && this.options.maxToTime < toTime) {
                    toTime = this.options.maxToTime;
                }

                if (this.options.maxFromTime && this.options.maxFromTime > fromTime) {
                    fromTime = this.options.maxFromTime;
                }

                _.each(this.options.columns, function(column) {
                    var day = column.view.model.get('schedule').get('workDays')[workDay.get('dayId') - 1];
                    if (day.get('timeFrom') < fromTime) {
                        column.view.fromTime = fromTime;
                    }
                    if (day.get('timeTo') > toTime) {
                        column.view.toTime = toTime;
                    }
                });

                workDay.set('timeTo', toTime);
                workDay.set('timeFrom', fromTime);

                var workDayWeek = this.getWorkDay(this.options.date);
                _.each(this.options.columns, function(columnView){
                    columnView.view.date = this.options.date;
                    columnView.date = workDayWeek;
                    columnView.view.calculateBuffers();
                }.bind(this));

                if (current && this.options.columns[_.keys(this.options.columns)[current+1]]) {
                    this.options.nextDay = this.options.columns[_.keys(this.options.columns)[current+1]];
                    this.options.hideNext = false;
                } else {
                    this.options.hideNext = true;
//                    this.options.nextDay = this.options.columns[_.keys(this.options.columns)[0]];
                }
                this.options.data.set('currentDay', workDay);

                this.initializeRows();

                // Set height +2 - for bottom
                this.options.calendarOptions.height = this.options.rows.length * this.options.data.get('cellHeight') + 2;

                this.loadNotes();

                this.options.reload = false;
                this.options.hidden = false;
            } else {
                this.options.hidden = true;
            }
        },
        updateScrollBar: function() {
        },
        setBounds: function(maxFromTime, maxToTime) {
            this.options.maxToTime = maxToTime;
            this.options.maxFromTime = maxFromTime;
        }
    });
}
