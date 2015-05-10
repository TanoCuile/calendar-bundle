function initializeRivetsCalendar(base) {
    rivets.formatters.propertyList = function(obj) {
        return (function() {
            var properties = [];
            for (key in obj) {
                properties.push({key: key, value: obj[key]});
            }
            return properties
        })();
    }
//    rivets.binders.calendar_view = {
//        view: {},
//        bind: function(el, value) {
//        },
//        unbind: function(el) {
//            ////console.log('unbind', el);
//            this.view[$(el).attr('id')].remove();
//        },
//        routine: function(el, value) {
//            if (!this.view[value.get('id')]) {
//                this.view[value.get('id')] = new base.CalendarView({
//                        el: el,
//                        model: value
//                    });
//                $(el).attr('id', value.get('id'));
//            }
//        }
//    };

}