function initializeSingleCalendarView(base) {
    base.SingleCalendarView = Backbone.View.extend({
        $calendar: null,
        $message: null,
        date: new Date,
        evenMaster: null,
        workDay: null,
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
        message: false,
        setBaseRange: function () {
            var day = this.date.getDay();
            var timeFrom = this.workDay.get('fromTime');
            var timeTo = this.workDay.get('toTime');
            this.widget.options.startTime = timeFrom;
            this.widget.options.endTime = timeTo;
            this.widget.initializeRows();
            this.widget.renderNotes(this.notes);
        },
        loadNotes: function () {
            //this.widget.checkMasters();
            $.ajax({
                url: this.loadNotesUrl,
                type: 'POST',
                data: {
                    date: {
                        d: this.date.getDate(),
                        m: this.date.getMonth() + 1,
                        y: this.date.getFullYear()
                    },
                    masters: [this.evenMaster.get('id')]
                }
            }).success(function (data) {
                    if (data.status == 1) {
                        this.notes = {};
                        _.each(data.notes, function (note, id) {
                            note.owner = this.evenMaster;
                            note.editable = false;
                            this.notes[note.id] = new base.OrderNote(note);
                        }.bind(this));
                        this.setBaseRange();
                    }
                }.bind(this));
        },
        loadPrev: function (e, view) {
            view.date.setDate(view.date.getDate() - 1);
            view.dateStrGenerate();
            view.loadNotes();
        },
        loadCurrent: function (e, view) {
            view.loadNotes();
        },
        loadNext: function (e, view) {
            view.date.setDate(view.date.getDate() + 1);
            view.dateStrGenerate();
            view.loadNotes();
        },
        dateStrGenerate: function () {
            this.dateStr = this.date.getDate() + ' ' + this.months[(this.date.getMonth() + 1)] + ', ' + this.days[this.date.getDay()];
        },
        initialize: function (options) {
            this.dateStrGenerate();
            this.notes = {};
            this.render();
        },
        showPicker: function (e, view) {
            view.$header.find('.datepicker input').datepicker('show');
        },
        render: function () {
            var view = this;
            this.$message = this.$el.find('.message');
            rivets.bind(this.$message[0], this);
            this.$header = this.$el.find('.calendar-header');
            this.$header.find('.datepicker input').datepicker({
                defaultDate: this.date,
                firstDay: 1,
                onSelect: function (e, ui) {
                    view.date.setDate(ui.selectedDay);
                    view.date.setMonth(ui.selectedMonth);
                    view.date.setYear(ui.selectedYear);
                    view.dateStrGenerate();
                    view.loadNotes();
                },
                beforeShowDay: function (date) {
                    return base.serviceWidget.checkDays(date);
                }
            });
            this.$header.find('.datepicker').datepicker('hide');
            rivets.bind(this.$header[0], this);
            this.$calendar = this.$el.find('.calendar');
            this.widget = new base.CalendarView({
                el: this.$calendar[0],
                notes: this.notes,
                header: true,
                singleColumn: true,
                calendar: this
            });
            this.$header.removeClass('hidden');
        },


        // Message controll
        showMessage: function (message) {
            var view = this;
            this.$message.fadeIn(400, function () {
                view.message = message;
                view.$message.removeClass('hidden');
            });
        },
        hideMessage: function () {
            var view = this;
            this.$message.hide(400, function () {
                view.$message.addClass('hidden');
                view.message = false;
            });
        },
        closeMessage: function () {
            base.calendar.hideMessage();
        },
        calendarShowHeader: function() {
            this.$header.removeClass('hidden');
        },
        calendarHideHeader: function() {
            this.$header.addClass('hidden');
        }
    }, {
        getMasterCurrentDayInfo: function (master) {
            var dayInfo = null;
            //////console.log(master.schedule.workDays[base.CalendarView.getCurrentDay()], base.CalendarView.getCurrentDay());
            var day = base.SingleCalendarView.getCurrentDay();
            if (master.get('schedule')) {
                _.each(master.get('schedule').get('workDays'), function (dayObj) {
                    if (dayObj.get('dayId') == day) {
                        dayInfo = dayObj;
                        return {};
                    }
                });
                if (dayInfo) {
                    return dayInfo;
                }
            }
            return false;
        },
        getCurrentDay: function () {
            return base.calendar.date.getDay();
        }
    });
}