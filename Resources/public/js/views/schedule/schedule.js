function initializeScheduleView(base) {
    base.ScheduleView = Backbone.View.extend({
        template: '',
        options: {},
        defaults: {
            form: false,
            dayNames: {
                1: 'Пн',
                2: 'Вт',
                3: 'Ср',
                4: 'Чт',
                5: 'Пт',
                6: 'Сб',
                7: 'Вс'
            },
            defaultFrom: 8 * 60,
            defaultTo: 22 * 60,
            schedule: null,
            hideForm: true,
            showForm: false,
            ownerType: 1,
            ownerId: null
        },
        templateDayItem: '<div class="day act" rv-if="day:active">' +
            '{day:dayName}<span class="time">' +
            '<span class="from"><span rv-text="day:fromHour"></span>:<span rv-text="day:fromMin"></span></span> - ' +
            '<span class="to"><span rv-text="day:toHour"></span>:<span rv-text="day:toMin"></span></span>' +
            '</span>' +
            '</div>',
        templateInfo: '<div class="schedule">' +
            '<div rv-each-day="schedule.model:workDays">' +
            '<%= templateDayItem %>' +
            '</div>' +
            '</div>',
        templateWorkDayItem: '<div rv-each-day="schedule.model:workDays" class="clearfix work-day h-align" rv-class-act="day:active">' +
            '<div class="fl-l checkbox-widget middle" rv-class-checked="day:active" rv-on-click="schedule.checkDay"></div>' +
            '<div class="day-name fl-l middle" rv-text="day:dayName" rv-on-click="schedule.checkDay"></div>' +
            '<div class="time fl-l">' +
            '<input type="text" class="from small-area" maxlength="5" rv-value="day:formattedFromTime" rv-mask="day:fromTime" data-pattern="99:99"> -' +
            '<input type="text" class="to small-area" maxlength="5" rv-value="day:formattedToTime" rv-mask="day:toTime" data-pattern="99:99"></div>' +
            '</div>' +
            '</div>',
        templateWorkForm: '<div class="schedule-wrapper" rv-class-long="schedule.options.showForm">' +
            '<div class="form schedule">' +
            '<%= templateWorkDayItem %>' +
            '</div>' +
            '</div>',
        templateForm: '<%= templateWorkForm %>',
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options);
            if (options.model) {
                this.model = options.model;
            }
            if (!this.model) {
                this.model = new base.Schedule();
            }
            this.render();
            this.postInit();
        },
        postInit: function() {},
        render: function(){
            this.template = '<div class="schedule">';
            _.each(this.model.get('workDays'), function(day){
                if (day.get('active')) {
                this.template += '<div class="day ' + (day.get('active')?'act':'disact') + '">' + this.options.dayNames[day.get('dayId')]
                    + '<span class="time"><span class="from">' + day.get('fromHour') + ':' + day.get('fromMin') + '</span> - ' +
                    '<span class="to">' + day.get('toHour') + ':' + day.get('toMin') + '</span></span></div>';
                }
            }.bind(this));

            this.template += '</div>';
            return this.template;
        },
        checkDay: function(e, parameters){
            e.preventDefault(true);
            parameters.day.set('active', !parameters.day.get('active'));
        },
        renderForm: function() {
            if (this.rivets) {
                this.rivets.unbind();
                this.rivets = null;
            }
            _.each(this.model.get('workDays'), function(day){
                day.setName(this.options.dayNames[day.get('dayId')]);
            }.bind(this));
            // set basetemplates
            var templateForm = _.template(this.templateForm, this);
            ////console.log(templateForm);
            // set items
            templateForm = _.template(templateForm, this);
            return templateForm;
        },
        showSchedule: function(e, options){
            e.preventDefault(true);
            options.schedule.options.hideForm = false;
            options.schedule.options.showForm = true;
        },
        close: function(e, options){
            e.preventDefault(true);
            options.schedule.options.hideForm = true;
            options.schedule.options.showForm = false;
        },
        save: function(e, options){
            e.preventDefault(true);
            options.schedule.saveSchedule();
        },
        saveSchedule: function() {
            var schedule = this;
            $.ajax({
                url: this.model.save_url,
                type: 'POST',
                data: {
                    schedule: this.model.toJSON()
                }
            }).success(function(data){
                if (data.status == 1) {
                    schedule.options.hideForm = true;
                    schedule.options.showForm = false;
                }
            });
        }
    });

    rivets.formatters['minutes'] = function(value) {
        value = '' + value;
        return value.substr(2);
    };

    rivets.formatters['hours'] = function(value) {
        value = '' + value;
        return value.substr(0, 2);
    };
}