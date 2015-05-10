function initializeCalendarView(base) {
    base.CalendarView = Backbone.View.extend({
        $calendar: null,
        $message: null,
        $header: null,
        date: new Date,
        evenMasters: null,
        notes: null,
        widget: null,
        loadNotesUrl: '/api/calendar/order/load',
        dateStr: '',
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
            1: 'Января',$(el).attr('data-original-title', value)
                    .tooltip('fixTitle');
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
        message: false,
        setBaseRange: function () {
            var day = this.date.getDay();
            var timeFrom = false;
            var timeTo = false;
            _.each(base.categoriesView.getActiveCategory().get('workers'), function (master) {
                var dayInfo = false;
                if (dayInfo = master.master.schedule.workDays[day]) {
                    if (!timeFrom || timeFrom > dayInfo.timeFrom) {
                        timeFrom = dayInfo.timeFrom;
                    }
                    if (!timeTo || timeFrom < dayInfo.timeTo) {
                        timeTo = dayInfo.timeTo;
                    }
                }
                timeFrom = timeFrom ? timeFrom : 8 * 60;
                timeTo = timeTo ? timeTo : 22 * 60;
            });
            this.widget.options.startTime = timeFrom;
            this.widget.options.endTime = timeTo;
            this.widget.initializeRows();
            this.widget.renderNotes(this.notes);
        },
        loadNotes: function () {
            var masters = [];
            var workers = base.categoriesView.getActiveCategory().get('workers');
            _.each(workers, function (master) {
                if( !master.master.schedule.workDays[base.calendar.date.getDay()] ) {
                    master.disable = true;
                } else {
                    master.disable = false;
                    masters.push(master.master.id);
                }
            });
            this.widget.checkMasters();

            $.ajax({
                url: this.loadNotesUrl,
                type: 'POST',
                data: {
                    date: {
                        d: this.date.getDate(),
                        m: this.date.getMonth() + 1,
                        y: this.date.getFullYear()
                    },
                    masters: masters
                }
            }).success(function (data) {
                    if (data.status == 1) {
                        this.notes = {};
                        _.each(data.notes, function (note, id) {
                            note.owner = workers[note.owner.id];
                            this.notes[note.id] = new base.OrderNote(note);
                        }.bind(this));
                        this.setBaseRange();
                    }
                }.bind(this));
        },
        loadPrev: function(e, view) {
            view.date.setDate(view.date.getDate() - 1);
            view.dateStrGenerate();
            view.loadNotes();
        },
        loadCurrent: function(e, view) {
            view.loadNotes();
        },
        loadNext: function(e, view) {
            view.date.setDate(view.date.getDate() + 1);
            view.dateStrGenerate();
            view.loadNotes();
        },
        dateStrGenerate: function () {
            this.dateStr = this.date.getDate() + ' ' + this.months[(this.date.getMonth() + 1)] + ', ' + this.days[this.date.getDay()];
        },
        initialize: function(options) {
            this.dateStrGenerate();
            this.masterDurations = options.masterDurations;
            if (options.notes) {
                this.notes = options.notes;
            } else {
                this.notes = {};
            }
            this.render();
        },
        showPicker: function(e, view) {
            view.$header.find('.datepicker input').datepicker('show');
        },
        render: function() {
            var view = this;
            this.$message = this.$el.find('.message');
            rivets.bind(this.$message[0], this);
            this.$header = this.$el.find('.calendar-header');
            this.$header.find('.datepicker input').datepicker({
                defaultDate: this.date,
                onSelect: function(e, ui) {
                    view.date.setDate(ui.selectedDay);
                    view.date.setMonth(ui.selectedMonth);
                    view.date.setYear(ui.selectedYear);
                    view.dateStrGenerate();
                    view.loadNotes();
                },
                beforeShowDay: function(date) {
                    var mid = 0;
                    if (date < new Date()) {
                        return [false];
                    }
//                    _.each(base.categoriesView.getActiveCategory().get('workers'), function(master){
//                        ////console.log(master);
//                    });
//                    if (this.master) {
//                        mid = this.master.get('id');
//                    }
//                    if (this.master && base.schedules[mid]) {
//                        this.schedule = base.schedules[mid];
//                    } else {
//                        this.schedule = base.schedule;
//                    }
//                    var day = date.getDay();
//                    var workDay = this.getWorkDay(this.schedule, day);
//                    if (workDay) {
//                        return [true];
//                    }
                    return [true];
                }
            });
            this.$header.find('.datepicker').datepicker('hide');
            rivets.bind(this.$header[0], this);
            this.$calendar = this.$el.find('.calendar');
            this.widget = new base.CalendarWidgetView({
                el: this.$calendar[0],
                masterDurations: this.masterDurations,
                notes: this.notes,
                header: true,
                singleColumn: false
            });
            this.$header.removeClass('hidden');
        },
        loadDayData: function(date) {

        },
        showMessage: function(message) {
            var view = this;
            this.$message.fadeIn(400, function(){
                view.message = message;
                view.$message.removeClass('hidden');
            });
        },
        hideMessage: function() {
            var view = this;
            this.$message.hide(400, function(){
                view.$message.addClass('hidden');
                view.message = false;
            });
        },
        closeMessage: function() {
            base.calendar.hideMessage();
        }
    }, {
        getMasterCurrentDayInfo: function(master) {
            var dayInfo = null;
            //////console.log(master.schedule.workDays[base.CalendarView.getCurrentDay()], base.CalendarView.getCurrentDay());
            if (master.schedule && (dayInfo = master.schedule.workDays[base.CalendarView.getCurrentDay()])) {
                return dayInfo;
            }
            return false;
        },
        getCurrentDay: function () {
            return base.calendar.date.getDay();
        }
    });
}
