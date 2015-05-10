function initializeBaseNote(base) {
    base.BaseNoteView = Backbone.View.extend({
        topOffset: 0,
        popupOffsetTop: 0,
        popupInfoOffsetTop: 0,
        calendarData: null,
        columnData: null,
        customInitialize: function(options){},
        helps: {
            name: [],
            surname: [],
            phone: []
        },
        onDragStop: null,
        offsetTop: false,
        offsetBottom: false,
        initialize: function(options){
            this.customInitialize(options);

            this.model = options.model;
            this.calendarData = options.calendarData;
            this.columnData = options.columnData;
            this.columnView = options.columnView;
            if (!this.model.get('onEdit')) {
                this.calculateOffsetTop();
            }
            this.model.on('changeFromTime', this.calculateOffsetTop.bind(this));
        },
        stopPropagation: function(e) {
            e.preventDefault(true);
            e.stopPropagation(true);
        },
        manipulateEement: function (callback) {
            if (!this.$elements && this.$el) {
                callback(this.$el);
            } else {
                _.each(this.$elements, callback);
            }
        },
        calculateOffsetTop: function(){
            var timeFrom = this.calendarData.get('currentDay').get('timeFrom');

            if (this.columnView.calendarView.fromTime) {
                timeFrom = this.columnView.calendarView.fromTime;
            }
            //console.log("CalendarView", timeFrom, this.model.get('fromTime'));

            this.topOffset = base.ColumnInfo.timeToPixels(this.model.get('fromTime') - timeFrom);
            ////console.log("OFFSET TOP", this.topOffset, this.model.get('fromTime'), timeFrom);
            if (this.columnView.calendarView.toTime - 380 > this.model.get('fromTime')
                || this.columnView.calendarView.toTime < 640) {
                this.popupOffsetTop = base.ColumnInfo.timeToPixels(this.model.get('fromTime') - timeFrom);
            } else {
                this.popupOffsetTop = base.ColumnInfo.timeToPixels(this.model.get('fromTime') - 330 - timeFrom);
            }
            if (this.columnView.calendarView.toTime - 250 > this.model.get('fromTime')
                || this.columnView.calendarView.toTime < 640) {
                this.popupInfoOffsetTop = base.ColumnInfo.timeToPixels(this.model.get('fromTime') - timeFrom);
            } else {
                this.popupInfoOffsetTop = base.ColumnInfo.timeToPixels(this.model.get('fromTime') - 250 - timeFrom);
            }

            this.manipulateEement(function($el) {
                $el.css('top', this.topOffset);
            }.bind(this));

            this.trigger('changeTopOffset', this);

            this.columnView.calculateNoteOffset(this);
        },
        showInfo: function(e, params) {
            console.log("PARAMS", params, e);
            if (e) {
                e.preventDefault(true);
                e.stopPropagation(true);
            }
            console.log("PARAMS", params, this);
            if (params) {
                params.column.showPopup = true;
                params.note.model.set('showInfo', true);
            } else {
                this.columnView.showPopup = true;
                this.model.set('showInfo', true);
            }
            return false;
        },
        closePopup: function(e, params) {
            e.preventDefault(true);

            params.column.showPopup = true;
            params.note.model.set('showInfo', false);
            params.note.model.set('edit', false);
            // Remove if new
            if(params.note.model.get('new')) {
                params.note.deleteNote(params.column, params.note);
            }
        },
        calculateTime: function(top, timeFrom) {
            var currentPosition = top - top % 12;
            var time = base.ColumnInfo.pixelsToTime(currentPosition) + timeFrom;
            this.model.set('fromTime', time);
        },
        approveNote: function(el, parameters) {
            el.preventDefault(true);
            el.stopPropagation(true);

            parameters.note.model.set('approved', true);
            if (parameters.note.model.save()) {
                parameters.note.model.set('edit', false);
            }
        },
        clickHandler: function(el, parameters){
            parameters.column.showPopup = false;
            _.each(parameters.column.notes, function(note){
                note.edit = false;
                note.info = false;
            })
        } ,
        editNote: function(el, parameters) {
            if (e) {
                el.preventDefault(true);
                el.stopPropagation(true);
            }

            parameters.column.showPopup = true;
            parameters.note.model.set('showInfo', false);
            parameters.note.model.set('edit', true);
        },
        removeNote: function(el, parameters){
            el.preventDefault(true);
            el.stopPropagation(true);

            parameters.note.deleteNote(parameters.column, parameters.note);
        },
        deleteNote: function(column, note) {
            column.showPopup = false;
            column.view.removeNoteView(note.model);
            column.view.removeNote(note.model);
            note.model.remove();
        },
        serviceName: function() {
            if (this.model.get('service')) {
                return this.model.get('service')['name'];
            } else {
                return null;
            }
        },
        getTopOffset: function(){
            return this.topOffset;
        },
        loadByName: function(e) {
            return loadCustomer;
        },
        loadBySurname: function (e) {
            return loadCustomer;
        },
        loadByPhone: function(e) {
            return loadCustomer;
        },
        noteView: function() {
            ////console.log('CALLL');
        },
        selectService: function(e, parameters) {
            e.preventDefault(true);

            var val = $(e.target).val();
            var name = '';
            _.each(parameters.column.view.model.get('durations'), function(duration) {
                if (duration.jobType == val){
                    name = duration.name;
                    return {};
                }
            });
            parameters.note.model.set('service', {id: val, name: name});
            //console.log("NOTE", parameters.note, val, e);
        }
    });

    function loadCustomer(event, ui) {
        $.ajax({
            url: '/api/customer/id',
            type: 'POST',
            data: {
                id: ui.item.id
            }
        }).success(function(data){
                if (data.phone.length > 0) {
                    this.model.set('firstName', data.name ? data.name : "");
                    this.model.set('lastName', data.lastName ? data.lastName : "");
                    this.model.set('phone', data.phone);
                }
            }.bind(this));
    };

    rivets.formatters.timeToPixel = function(value){
        if (typeof(value) == 'string') {
            value = parseInt(value);
        }
        return value/15*12;
    };

    rivets.binders['draggable-note'] = function(el, value) {
        if (!value.model.get('static')) {
            setTimeout(function(){
                $(el).draggable({
                    grid: [1, value.calendarData.get('cellHeight')],
                    snap: ".calendar-container",
                    appendTo: '.calendar-container',
                    containment: '.calendar-container',
                    scroll: true,
                    revert: "invalid",
                    cursor: "move",
    //                handle: '.note',
                    start: function(){
                        value.model.set('onEdit', true);
                    },
                    stop: function(event, ui) {
                        value.model.set('onEdit', false);
                        ////console.log('--------------------------------------------');

                        // Not better idea but, drag:stop calls after droppable:drop
                        if (value.model.onDragStop) {
                            value.model.onDragStop(value, value.model.onDragStopParameters);
                            value.model.onDragStop = null;
                        }
    //                    value.calculateOffsetTop();
                    }
                });
            }, 200);
        }
    };

    rivets.binders['resizable-note'] = function(el, value){
        if (!value.model.get('static')) {
            setTimeout(function(){
                $(el).resizable({
                    grid: value.calendarData.get('cellHeight'),
                    containment: "td.work-column",
                    handles: 's',
                    start: function() {
                        value.model.set('onEdit', true);
                    },
                    stop: function(el, ui) {
                        value.model.set('duration', base.ColumnInfo.pixelsToTime(ui.size.height - ui.size.height%value.calendarData.get('cellHeight')));
                        value.model.set('onEdit', false);
                        value.model.save();
                    }
                });
            }, 200);
        }
    };
}