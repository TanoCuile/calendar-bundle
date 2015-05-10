function initializeOrderNote(base) {
    base.OrderNote = base.CalendarNote.extend({
        customDefaults: {
            'label': '',
            'date': null,
            'reserveStart': false,
            'reserveEnd': false,
            'editable': true,
            'service': null,
            'new': false,
            'owner': {},
            'phone': '',
            'checkType': true,
            'oneMaster': false,
            'edit': false,
            'showInfo': false,
            'errorTime': false,
            'description': '',
            'approved': false,
            'lNameError': false,
            'fNameError': false,
            serviceData: null,
            'serviceError': false,
            firstName: '',
            lastName: '',
            hoursError: false,
            minutesError: false,
            phoneError: false,
            propose: null
        },
        save_url: '/api/calendar/order/save',
        update_url: '/api/calendar/order/update',
        delete_url: '/api/calendar/order/delete',
        setHoursMinutes: function (val) {
            this.set('hours', Math.floor(this.get('fromTime') / 60));
            var min = this.get('fromTime') % 60;
            if (min < 10) {
                min = '00';
            }

            this.set('minutes', min);
            var toTime = this.get('fromTime') + this.get('duration');
            this.set('toHours', Math.floor(toTime / 60));
            var toMin = toTime % 60;
            if (min < 10) {
                min = '00';
            }
            this.set('toMinutes', min);
            this.changeFromTimeTrigger();
        },
        changeFromTimeTrigger: function() {
            this.trigger('changeFromTime', this);
        },
        changeToTime: function() {
            var duration = this.get('duration');
            if (duration) {
                this.set('toTime', this.get('fromTime') + duration);
            }
        },
        initialize: function (options) {
            this.set('serviceData', {});
            this.baseInitialize(options);
            this.set('date', new Date(options.date));

            var currentDate = new Date();
            if (this.get('date').getTime() > currentDate.getTime()) {
                this.set('past', false);
            } else {
                this.set('past', true);
            }

            if (!this.get('id')) {
                this.set('id', Math.random().toString(36).substring(10));
            }
            this.setHoursMinutes(this.get('fromTime'));
            this.on('change:fromTime', this.setHoursMinutes.bind(this));
            this.on('changeFromTime', this.changeToTime.bind(this));
            this.on('change:owner', function (val) {
                if (typeof this.get('owner') == 'undefined') {
                    console.error('No owner');
                }
//                this.checkJobType(function(job){
//                    this.set('toTime', parseInt(this.get('fromTime')) + parseInt(job.duration));
//                }.bind(this));
            });
            this.set('duration', parseInt(this.get('duration')));
            if (!this.get('duration')) {
                this.set('duration', this.get('toTime') - this.get('fromTime'));
            }
            this.on('change:hours', function() {
                this.calculateFromTime('fromTime', 'hours','minutes');
                this.changeFromTimeTrigger();
            });
            this.on('change:minutes', function() {
                this.calculateFromTime('fromTime', 'hours','minutes');
                this.changeFromTimeTrigger();
            });
            if (options.customer) {
                this.set('firstName', options.customer.firstName);
                this.set('lastName', options.customer.lastName);
            }
        },
        calculateFromTime: function (timeField, hoursField, minField) {
            var min = parseInt(this.get(minField));
            if (min && parseInt(this.get(hoursField))) {
                this.attributes[timeField] = parseInt(this.get(hoursField)) * 60 + min - min % 15;
            }
        },
        save: function (cb) {
            this.calculateFromTime('fromTime', 'hours','minutes');

            if (!this.noteDataValidate()) {
                return false;
            }

            if (this.get('checkType')) {
                this.checkJobType(function(job){
                    this.set('toTime', this.get('fromTime') + parseInt(job.duration));
                }.bind(this));
            }
            var data = this.toJSON();
            data.salon = base.salon;
            var url = this.update_url;
            if (this.get('new') || !this.get('id')) {
                url = this.save_url;
            }
            $.ajax({
                type: 'POST',
                data: {
                    order: data
                },
                url: url
            }).success(function (data) {
                    if (data.status == 1) {
                        //this.set('editable', false);
                        this.set('new', false);
                        this.set('id', data.id);
                    }
                    if (cb) {
                        cb(data, this);
                    }
                }.bind(this));
            return true;
        },
        remove: function() {
            if (this.get('id')) {
                $.ajax({
                    type: 'GET',
                    url: this.delete_url,
                    data: {
                        order: this.get('id')
                    }
                }).success(function(data) {
                    if (data.status) {
                    }
                })
            }
        },
        toJSON: function () {
            var attributes = {};
            var individualFields = ['owner','customer','date', 'propose', 'price', 'service', 'serviceData'];
            _.each(this.attributes, function (val, key) {
                if (individualFields.indexOf(key) < 0) {
                    attributes[key] = val;
                }
//                if (key != 'owner' && key != 'customer' && key != 'date' && key != 'propose' && key != 'price' && key != 'service' && key != 'serviceData') {
//                }
            });
            //console.log("Attr", attributes);

            if (this.attributes.service && this.attributes.service.id) {
                attributes.service = this.attributes.service.id;
            } else {
                attributes.service = this.attributes.service;
            }
            if (this.attributes.owner.master) {
                attributes.master = this.attributes.owner.master.id;
            } else {
                attributes.master = this.attributes.owner.id;
            }

            if (this.attributes.propose && this.attributes.propose.id) {
                attributes.propose = this.attributes.propose.id;
            }

            attributes.day = (this.attributes.date.getDate()) + '-' + (this.attributes.date.getMonth() + 1) + '-' + this.attributes.date.getFullYear();
            return attributes;
        },
        reserveEndToggle: function(e, parameters) {
            parameters.note.model.checkboxToggle(e, parameters, 'reserveEnd');
        },
        reserveStartToggle: function(e, parameters) {
            parameters.note.model.checkboxToggle(e, parameters, 'reserveStart');
        },
        approveToggle: function(e, parameters) {
            parameters.note.model.checkboxToggle(e, parameters, 'approved');
        },
        checkboxToggle: function(e, parameters, field) {
            e.preventDefault(true);
            e.stopPropagation();
            this.set(field, !this.get(field));
        },
        checkJobType: function (success, error) {
            if (this.get('checkType')) {
                _.each(this.get('owner').types, function (type) {
                    _.each(type.jobTypes, function (job) {
                        if (job.id == this.get('service').id && success) {
                            success(job);
                        } else if(error){
                            error();
                        }
                    }.bind(this))
                }.bind(this));
            } else {
                success(this.get('service'));
            }
        },
//        reserveStartChange: function(e, parameters) {
//            e.preventDefault();
//
//            ////console.log(parameters.note.model.get('reserveStart'));
//        },
        noteDataValidate: function() {
            var valid = true;

            var fieldsList = {
                'service': 'serviceError',
                'phone': 'phoneError',
                'hours': 'hoursError',
                'minutes': 'minutesError'
            };


            if (!this.get('name')) {
                fieldsList['firstName'] ='fNameError';
                fieldsList['lastName'] ='lNameError';
            }

            _.each(fieldsList, function(errorField, field) {
                valid = this.checkField(field, errorField) && valid;
            }.bind(this));
            //console.log("PRESAVE VALIEDATE", valid, this.attributes);
            return valid;
        },
        checkField: function(fieldName, errorField) {
            if (!this.get(fieldName)) {
                this.set(errorField, true);
                return false;
            }
            else this.set(errorField, false);

            return true;
        },
        validate: function (timeFrom, timeTo, notes) {
            var valid = true;
            var thisFrom = parseInt(this.get('fromTime'));
            if (this.get('reserveStart')) {
                thisFrom -= 15;
            }
            var thisTo = parseInt(this.get('toTime'));
            if (this.get('reserveEnd')) {
                thisFrom += 15;
            }
            return base.OrderNote.validate(timeFrom, timeTo, notes, thisFrom, thisTo, this.get('id'), this.get('date'), this.get('propose'));
        }
    }, {
        validate: function(timeFrom, timeTo, notes, currentTimeFrom, currentTimeTo, currentId, date, propose) {
            var valid = true;
            if (propose && propose.fromTime && propose.toTime) {
                if (timeFrom < propose.fromTime) {
                    timeFrom = propose.fromTime;
                }
                if (timeTo > propose.toTime){
                    timeTo = propose.toTime;
                }
            }

            if (currentTimeFrom < timeFrom) {
                return false;
            }
            if (currentTimeTo > timeTo) {
                return false;
            }
            _.each(notes, function (note) {
                //console.log("DATE COMP", note.get('date'), date);
                if ((valid && note.get('id') != currentId) && MainElements.compareDay(note.get('date'), date)
//                    && (oneMaster || masterId == note.get('owner').id)
                    ) {
                    var currentFrom = parseInt(note.get('fromTime'));
                    if (note.get('reserveStart')) {
                        currentFrom -= 15;
                    }
                    var currentTo = parseInt(note.get('toTime'));
                    if (note.get('reserveEnd')) {
                        currentTo += 15;
                    }
                    if ((currentTimeFrom > currentFrom && currentTimeFrom < currentTo) ||
                        (currentTimeTo > currentFrom && currentTimeTo < currentTo) ||
                        (currentTimeFrom == currentFrom && currentTimeTo == currentTo)) {
                        ////console.log('FALSE', currentTimeFrom, currentTimeTo, currentFrom, currentTo, note);
                        valid = false;
                    }
                    //console.log(valid, currentTimeFrom, note.get('fromTime'), note.get('toTime'), currentTimeTo, note.get('id'), currentId);
                }
            }.bind(this));
            //console.log('Is valid', valid, notes);
            return valid;
        }
    })
}