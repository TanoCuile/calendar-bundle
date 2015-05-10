function initializeQuickColumnCalendar(base) {
    base.QuickColumnCalendar = base.BaseCalendarView.extend({
        loadDateNotesUrl: '/api/calendar/order/load/date',
        initialize: function(options){
            this.options = _.extend(this.defaults, this.options, options);

            this.options.data = new base.DayCalendarInfo(_.extend(options, {categories: this.options.categories}));
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
            this.initializeColumns();

//            this.bind = rivets.bind(this.el, this.options);

            this.$el.removeClass('hidden');

            if (this.options.data.get('schedule').get('id')) {
                // Change default date
                this.changeDate(this.options.date);
            }
        },
        showCalendar: function() {
            this.options.hidden = false;

            this.changeDate(this.options.date);
        },
        changeMaster: function(master, schedule, duration) {
            this.options.columns[0].view.model = master;
            this.options.columns[0].view.defaultDuration = duration;
//            this.options.data.set('schedule', schedule);
        },
        onNoteAdd: function() {

        },

        initializeTable: function() {
            var view = this;
            return function(el, parameters) {
                $(el).hover(function(event) {
                    parameters.calendar.options.markAbility = true;
                }.bind(this), function(event){
                    parameters.calendar.options.markAbility = false;
                }.bind(this));
            }
        },
        initializeColumns: function () {
            if (this.options.columns.length > 0) {
                _.each(this.options.columns, function() {
                    this.options.columns.pop();
                }.bind(this));
            }
//            var workDay = this.getWorkDay(this.options.date);
            var columnInfo = new base.ColumnInfo({});
            var columnView = new base.QuickColumn({
                calendarView: this,
                calendarInfo: this.options.data,
                onNoteAdd: this.onNoteAdd
            });
            this.options.columns.push(columnView.createInterface());
            this.options.data.get('columns').push(columnInfo);
        },
        executeForColumns: function(callback) {
            var calendar = this;
            _.each(this.options.columns, function(column) {
                callback.call(calendar, column);
            })
        },
        loadNotes: function () {
            if (this.options.columns[0]) {
                var masters = {};
                this.executeForColumns(function(column) {
                    column.view.clear();
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
                        owners: [this.options.columns[0].view.model.get('id')]
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
                                    masters[note.owner.id],
                                    note.service,
                                    false,
                                    false,
                                    false,
                                    note);
                                var columnView = this.getColumnView(note.owner.id, note.category, noteModel.get('date'));
                                if (columnView) {
                                    columnView.view.initializeAddNoteView(noteModel);
                                } else {
                                    console.error("column not found", note);
                                }
                            }.bind(this));
                        }
                    }.bind(this));
            }
        },
        setData: function(master) {
            this.options.columns[0].view.model = master
            this.options.data.get('columns').pop();
            this.options.data.get('columns').push(master);
        },

        setSchedule: function(schedule) {
            this.options.data.set('schedule', schedule);
        },

        getWorkDay: function (date) {
            return this.options.data.get('schedule').get('workDays')[(date.getDay() > 0) ? (date.getDay() - 1) : 6];
        },

        getColumnView: function(){
            return this.options.columns[0];
        },
        setCurrentDay: function (date) {
            var workDay = this.getWorkDay(date);

            this.options.data.set('currentDay', workDay);

            if (this.options.maxToTime && this.options.maxToTime < this.options.data.get('currentDay').get('timeTo')) {
                this.toTime = this.options.maxToTime
            } else {
                this.toTime = this.options.data.get('currentDay').get('timeTo');
            }
            if (this.options.maxFromTime && this.options.maxFromTime > this.options.data.get('currentDay').get('timeFrom')) {
                this.fromTime = this.options.maxFromTime;
            } else {
                this.fromTime = this.options.data.get('currentDay').get('timeFrom');
            }
            return workDay;
        },
        clear: function () {
            this.executeForColumns(function (column) {
                column.view.clear();
            });
        },
        changeDate: function (date) {
            // Check is Sunday
            this.clear();
            var workDay = this.setCurrentDay(date);
            this.options.date = date;

            if (workDay.get('active') && this.options.data.get('schedule').checkSupply(date)) {
                this.options.reload = true;

                this.dateStrGenerate();

                this.initializeRows();

                // Set height +2 - for bottom
                this.options.calendarOptions.height = this.options.rows.length * this.options.data.get('cellHeight') + 2;

                this.loadNotes();

//                this.trigger('change:date', this);
                this.executeForColumns(function(column) {
                    column.view.calculateBuffers(workDay);
                });

                this.options.reload = false;
                this.options.hidden = false;
            } else {
//                MainElements.messageManager.showMessage("Сегодня (" + this.days[date.getDay()] + ") вы не работаете.", 10000);
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