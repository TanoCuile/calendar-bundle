function initializeNote(base){
    base.NoteView = Backbone.View.extend({
        popupHeight: 220,
        noteContainer: '',
        noteStyle: '',
        popupStyle: '',
        contentStyle: '',
        showInfo: false,
        generateContentStyle: function (offset, height) {
            var def = '';
            if (this.model.get('reserveStart')) {
                offset -= 12;
                height += 12;
                def += 'padding-top:12px';
            }
            if (this.model.get('reserveEnd')) {
                height += 12;
            }
            this.contentStyle = 'top:' + offset + 'px;height:' + height + 'px;' + def;
            return {offset: offset, height: height};
        },
        generatePopupStyle: function (offset, height) {
            if (offset < this.popupHeight) {
                this.popupStyle = 'top:' + height + 'px;';
            } else {
                this.popupStyle = 'top:-' + this.popupHeight + 'px;';
            }
        },
        getDefaultParameters: function () {
            var offset = ((this.model.get('fromTime') - this.fromTime) / 15 * 12);
            var height = ((this.model.get('toTime') - this.model.get('fromTime')) / 15 * 12);
            return {offset: offset, height: height};
        },
        initialize: function(options) {
            if (options.popupHeight) {
                this.popupHeight = options.popupHeight;
            }
            this.model = options.model;
            this.fromTime = options.fromTime;
            this.toTime = options.toTime;
            this.calendar = options.calendar;
            this.noteContainer = '<div class="' + (this.model.get('editable') ? 'editable' : 'static') + '"></div>';

            var __ret = this.getDefaultParameters();
            var offset = __ret.offset;
            var height = __ret.height;
            if (height > 45) {
                this.showInfo = true;
            }
            this.noteStyle = 'height:' + height + 'px;';

            this.generatePopupStyle(offset, height);
            this.generateContentStyle(offset, height);

            this.model.on('change:reserveStart', function () {
                var __ret = this.getDefaultParameters();
                var offset = __ret.offset;
                var height = __ret.height;
                this.generateContentStyle(offset, height);
            }.bind(this));

            this.model.on('change:reserveEnd', function () {
                var __ret = this.getDefaultParameters();
                var offset = __ret.offset;
                var height = __ret.height;
                this.generateContentStyle(offset, height);
            }.bind(this));

            this.model.on('change:phone', function() {
                ////console.log(this.get('phone'));
            });
        },
        getForm: function() {
            return '';
        },
        click: function(e, parameters){ // doubleclick
            e.preventDefault(true);
            e.stopPropagation();
            if (!parameters.note.model.get('edit')) {
                parameters.data.set('onEdit', true);
                parameters.note.model.set('edit', true);
            }
        },
        getDraggableOptions: function(){
            var noteView = this;
            return {
                grid: [this.calendar.options.colWidth, this.calendar.options.cellHeight],
                snap: ".work-field .master",
                appendTo: '.calendar-field-wrapper',
                containment: '.calendar-field-wrapper',
                scroll: true,
                revert: "invalid",
                cursor: "move",
                handle: '.note-content',
                stop: function(event, ui) {
                    if (!noteView.model.get('isNew')) {
                        noteView.model.save();
                    }
                }
            }
        },
        closeSettingsPopup: function(e, parameters) {
            e.preventDefault(true);
            if (parameters.note.model) {
                if (parameters.note.model.attributes.edit
                    && !parameters.note.model.get('new')
                    ) {
                    parameters.data.set('onEdit', false);
                    parameters.note.model.attributes.edit = false;
                } else if (parameters.note.model.get('new')) {
                    parameters.note.deleteNote(e, parameters);
                }
            } else {
                ////console.log('Invalid parameters', parameters);
            }
        },
        saveNote: function(e, parameters) {
            e.preventDefault(true);
            var owner = parameters.note.model.get('owner');
            if (!_.has(owner, 'attributes')) {
                owner = parameters.data.getMaster(owner.id);
            }
            var time = parameters.view.getValidateData(parameters.view.options, owner);
            var valid = parameters.note.model.validate(time.fromTime, time.toTime, owner.get('notes'));
            if (valid) {
                parameters.note.model.save(function(data){
                    parameters.note.model.set('new', false);
                    parameters.note.model.set('edit', false);
                    ////console.log(parameters);
                    if (parameters.noteSaveCallback) {
                        parameters.noteSaveCallback(data,parameters.note);
                    }
                });
            } else {
                parameters.note.model.set('errorTime', true);
            }
            parameters.data.set('onEdit', false);
        },
        deleteNote: function(e, parameters) {
            e.preventDefault(true);
            _.each(parameters.data.getMaster(parameters.note.model.get('owner').id).get('noteViews'), function(view, id){
                if (view && view.model.id == parameters.note.model.get('id')) {
                    parameters.data.getMaster(parameters.note.model.get('owner').id).get('noteViews').splice(id,1);
                }
            });
            _.each(parameters.data.getMaster(parameters.note.model.get('owner').id).get('notes'), function(note, id){
                if (note && note.get('id') == parameters.note.model.get('id')) {
                    if (!note.get('new')) {
                        $.ajax({
                            type: 'POST',
                            url: note.delete_url,
                            data: {
                                'order': note.get('id')
                            }
                        }).success(function(data){
                            ////console.log('data');
                        });
                    }
                    parameters.data.getMaster(parameters.note.model.get('owner').id).get('notes').splice(id,1);
                }
            });
            parameters.note.model.set('edit', false);
            parameters.data.set('onEdit', false);
        },
        tooltipOptions: function(note) {
            var content = '';
            if (note.model.get('name')) {
                content += '[Кнтактное лицо: ' + note.model.get('name') + ']';
            }
            if (note.model.get('phone')) {
                content += '[Телефон:  +7' + note.model.get('phone') + ']';
            }
            return content;
        }
    });
    rivets.binders.draggable = function (el, note) {
        if (!$(el).hasClass('approved') && note.model.get('editable')) {
            $(el).draggable(note.getDraggableOptions());
        }
    };
    rivets.binders.droppable = function (el, calendar) {
        $(el).droppable(calendar.getDroppableOptions());
    };
    rivets.binders.tooltip = function (el, note) {
        if (note.model.get('duration') <= 45) {
            var text = note.tooltipOptions(note);
            $(el).attr('title', text);
            $(el).tooltip({content: function(){return $(this).prop('title')}});
        }
    };
}