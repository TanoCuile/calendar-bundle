function initializeDayCalendar(base) {
    /**
     * Api for calendar
     * Set categories
     * categories: [
     *  {
     *      name: 'sdsds',
     *      id: 1,
     *      preview: 's1',
     *      masters: {
     *          id: {
     *              name: 'sds',
     *              id: '2'
     *          }
     *      }
     *  }
     * ]
     **/
    base.DayCalendarView = base.BaseCalendarView.extend({
        loadDateNotesUrl: '/api/calendar/order/load/date',
        weekCalendar: {},
        dayCalendar: {},
        customInitialize: function (options) {
            this.options.day = {day: null};
            this.options.weekOptions = {
                columns: {},
                days: {}
            };
            var newWeek = this.getWeekDays(this.options.date);

            _.each(newWeek, function(day, id) {
                var workDayWeek = this.getWorkDay(day.day);
                if (workDayWeek.get('active') && this.options.data.get('schedule').checkSupply(day.day)) {
                    this.options.weekOptions.days[id] = day;
                }
            }.bind(this));
        },

        initializeDayColumns: function (category, ids, cid, models, info, views) {
            var workDay = this.getWorkDay(info.options.date);
            _.each(category.masters, function (master, id) {
                if (ids.indexOf(master.id) < 0) {
                    ids.push(master.id);
                    var columnInfo = new base.ColumnInfo(_.extend(master, { category: cid }));
                    models[master.id] = columnInfo;
                    category.masters[id] = columnInfo;
                    category.masters[id].set('active', true);

                    var columnView = new base.ColumnView({
                        model: models[master.id],
                        baseInfo: info.options.data,
                        calendarView: info,
                        date: info.options.day,
                        'autoCalculate': false
                    });
                    views[master.id] = columnView;
//                    info.options.columns.push(columnView.createInterface(workDay.get('dayId'), info.options.date, category.id));
                } else {
                    category.masters[id] = models[master.id];
//                    info.options.columns.push(views[master.id].createInterface(workDay.get('dayId'), info.options.date, category.id));
                }

                info.options.data.get('columns').push(category.masters[id]);
            });
        },

        checkDatePickerDay: function(date) {
            var mid = 0;
            var cDate = new Date();
            cDate.setDate(cDate.getDate() - 1);
            if (!(date >= cDate) && this.options.data.get('schedule').checkSupply(date)) {
                return [false];
            }
            var workDay = this.getWorkDay(date);
            return [workDay.get('active')];
        },
        compareDay: function (timeCurrent, baseTime) {
//            //console.log("COMPARE", (timeCurrent - timeCurrent % (1000 * 60 * 60 * 24)), (baseTime - baseTime % (1000 * 60 * 60 * 24)));
            return (timeCurrent - timeCurrent % (1000 * 60 * 60 * 24)) == (baseTime - baseTime % (1000 * 60 * 60 * 24));
        },
        initializeWeekColumns: function (ids, models, info, views) {

            _.each(this.options.weekOptions.days, function (day, dayId) {
                info.options.weekOptions.columns[dayId] = {
                    day: day,
                    categories: {},
                    views: {}
                };
                _.each(info.options.data.get('categories'), function (category, cid) {
                    info.options.weekOptions.columns[dayId].categories[cid] = {
                        category: category,
                        columns: [],
                        masters: {}
                    };
                    _.each(category.masters, function (master, id) {
                        var timeCurrent = day.day.getTime();
                        var baseTime = info.options.date.getTime();
                        if (!info.options.weekOptions.columns[dayId].views[id]) {
                            ids.push(master.id);
                            info.options.weekOptions.columns[dayId].categories[cid].masters[id] =
                                new base.ColumnInfo(_.extend(master, { category: cid }));
                            info.options.weekOptions.columns[dayId].categories[cid].masters[id].set('active', true);
////console.log("DATE ", day);
                            var columnView = new base.ColumnView({
                                model: models[master.id],
                                baseInfo: info.options.data,
                                calendarView: info,
                                date: day
                            });
                            info.options.weekOptions.columns[dayId].views[id] = columnView;
                            info.options.weekOptions.columns[dayId].categories[cid].columns
                                .push(columnView.createInterface(dayId, day.day, cid));

                            info.options.data.get('weekColumns').push(category.masters[id]);
                        } else {
                            info.options.weekOptions.columns[dayId].categories[cid].columns
                                .push(info.options.weekOptions.columns[dayId].views[id]
                                    .createInterface(dayId, day.day, cid));
                        }
                    });
                });
            });
        },

        loadNotes: function () {
            var masters = {};
            _.each(this.options.columns, function(master) {
                masters[master.view.model.get('id')] = master.view.model;
            });
            this.executeForColumns(function(dayInfo, categoryInfo, column) {
                column.view.clear();
            });
            dates = [];
            _.each(this.options.weekOptions.columns, function(dayInfo) {
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
                    owners: _.keys(masters)
                }
            }).success(function (data) {
                    if (data.status == 1) {
//                        this.options.data.setNotes(data.notes);
                        _.each(data.notes, function (note, id) {
                            if (note.service) {
                                var column = this.options.data.getColumn(note.owner.id, note.category);
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
                                    columnView.initializeAddNoteView(noteModel);
                                    if(this.options.showNotes.indexOf(note.id.toString()) >= 0) {
                                        noteModel.set('edit', true);
                                        noteModel.set('showInfo', false);
                                        columnView.interfaces[0].showPopup = true;
                                    }
                                } else {
                                    console.error("Column not found", note.owner.id, note.category, noteModel.get('date'), this.options);
                                }
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
            //console.log("Date", date);
            if (!date) {
                _.each(this.options.columns, function(column) {
                    //console.log("COLUMN INSIDE", column);
                    if (column.view.model.get('id') == mid && (!cid || column.category == cid)) {
                        columnVew = column.view;
                        return {};
                    }
//                    _.each(dayInfo.categories, function(categoryInfo) {
//                        if (categoryInfo.category.id == cid) {
//                            _.each(categoryInfo.columns, callback);
//                        }
//                    });
                });
            } else {
                _.each(this.options.weekOptions.columns, function(dayInfo) {
                    //console.log("DATE");
                    if (typeof(date) == 'string') {
                        if (dayInfo.day.day_id == date) {
                            _.each(dayInfo.categories, function(categoryInfo) {
                                if (categoryInfo.category.id == cid) {
                                    _.each(categoryInfo.columns, callback);
                                }
                            });
                        }
                    } else {
//                        //console.log("COMPARE", date.getDate(), dayInfo.day.day.getDate(), calendar.compareDay(dayInfo.day.day.getTime(), date.getTime()));
                        if (
//                            calendar.compareDay(dayInfo.day.day.getTime(), date.getTime()) &&
                            date.getDate() == dayInfo.day.day.getDate()) {
                            _.each(dayInfo.categories, function(categoryInfo) {
                                if (categoryInfo.category.id == cid) {
                                _.each(categoryInfo.columns, callback);
                                }
                            });
                        }
                    }
                });
            }
            ////console.log("Return data");

            return columnVew;
        },
        executeForColumns: function(callback) {
            var calendar = this;
            _.each(this.options.weekOptions.columns, function(dayInfo) {
                _.each(dayInfo.categories, function(categoryInfo) {
                    _.each(categoryInfo.columns, function(column){
                        callback.call(calendar, dayInfo, categoryInfo, column);
                    });
                });
            });
        },
        initializeColumns: function () {
            var info = this;
            var ids = [];
            var models = {};
            var views = {};
            _.each(info.options.data.get('categories'), function (category, cid) {
                if (category.masters) {
                    info.initializeDayColumns(category, ids, cid, models, info, views);
                    if (_.toArray(category.masters).length == 0) {
                        category.disabled = true;
                    } else {
                        category.disabled = false;
                    }
                }
            });
            info.initializeWeekColumns(ids, models, info, views);
            var workDay = this.getWorkDay(this.options.date);
            this.initDayColumnsByWeek(workDay);
            this.options.data.set('masters', models);
        },

        initDayColumnsByWeek: function (workDay) {
            if (this.options.weekOptions.columns[workDay.get('dayId') - 1]) {
                _.each(this.options.weekOptions.columns[workDay.get('dayId') - 1].categories, function (categoryInfo) {
                    _.each(categoryInfo.columns, function (column) {
                        this.options.columns.push(column);
                    }.bind(this))
                }.bind(this));
            }
        },
        calculateHeight: function (info, date) {
            if (info.options.data.get('weekCalendar') == true) {
                _.each(this.options.data.get('schedule').get('workDays'), function (workDay) {
                    if (workDay.get('active') && info.options.data.get('schedule').checkSupply(date)) {
                        if (info.fromTime == null || info.fromTime > workDay.get('fromTime')) {
                            info.fromTime = workDay.get('fromTime');
                        }
                        if (info.toTime == null || info.toTime < workDay.get('toTime')) {
                            info.toTime = workDay.get('toTime');
                        }
                    }
                });
            } else {
                var workDay = info.getWorkDay(date);
                _.each(info.options.columns, function(column){
                    var day = column.view.model.get('schedule').get('workDays')[workDay.get('dayId')-1];
                    if (info.fromTime == null || info.fromTime > day.get('fromTime')) {
                        info.fromTime = day.get('fromTime');
                    }
                    if (info.toTime == null || info.toTime < day.get('toTime')) {
                        info.toTime = day.get('toTime');
                    }
                });
            }
        },
        changeCalendarHeight: function (info, date) {
            this.calculateHeight(info, date);

            this.initializeRows();

            this.heightAlgorithm(info);

//                this.trigger('change:date', this);
            this.executeForColumns(function (dayInfo, categoryInfo, column) {
                column.view.calculateBuffers(dayInfo.day.day.getDay(), info.fromTime, info.toTime);
            });
        },
        changeDate: function (date) {
            // Check is Sunday
            var info = this;
            var workDay = this.checkNextActiveDay(date);
            this.options.date = date;
            this.options.day.day = this.options.date;
            var newWeek = this.getWeekDays(this.options.date);

            _.each(newWeek, function(day, id) {
                var workDayWeek = this.getWorkDay(day.day);
                if (workDayWeek.get('active') && this.options.data.get('schedule').checkSupply(day.day)) {
                    this.options.weekOptions.columns[id].day['day'] = day.day;
                }
            }.bind(this));

            this.options.reload = true;

            this.dateStrGenerate();

            this.options.data.set('currentDay', workDay);

            this.changeCalendarHeight(info, date);

            _.each(this.options.columns, function(column) {
                this.options.columns.pop();
            }.bind(this));

            this.initDayColumnsByWeek(workDay);

            this.loadNotes();
            //console.log("$columns", this.options.columns);

            this.options.reload = false;
            this.options.hidden = false;

            this.updateScrollBar();
        },
        calculateBuffers: function(callback, columnView) {
            if ( typeof(columnView.model.get('dayId')) == 'number') {
                callback.call(callback, columnView.model.get('dayId') + 1, this.fromTime, this.toTime);
            } else {
                callback.call(callback, parseInt(columnView.model.get('dayId')) + 1, this.fromTime, this.toTime);
            }
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

        masterClickHandler: function(e, parameters) {
            e.preventDefault(true);
            if (!parameters.master.get('active')) {
                parameters.view.activateMaster(parameters);
            } else {
                parameters.view.disactivateMaster(parameters);
            }
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
                    if (parameters.master.get('id') == master.id) {
                        category.active = true;
                        master.set('active',true);
                    }
                })
            });
        },
        disactivateMaster: function(parameters) {
            _.each(parameters.data.get('categories'), function (category) {
                _.each(category.masters, function (master) {
                    if (parameters.master.get('id') == master.id) {
                        category.active = true;
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
        choseDayAndDayCalendar: function(e, parameters){
            ////console.log("View", parameters.day);
            parameters.view.options.markAbility = true;
            parameters.view.activateDayCalendar();
            parameters.view.changeDate(parameters.day_info.day.day)
        },
        activateMasterOnlyCallback: function(el, parameters) {
            el.preventDefault(true);
            ////console.log("Col", parameters.column);
            this.activateMasterOnly(parameters);
        },
        activateMasterCallback: function(el, parameters) {
            el.preventDefault(true);
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
            this.changeCalendarHeight(this, this.options.date);
        },
        activateDayCalendar: function() {
            this.options.data.set('weekCalendar', false);
            this.changeCalendarHeight(this, this.options.date);
        }
    })
}