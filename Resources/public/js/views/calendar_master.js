function initializeCalendarWidgetView(base) {
    // Just calendar widget: showing notes and table
    base.CalendarWidgetView = Backbone.View.extend({
        hidden: true,
        rivets: null,
        popup: null,
        draggable: false,
        onDrag: {},
        // options
        options: {

        },
        // default options
        defaults: {
            disable: false,
            masters: [],
            rows: [],
            startTime: 10*60,
            endTime: 22*60,
            show: false,
            notes: {},
            height: 12
        },
        // Template for popup with note controls
        popupTemplate: '<div class="note-data-edit well well-lg"><div class="close glyphicon glyphicon-remove" rv-on-click="view.closePopup"></div>' +
            '<form class="form-horizontal">' +
            '<div class="form-group"><label for="phone">Телефон:</label><input type="text" rv-value="note:phone" id="phone" /></div>' +
            '<div class="form-group"><label>C:</label>' +
            '<input type="text" rv-value="note:hours" class="hours" size="2" maxlength="2" /> : ' +
            '<input type="text" rv-value="note:minutes"  class="minutes" size="2" maxlength="2" /></div>' +
            '<div class="checkbox"><label><input type="checkbox" rv-checked="note:reserveStart" rv-value="note:reserveStart">Наложение 15 мин до</label></div>' +
            '<div class="checkbox"><label><input type="checkbox" rv-checked="note:reserveEnd" rv-value="note:reserveEnd">Наложение 15 мин после</label></div>' +
            '<div class="actions">' +
            '<button type="submit" class="btn btn-info" rv-on-click="view.saveNote">Сохранить</button>' +
            '<button type="submit" class="btn btn-danger" rv-on-click="view.deleteNote">Удалить</button>' +
            '</div> ' +
            '</form>' +
            '</div>',

        showCalendar: function () {
            if (this.hidden) {
                this.$el.removeClass('hidden');
                this.hidden = false;
            }
        },

        hideCalendar: function () {
            if (!this.hidden) {
                this.$el.addClass('hidden');
                this.hidden = true;
            }
        },

        render: function () {
            rivets.bind(this.$el.find('.table')[0], this.options);
            this.$el.mousemove(this.drag.bind(this));
        },
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options, {
                closeMessage: this.closeMessage
            });
            this.options.setNotes = this.setNote.bind(this);
            this.render();
        },

        initializeRows: function() {
            _.each(this.options.rows, function() {
                this.options.rows.pop();
            }.bind(this));
            var hourLeft = 60;
            if (this.options.startTime % 60 > 0) {
                hourLeft = 60 - (this.options.startTime % 60);
            }
            for (var i = this.options.startTime; i <= this.options.endTime; ){
                var baseTime = Math.floor((i%60));
                var c = i + hourLeft;
                var minLeft = 15;
                if (c + baseTime + 15 > this.options.endTime) {
                    minLeft = this.options.endTime - (c + baseTime + 15);
                }
                for(var j = 0; j < hourLeft; j += minLeft) {
                    minLeft = 15;
                    var row = {
                        timeShow: false,
                        last: false,
                        empty: false
                    };
                    row.id = (i + j);
                    if (j == 0) {
                        row.timeShow = true;
                        row.time = (Math.floor(i/60)) + ':' + (baseTime > 10?baseTime:'00');
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
                if (i + hourLeft > this.options.endTime) {
                    hourLeft = this.options.endTime - i;
                }
                if (i == this.options.endTime) {
                    break;
                }
            }
            this.hidden = true;
            this.showCalendar();
        },
        showShadow: function (masters) {
            this.options.disable = true;
            _.each(this.options.masters, function(master, id) {
                this.options.masters.pop();
            }.bind(this));
            _.each(masters, function (master) {
                //master.disable = true;
                this.options.masters.push(master);
            }.bind(this));
        },
        hideShadow: function (masters) {
            if (this.options.disable) {
                this.options.disable = false;
//                _.each(masters, function (master) {
//                    master.disable = false;
//                }.bind(this));
            }
        },
        // set new master list
        setMasters: function(masters) {
            var show = false;
            _.each(this.options.masters, function(){
                this.options.masters.pop();
            }.bind(this));
            _.each(masters, function(master) {
                this.options.masters.push(master);
                if (master.active) {
                    show = true;
                }
            }.bind(this));
            this.options.show = show;
            this.hidden = !show;
            this.options.disable = !show;
            if (!show) {
                this.showShadow(masters);
                //base.categoriesView.selectAll();
            }
        },
        checkMasters: function() {
            var show = false;
            _.each(base.categoriesView.getActiveCategory().get('workers'), function(master) {
                if (master.active && !master.disable) {
                    show = true;
                    return {};
                }
            });
            if (!show) {
                base.calendar.widget.showShadow(base.categoriesView.getActiveCategory().get('workers'));
                _.each(base.categoriesView.getActiveCategory().get('workers'), function(worker){
                    worker.disable = false;
                });
            } else {
                base.calendar.widget.hideShadow(base.categoriesView.getActiveCategory().get('workers'));
            }
        },
        // add new note
        setNote: function(e, options){
            e.preventDefault(true);
            var time = $(e.target).parent().attr('data-time');
            time = parseInt(time);
            var master = $(e.target).attr('data-worker');

            master = base.categories.get(base.categoriesView.activeCat).get('workers')[master];
            var job = base.jobTypesView.currentJobType;
            var note = null;
            if (job && master.types) {
                _.each(master.types, function(type){
                    _.each(type.jobTypes, function(jobInfo) {
                        if (jobInfo.id == job) {
                            note = new base.OrderNote({
                                'date': base.calendar.date,
                                'fromTime': time,
                                'toTime': time + parseInt(jobInfo.duration),
                                'service': jobInfo,
                                'editable': true,
                                'owner': master,
                                'new': true
                            });
                        }
                    })
                });
                if(note && note.validate(
                    base.CalendarWidgetView.getStartTime(note, this.options),
                    base.CalendarWidgetView.getEndTime(note, this.options),
                    this.options.notes)
                    ) {
                    //hideBSMessage();
                    base.calendar.hideMessage();
                    base.calendar.widget.options.notes[note.get('id')] = note;
                    base.calendar.widget.renderNotes();
                }
            }
        },
        // show controls popup
        editPopup: function (note) {
            var start = note.get('fromTime') - note.get('fromTime') % 15;
            var td = this.$el.find('tr[data-time="' + start + '"] td[data-worker="' + note.get('owner').master.id + '"]');
            var position = td.position();
            var container = this.$el.find('.edit-container').empty();
            container.append(this.popupTemplate);
            container.find('.note-data-edit').css('left', position.left);
            var height = this.$el.find('table').height();
            container.find('.note-data-edit').css('top', -1 * (height - position.top + container.find('.note-data-edit').outerHeight()));
            this.popup = rivets.bind(container[0], {
                note: note,
                view: this
            });
        },
        closePopup: function(e, parameters) {
            parameters.view.clearPopup();
        },
        clearPopup: function() {
            if (this.popup){
                this.popup.unbind();
            }
            this.$el.find('.edit-container').empty();
        },
        saveNote: function(e, parameters) {
            e.preventDefault(true);
            if (parameters.note.validate(
                base.CalendarWidgetView.getStartTime(parameters.note, parameters.view.options),
                base.CalendarWidgetView.getEndTime(parameters.note, parameters.view.options),
                parameters.view.options.notes
            )) {
                if (parameters.note.get('new')) {
                    var oldId = parameters.note.get('id');
                }
                parameters.note.save(function(){
                    base.calendar.widget.clearNote(parameters.note);
                    base.calendar.widget.renderNote(parameters.note, true);
                    if (oldId) {
                        base.calendar.widget.options.notes[parameters.note.get('id')] = parameters.note;
                        delete base.calendar.widget.options.notes[oldId];
                    }
                    base.calendar.widget.clearPopup();
                });
            }
        },
        deleteNote: function(e, parameters) {
            e.preventDefault(true);
            if (!parameters.note.get('new')){
                $.ajax({
                    type: 'POST',
                    url: parameters.note.delete_url,
                    data: {
                        'order': parameters.note.get('id')
                    }
                }).success(function(data){
                    ////console.log('data');
                });
            }
            parameters.view.clearPopup();
            base.calendar.widget.clearNote(parameters.note);
            delete base.calendar.widget.options.notes[parameters.note.get('id')];
            //base.calendar.widget.renderNotes();
        },
        clearNotes: function () {
            this.$el.find('td.note').attr('data-note', false);
            this.$el.find('td.editable').unbind('mousedown');
            //this.$el.find('td.editable').unbind('click');
            this.$el.find('td.note').removeClass('note');
            this.$el.find('td.reserved').removeClass('reserved');
            this.$el.find('td.note-first').removeClass('note-first').empty();
            this.$el.find('td.editable').removeClass('editable');
            this.clearPopup();
        },
        clearNote: function(note){
            this.$el.find('td.editable[data-note="' + note.get('id') + '"]').each(function(){$(this).unbind('mousedown');});
            //this.$el.find('td.editable[data-note="' + note.get('id') + '"]').each(function(){$(this).unbind('click');});
            this.$el.find('td.note[data-note="' + note.get('id') + '"]').each(function(){$(this).removeClass('note')});
            this.$el.find('td.reserved[data-note="' + note.get('id') + '"]').each(function(){$(this).removeClass('reserved');});
            this.$el.find('td.note-first[data-note="' + note.get('id') + '"]').each(function(){$(this).removeClass('note-first').empty();});
            this.$el.find('td.editable[data-note="' + note.get('id') + '"]').each(function(){$(this).removeClass('editable');});
            this.$el.find('td.cell[data-note="' + note.get('id') + '"]').each(function(){$(this).removeAttr('data-note');});
        },
        renderNotes: function(newNotes) {
            if (typeof newNotes != 'undefined') {
                this.options.notes = newNotes;
            }
            this.clearNotes();
            _.each(this.options.notes, this.renderNote.bind(this));
            this.draggable = true;
        },
        renderNote: function(note, draggable) {
            var view = this;
            var fromTime = note.get('fromTime');
            var toTime = note.get('toTime');
            var first = fromTime - fromTime % 15;
            for (var i = first; i < toTime; i += 15) {
                var td = this.$el.find('tr[data-time="' + i + '"] td[data-worker="' + note.get('owner').master.id + '"]');
                td[0].className = td[0].className + ' note reserved';
                td[0].setAttribute('data-note', note.get('id'));
                if (i == first) {
                    td.addClass('note-first');
                    td.append('<div class="line"></div>');
                }
                if (note.get('editable')) {
                    td.addClass('editable');
                }
                if (draggable || view.draggable == false) {
                    td.bind('mousedown', function(e) {
                        var note = $(e.target).attr('data-note');
                        //view.options.notes[note].set('editable', true);
                        if (note && note != '0') {
                            base.cDrag = {
                                note: note,
                                baseX: e.pageX,
                                baseY: e.pageY
                            };
                        }
                    });
                    td.bind('click', function(e) {
                        var note = $(e.target).attr('data-note');
                        if (note) {
                            e.preventDefault(true);
                            note = view.options.notes[note];
                            if (note) {
                                view.editPopup(note);
                            }
                        }
                    });
                }
            }
            if(note.get('new')) {
                this.editPopup(note);
            }
        },
        drag: function(e, ui){
            var leftButtonDown = true;
            if ($.browser.msie && !e.button && !(document.documentMode >= 9)) {
                leftButtonDown = false;
            }
            if (e.which === 1 && leftButtonDown && window.OrderSystem.cDrag) {
                window.OrderSystem.cDrag.move = true;
                var view = base.calendar.widget;
                var x = e.pageX - base.cDrag.baseX;
                var y = e.pageY - base.cDrag.baseY;
                if (Math.abs(y) >= view.options.height || Math.abs(x) > 60) {
                    var note = base.cDrag.note;
                    var noteObj = view.options.notes[note];
                    //////console.log('move');
                    var k = Math.ceil(Math.abs(y) / view.options.height);
                    var change = false;
                    var baseFrom = parseInt(noteObj.get('fromTime')) ;
                    var baseTo = parseInt(noteObj.get('toTime'));
                    if (y > 0) {
                        noteObj.set('fromTime', baseFrom + k * 15);
                        noteObj.set('toTime', baseTo + k * 15);
                        change = true;
                        base.cDrag.baseY = e.pageY;
                    } else if (y < 0) {
                        noteObj.set('fromTime', baseFrom - k * 15);
                        noteObj.set('toTime', baseTo - k * 15);
                        change = true;
                        base.cDrag.baseY = e.pageY;
                    }
                    if (Math.abs(x) > 60) {
                        var currentMaster = parseInt($(e.target).attr('data-worker'));
                        var currentMasterId = -1;
                        _.each(view.options.masters, function(master, id){
                            if (master.master.id == currentMaster) {
                                currentMasterId = id;
                                return {};
                            }
                        });
                        //////console.log(currentMasterId, currentMaster, x);
                        if (x > 0 && view.options.masters[currentMasterId + 1]) {
                            noteObj.set('owner', view.options.masters[currentMasterId + 1]);
                            change = true;
                            //base.cDrag.baseX = e.pageX;
                        } else if (x < 0 && view.options.masters[currentMasterId - 1]) {
                            noteObj.set('owner', view.options.masters[currentMasterId - 1]);
                            change = true;
                            //base.cDrag.baseX = e.pageX;
                        }
                    }
                    if (change) {
                        if (noteObj.validate(
                            base.CalendarWidgetView.getStartTime(noteObj, view.options),
                            base.CalendarWidgetView.getEndTime(noteObj, view.options),
                            view.options.notes)
                            ) {
                            view.clearNote(noteObj);
                            view.renderNote(noteObj);
                        } else {
                            if (currentMasterId) {
                                noteObj.set('owner', view.options.masters[currentMasterId]);
                            }
                            noteObj.set('fromTime', baseFrom);
                            noteObj.set('toTime', baseTo);
                        }
                        ////console.log('Master changed', noteObj.get('owner').master.id);
                    }
                }
            }
        }
    }, {
        getStartTime: function(note, options) {
            var dayInfo = false;
            if (dayInfo = base.CalendarView.getMasterCurrentDayInfo(note.get('owner').master)) {
                return dayInfo.timeFrom;
            }
            return options.startTime;
        },
        getEndTime: function(note, options) {
            var dayInfo = false;
             if (dayInfo = base.CalendarView.getMasterCurrentDayInfo(note.get('owner').master)) {
                 return dayInfo.timeTo;
             }
            return options.endTime;
        }
    });

    $(document).mouseup(function(e){
        if (base.cDrag && base.cDrag.move) {
            var options = base.calendar.widget.options;
            var note = options.notes[base.cDrag.note];
            if (note.validate(
                base.CalendarWidgetView.getStartTime(note, options),
                base.CalendarWidgetView.getEndTime(note, options),
                options.notes)
                ) {
                ////console.log('After set', note.get('owner').master.id);
                options.notes[base.cDrag.note].save(function(){
                    base.calendar.widget.renderNotes();
                });
            }
            //base.calendar.widget.options.notes[base.cDrag.note].set('editable', false);
            base.cDrag = null;
            base.calendar.widget.draggable = false;
            base.calendar.widget.renderNotes();
        } else {
            base.sDrag = null;
        }
    });
};