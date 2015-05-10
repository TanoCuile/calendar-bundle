function initializeMasterSchedule(base) {
    base.MasterScheduleView = base.ScheduleView.extend({
        salons: [],
        templateWorkDayItem:
            '<div rv-each-day="schedule.model:workDays" class="clearfix work-day h-align" rv-class-act="day:active">' +
                '<div class="fl-l checkbox-widget middle" rv-class-checked="day:active"></div>' +
                '<div class="day-name fl-l middle" rv-text="day:dayName" rv-on-click="schedule.checkDay"></div>' +
                '<div class="time fl-l">' +
                '<input type="text" readonly disabled class="from small-area" maxlength="5" rv-value="day:formattedFromTime" rv-mask="day:fromTime" readonly disabled data-pattern="99:99"> -' +
                '<input type="text" readonly disabled class="to small-area" maxlength="5" rv-value="day:formattedToTime" rv-mask="day:toTime" readonly disabled data-pattern="99:99"></div>' +
                '</div>' +
                '</div>',
//            '<div rv-each-day="schedule.model:workDays" class="day clearfix" rv-class-act="day:active">' +
//            '<label class="clearfix fl-l">' +
//            '<input type="checkbox" class="checkbox fl-l" rv-checked="day:active" rv-value="day:active" />' +
//            '<div class="fl-l">{day:dayName}</div></label>' +
//            '<div class="time">'+
//            '<input type="text" class="from small-area" maxlength="5" rv-value="day:formattedFromTime" rv-mask="day:fromTime" data-pattern="99:99"> -' +
//            '<input type="text" class="to small-area" maxlength="5" rv-value="day:formattedToTime" rv-mask="day:toTime" data-pattern="99:99"></div>' +
//            '<select rv-on-change="schedule.setSalon">' +
//            '<option rv-each-salon="day.salons" rv-selected="salon.selected" rv-text="salon.name" rv-value="salon.id"></option>' +
//            '</select>' +
//            '</div>' +
//            '</div>',
        templateDayItem:
            '<div class="day act" rv-if="day:active">' +
                '{day:dayName}<span class="time">' +
                '<span class="from"><span rv-text="day:fromHour"></span>:<span rv-text="day:fromMin"></span></span> - ' +
                '<span class="to"><span rv-text="day:toHour"></span>:<span rv-text="day:toMin"></span></span>' +
                '</span>' +
                '</div>',
//            '<div class="day act" rv-if="day:active">' +
//            '{day:dayName}<div class="time fl-l">' +
//            '<span class="from"><span rv-text="day:fromHour"></span>:<span rv-text="day:fromMin"></span></span> - ' +
//            '<span class="to"><span rv-text="day:toHour"></span>:<span rv-text="day:toMin"></span></span>' +
//            '<span class="salon" rv-text="day:salon.name"></span>' +
//            '</div>' +
//            '</div>',

        postInit: function() {
        },
        // Set salon to workday
        setSalon: function(e, parameters) {
            e.preventDefault(true);

            var val = $(e.target).val();
            parameters.day.get('salon').id = base.evenSalons[val].id;
            parameters.day.get('salon').name = base.evenSalons[val].name;
            ////console.log(parameters.day);
        },
        save: function(e, options){
            e.preventDefault(true);
            $.ajax({
                url: options.schedule.model.save_master_url,
                type: 'POST',
                data: {
                    schedule: options.schedule.model.toJSON()
                }
            }).success(function(data){
                if (data.status == 1) {
                    options.schedule.options.hideForm = true;
                    options.schedule.options.showForm = false;
                }
            });
        }
    });
}