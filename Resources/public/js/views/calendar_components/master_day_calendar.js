function initializeMasterDayCalendar(base) {
    base.MasterDayCaledar = base.BaseCalendarView.extend({
        loadDateNotesUrl: '/api/calendar/order/load/date',
        weekCalendar: {},
        dayCalendar: {},
        fromTime: null,
        toTime: null,
        customInitialize: function (options) {
            if (options.salons) {
                this.options.salons = {};
                _.each(options.salons, function(salon) {
                   this.options.salons[salon.id] = new base.EvenSalon(salon);
                }.bind(this));
            }
            this.options.dayOptions = {};
            this.options.days = {};
            var newWeek = this.getWeekDays(this.options.date);

            _.each(newWeek, function(day, id) {
                var workDayWeek = this.getWorkDay(day.day);
                if (workDayWeek.get('active')) {
                    this.options.days[id] = day;
                }
            }.bind(this));
        },
        compareDay: function (timeCurrent, baseTime) {
            return Math.floor(timeCurrent / (1000 * 60 * 60 * 24)) == Math.floor(baseTime / (1000 * 60 * 60 * 24));
        },
        loadNotes: function () {
            var salons = {};
            _.each(this.options.salons, function(salon) {
                salons[salon.get('id')] = salon.model;
            });
            this.executeForColumns(function(dayInfo, column) {
                column.view.clear();
            });
            dates = [];
            _.each(this.options.columns, function(dayInfo) {
//                ////console.log("DAY info", dayInfo);
                dates.push({
                    d: dayInfo.day.day.getDate(),
                    m: dayInfo.day.day.getMonth() + 1,
                    y: dayInfo.day.day.getFullYear()
                });
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
                            if(this.options.showNotes.indexOf(note.id.toString()) >= 0) {
                                noteModel.set('edit', true);
                                noteModel.set('showInfo', false);
                                columnView.interfaces[0].showPopup = true;
                            }
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
            _.each(this.options.columns, function(dayInfo) {
//                //console.log("date", date, dayInfo.day);
                if (typeof(date) == 'string') {
                    if (dayInfo.day.day_id == date) {
                        _.each(dayInfo.columns, callback);
                    }
                } else {
                    if (calendar.compareDay(dayInfo.day.day, date)) {
                        _.each(dayInfo.columns, callback);
                    }
                }
            });

            return columnVew;
        },
        calculateBuffers: function(callback, columnView) {
            if ( typeof(columnView.model.get('dayId')) == 'number') {
                callback.call(callback, columnView.model.get('dayId') + 1, this.fromTime, this.toTime);
            } else {
                callback.call(callback, parseInt(columnView.model.get('dayId')) + 1, this.fromTime, this.toTime);
            }
        },
        executeForColumns: function(callback) {
            var calendar = this;
            ////console.log("COLUMNS", this.options.columns);
            _.each(this.options.columns, function(dayInfo) {
                _.each(dayInfo.columns, function(column){
                    callback.call(calendar, dayInfo, column);
                });
            });
        },
        initializeColumns: function () {
            var info = this;
            var columns = {};
            _.each(this.options.days, function (day, dayId) {
                columns[dayId] = {
                    day: day,
                    columns: [],
                    salons: []
                };
                _.each(info.options.salons, function(salon) {
                    var columnInfo = new base.ColumnInfo(salon.attributes);
                    columnInfo.set('dayId', dayId);

                    var columnView = new base.ColumnView({
                        model: columnInfo,
                        baseInfo: info.options.data,
                        calendarView: info,
                        date: day
                    });
                    var interfaceColumn = columnView.createInterface(dayId, day);
                    columns[dayId].columns.push(interfaceColumn);
                    columns[dayId].salons.push(columnInfo);
                    columnInfo.set('active', true);

                    info.options.data.get('columns').push(columnInfo);
                });
            });
//            info.options.columns = _.toArray(columns);
            info.options.columns = columns;
        },

        getWorkDay: function (date) {
            return this.options.data.get('schedule').get('workDays')[(date.getDay() > 0) ? (date.getDay() - 1) : 6];
        },
        changeDate: function (date) {
            // Check is Sunday
            var workDay = this.checkNextActiveDay(date);
            this.options.date = date;
            if (workDay.get('active') && this.options.data.get('schedule').checkSupply(date)) {
                var newWeek = this.getWeekDays(this.options.date);

                this.options.reload = true;

                this.dateStrGenerate();
                var current = null;
                var count = 0;
                _.each(newWeek, function(day, id) {
                    var workDayWeek = this.getWorkDay(day.day);
                    if (workDayWeek.get('active') && this.options.data.get('schedule').checkSupply(date)) {
                        this.options.columns[id].day['day'] = day.day;

                        if (Math.floor(day.day.getTime()/24*3600) == Math.floor(this.options.date.getTime()/24*3600)) {
                            this.options.currentDay = this.options.columns[id];
                            this.options.dayOptions.currentDay = id;
                            current = count;
                        }
                        count++;
                    }
                }.bind(this));

                var info = this;
                _.each(this.options.columns, function(dayInfo){
                    _.each(dayInfo.columns, function(column) {
                        _.each(column.view.model.get('schedule').get('workDays'), function(workDay) {
                            if (workDay.get('active') && info.options.data.get('schedule').checkSupply(date)) {
                                if (info.fromTime == null || info.fromTime > workDay.get('fromTime')) {
                                    info.fromTime = workDay.get('fromTime');
                                    ////console.log("FROM TIME", info.fromTime);
                                }
                                if (info.toTime == null || info.toTime < workDay.get('toTime')) {
                                    info.toTime = workDay.get('toTime');
                                    ////console.log("TO TIME", info.toTime);
                                }
                            }
                        });
                    });
                });
                // Next day
                // TODO: Check it
                if (current) {
                    this.options.nextDay = this.options.columns[_.keys(this.options.columns)[current+1]];
                    this.options.dayOptions.nextDay = current+1;

                    var hideNext = true;
                    if (this.options.nextDay){
                        // Check show show any next columns
                        _.each(this.options.nextDay.columns, function(column) {
                            if (column.show) {
                                hideNext = false;
                                return {};
                            }
                        });
                    }

                    this.options.hideNext = hideNext;
                }

                this.options.data.set('currentDay', workDay);
                this.initializeRows();

                this.heightAlgorithm(this);

                this.loadNotes();

                this.options.reload = false;
                this.options.hidden = false;
            } else {
                MainElements.messageManager.showMessage("Сегодня (" + this.days[date.getDay()] + ") вы не работаете.", 10000);
                this.options.hidden = true;
            }
//            if (this.scrollPane) {
//                setTimeout(function(){
//                    //console.log("TEST", this.scrollPane.find('.mCSB_container'));

//                }.bind(this), 100);
//            }
            this.updateScrollBar();
        },

        showWeekCalendar: function (e, parameters) {
            e.preventDefault();
            parameters.view.activateWeekCalendar();
        },

        showDayCalendar: function (e, parameters) {
            e.preventDefault();
            parameters.view.activateDayCalendar();
        },

        categoryDisableOther: function (e, parameters) {
            parameters.data.categoryDisableOther(parameters.category.id);
        },

        categoryToggle: function (e, parameters) {
            parameters.data.activateCategory(parameters.category);
        },

        activateAll: function (el, parameters) {
            parameters.data.activateAllCategories();
        },

        activateWeekAndMasterOnlyCallback: function(e, parameters) {
            e.preventDefault(true);
            parameters.view.activateMasterOnly(parameters);
            parameters.view.activateWeekCalendar();
            parameters.view.options.markAbility = true;
        },

        activateMasterOnly: function (parameters) {
            _.each(parameters.data.get('categories'), function (category) {
                _.each(category.masters, function (master) {
                    if (parameters.column.view.model.get('id') != master.id) {
                        master.set('active',false);
                    }
                })
            });
            _.each(parameters.data.get('categories'), function (category) {
                var showCategory = false;
                _.each(category.masters, function (master) {
                    if (master.get('active')) {
                        showCategory = true;
                        return {};
                    }
                });
                category.active = showCategory;
            });
        },
        activateMaster: function (parameters) {
            _.each(parameters.data.get('categories'), function (category) {
                _.each(category.masters, function (master) {
                    if (parameters.column.view.model.get('id') == master.id) {
                        category.active = true;
                        master.set('active',true);
                    }
                })
            });
        },

        checkDatePickerDay: function(date) {
            var mid = 0;
            var cDate = new Date();
            cDate.setDate(cDate.getDate() - 1);
            if (!(date >= cDate) || !this.options.data.get('schedule').checkSupply(date)) {
                return [false];
            }
            var workDay = this.getWorkDay(date);
            return [workDay.get('active')];
        },
        choseDayAndDayCalendar: function(e, parameters){
            parameters.view.options.markAbility = true;
            parameters.view.activateDayCalendar();
            parameters.view.changeDate(parameters.day_info.day.day)
        },
        activateMasterOnlyCallback: function(el, parameters) {
            el.preventDefault(true);
            this.activateMasterOnly(parameters);
        },
        activateMasterCallback: function(el, parameters) {
            el.preventDefault(true);
            ////console.log('Activate callback');
        },

        loadPrev: function (e, parametrs) {
            if (parametrs.data.get('weekCalendar')) {
                parametrs.date = parametrs.view.addDays(parametrs.date, -7);
            } else {
                parametrs.date = parametrs.view.addDays(parametrs.date, -1);
            }
            parametrs.view.checkPrevActiveDay(parametrs.date);
            parametrs.view.changeDate(parametrs.date);
        },
        loadCurrent: function (e, parametrs) {
            parametrs.view.changeDate(parametrs.date);
            parametrs.view.checkNextActiveDay(parametrs.date);
        },
        loadNext: function (e, parametrs) {
            if (parametrs.data.get('weekCalendar')) {
                parametrs.date = parametrs.view.addDays(parametrs.date, 7);
            } else {
                parametrs.date = parametrs.view.addDays(parametrs.date, 1);
            }
            parametrs.view.checkNextActiveDay(parametrs.date);
            parametrs.view.changeDate(parametrs.date);
        },
        activateWeekCalendar: function(){
            this.options.data.set('weekCalendar', true);
        },
        activateDayCalendar: function() {
            this.options.data.set('weekCalendar', false);
        },
        saveMasterSupply: function(e, parameters) {
            e.preventDefault();
            parameters.data.get('schedule').save();
        }
    })
};