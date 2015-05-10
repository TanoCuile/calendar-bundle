function initializeSchedule(base) {
    base.Schedule = Backbone.Model.extend({
        defaults: {
            workDays: null,
            owner: null,
            ownerType: null,
            supplyTo: null,
            supplyFrom: null,
            nominalSchedule: null,
            isSetSupply: true
        },
        dayNames: {
            1: 'Пн',
            2: 'Вт',
            3: 'Ср',
            4: 'Чт',
            5: 'Пт',
            6: 'Сб',
            7: 'Вс'
        },
        save_url: '/api/calendar/schedule/save',
        save_master_url: '/api/calendar/schedule/master/save',
        initialize: function(options){
            if(!options) {
                options = {};
            }
            if (!options.workDays) {
                options.workDays = {};
            }

            if (options.nominalSchedule) {
                this.set('nominalSchedule', options.nominalSchedule);
            }

            var days = [];
            this.set('supplyTo', this.parseSupply(options.supplyTo));
            this.set('supplyFrom', this.parseSupply(options.supplyFrom));

            for (var i = 1; i < 8; ++i) {
                if (this.get('nominalSchedule') && !this.get('nominalSchedule').get('workDays')[i-1].get('active')) {
                    continue;
                }
                var dayOptions = {
                    dayName: this.dayNames[i],
                    dayId: i
                };
                if (options.workDays[i]) {
                    _.extend(dayOptions, options.workDays[i]);
                }

                days.push(new base.WorkDay(dayOptions));
            }
            this.set('workDays', days);
        },
        parseSupply: function(dateStr) {
            if (!dateStr) {
                return null;
            }
            dateStr = parseInt(dateStr);
            var date = new Date();

            if (dateStr) {
                date.setMonth(Math.floor(dateStr/100));
                date.setDate(dateStr % 100);
            }

            return date;
        },
        checkSupply: function(date) {
            // TODO: Check another years and monthes
            //////console.log("Supply", date.getTime() < this.get('supplyTo').getTime(), date.getTime() > this.get('supplyFrom').getTime());
            if ((this.get('supplyTo') && this.get('supplyFrom')) && (date.getTime() < this.get('supplyTo').getTime() &&
                date.getTime() > this.get('supplyFrom').getTime())) {
                return false;
            }
            return true;
        },
        calculateSupply: function(date){
            if (!date) {
                return null;
            }
            if (typeof(date) == 'object') {
                return date.getMonth() * 100 + date.getDate();
            } else {
                if(date.indexOf('/') > -1) {
                    date = date.split('/');
                    var month = date[0];
                    var day = date[1];
                } else {
                    date = date.split('.');
                    var month = date[1];
                    var day = parseInt(date[0]);
                }
                if (month[0] == '0') {
                    month = month[1];
                }
                month = parseInt(month) - 1;
                if (day[0] == 0) {
                    day = day[1];
                }
                //////console.log("Month", month, day, date);
                return month * 100 + day;
            }
        },
        getDay: function(day){
            var resDay = null;
            _.each(this.get('workDays'), function(wDay) {
                if (wDay.get('dayId') == day) {
                    resDay = wDay;
                    return {};
                }
            });
            return resDay;
        },
        save: function () {
            $.ajax({
                url: this.save_url,
                type: 'POST',
                data: {
                    schedule: this.toJSON()
                }
            }).success(function (data) {
                if (data.status == 1) {
                }
            });
        },
        toJSON: function() {
            var attrs = {
                'owner': this.get('owner'),
                'ownerType': this.get('ownerType')
            };

            attrs['supplyFrom'] = this.calculateSupply(this.get('supplyFrom'));
            attrs['supplyTo'] = this.calculateSupply(this.get('supplyTo'));

            var days = [];
            _.each(this.get('workDays'), function(day){
                var dayJson = day.toJSON();
                if (dayJson) {
                    days.push(dayJson);
                }
            });
            attrs.workDays = days;

            //////console.log("Schedule pre save", attrs);

            return attrs;
        },
        validate: function() {
            var valid = true;

            if (this.get('nominalSchedule')) {
                _.each(this.get('workDays'), function(day, id){
                    if (day.get('active') && !this.get('nominalSchedule').get('workDays')[id].get('active')) {
                        day.set('active', false);
                    } else if(day.get('active')) {
                        //console.log("Test", this.get('nominalSchedule').get('workDays')[id].get('fromTime'), day.get('fromTime'));
                        if (!day.validate(this.get('nominalSchedule').get('workDays')[id].get('fromTime'), this.get('nominalSchedule').get('workDays')[id].get('toTime'))) {
                            valid = false;
                        }
                    }
                }.bind(this));
            }

            return valid;
        }
    }, {
        checkDay: function(schedule,dayCollection) {

        },
        additionalCheck: function() {

        }
    });
    base.WorkDay = Backbone.Model.extend({
        defaults:{
            dayId: 1,
            active: false,
            fromTime: 8*60,
            toTime: 22*60,
            fromMin: 0,
            toMin: 0,
            fromHour: 0,
            toHour: 0,
            dayName: '',
            salon: null,
            salonName: null,
            current: false,
            weekend: false,
            formattedToTime: 0,
            formattedFromTime: 0,
            fromTimeError: false,
            toTimeError: false,
            fromTimeErrorText: '',
            toTimeErrorText: ''
        },
        salons: null,
        defaultWorkPlace: {id:0, name: 'На дому'},
        setToTime: function () {
//            this.attributes.toHour = this.getHours(this.get('toTime'));
//            this.attributes.toMin = this.getMinutes(this.get('toTime'));
            this.attributes.formattedToTime = (this.getHours(this.get('toTime')) * 100) + (parseInt(this.get('toTime')) % 60);
            if (this.attributes.formattedToTime < 1000) {
                this.attributes.formattedToTime = '0' + this.attributes.formattedToTime;
            }
        },
        setFromTime: function () {
//            this.attributes.fromHour = this.getHours(this.get('fromTime'));
//            this.attributes.fromMin = this.getMinutes(this.get('fromTime'));
            this.attributes.formattedFromTime = (this.getHours(this.get('fromTime')) * 100) + (parseInt(this.get('fromTime')) % 60);
            if (this.attributes.formattedFromTime < 1000) {
                this.attributes.formattedFromTime = '0' + this.attributes.formattedFromTime;
            }
        },
        parseFormatted: function(val) {
            if (typeof(val) == 'string' && val[0] == '0'){
                val = val.slice(1);
            }
            if (typeof(val) == 'string') {
                val = parseInt(val.replace(':', ''));
            }

            // Change it
            return Math.floor(val/100) * 60 + val % 100;
        },
        format: function(val) {
            if (typeof(val) == 'string') {
                val = parseInt(val);
            }
            var min = (val % 60);
            var hours = Math.floor(val / 60);
            return (hours>=10?hours:'0' + hours) + ':' + (min >= 10? min: '0' + min);
        },
        initialize: function(options){
            // TODO: Remove if error
//            this.salons = [];
//            if (!this.get('salon')) {
//                this.set('salon', _.clone(this.defaultWorkPlace));
//            } else if (base.evenSalons) {
//                this.set('salon', _.clone(base.evenSalons[options.salon]));
//            }
//            if (base.evenSalons) {
//                this.salons.push({
//                    id: 0,
//                    name: 'На дому'
//                });
//                _.each(base.evenSalons, function(salon) {
//                    var salonObj = _.clone(salon);
//                    if (salonObj.id == this.get('salon').id) {
//                        salonObj.selected = true;
//                        this.set('salonName', salonObj.name);
//                    }
//                    this.salons.push(salonObj);
//                }.bind(this));
//            }
            if (this.get('dayId') == 0 || this.get('dayId') == 6) {
                this.set('weekend', true);
            }
            if (options.id){
                this.set('active', true);
            }
            if (options.timeFrom) {
                this.set('fromTime', parseInt(options.timeFrom));
            }
            if (options.timeTo) {
                this.set('toTime', parseInt(options.timeTo));
            }
            this.setToTime();
            this.setFromTime();

            this.on('change:toTime', this.setToTime.bind(this));
            this.on('changeFromTime', this.setFromTime.bind(this));

            this.on('change:formattedToTime', function() {
                this.attributes.toTime = this.parseFormatted(this.get('formattedToTime'));
            }.bind(this));
            this.on('change:formattedFromTime', function() {
                this.attributes.fromTime = this.parseFormatted(this.get('formattedFromTime'));
            }.bind(this));
        },
        setName: function(name){
            this.set('dayName', name);
        },
        getHours: function(val){
            return Math.floor(parseInt(val) / 60);
        },
        getMinutes: function(val){
            var min = parseInt(val) % 60;
            if(min < 10){
                min = '00';
            }
            return min;
        },
        toJSON: function(){
            if (!this.get('active')) {
                return false;
            }
            var attrs = {
                'dayId': this.get('dayId'),
                'timeFrom': this.get('fromTime'),
                'timeTo': this.get('toTime')
            };
            if (this.get('salon')) {
                var salon = this.get('salon');
                if (_.has(salon, 'attributes')) {
                    attrs['salon'] = salon.toJSON();
                } else {
                    attrs['salon'] = salon;
                }
            }

            return attrs;
        },
        validate: function(minTime, maxTime) {
            var valid = true;
            if (this.get('fromTime') > this.get('toTime') && this.get('toTime') != 0) {
                valid = false;

                this.set('fromTimeError', 'Должно быть меньше времени окончания (' + this.format(this.get('toTime')) + ')');
                this.set('toTimeError', 'Должо быть больше времени начала (' + this.format(this.get('fromTime')) + ')');
                return valid;
            }

            if(minTime > this.get('fromTime')) {
                valid = false;
//                this.set('fromTimeError', true);
                this.set('fromTimeError', 'Должно быть не меньше начала вашей работы (' + this.format(minTime) + ')');
            } else {
                this.set('fromTimeError', false);
            }

            if (maxTime < this.get('toTime')) {
                valid = false;
//                this.set('toTimeError', true);
                this.set('toTimeError', 'Должно быть не больше окончания вашей работы (' + this.format(maxTime) + ')');
            } else {
                this.set('toTimeError', false);
            }

            return valid;
        }
    }, {
        
    });
    rivets.binders.day_salon = function(el, value){
        ////console.log(value, el);
    }
}
