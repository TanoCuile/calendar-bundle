function initializeJobTypeWidget(base) {
    base.JobTypeWidgetView = Backbone.View.extend({
        rivets: null,
        options: {},
        defaults: {

        },
        initialize: function(options) {
            this.options = _.extend({}, this.defaults, options);
            this.rivets = rivets.bind(this.el, {view:this, hierarchy: base.categories});
            //this.options.data.set('activeJob', this.type.jobTypes[this.price.jobType]);
            //_.each(this.options.data.get('activeMasters'), function(){this.options.get('activeMasters').pop();}.bind(this));
            //this.options.data.set('activeDurations', durations);
        },
        selectJobType: function(e, parameters) {
            e.preventDefault(true);
            var target = $(e.target);
            if (!target.hasClass('active')) {
                parameters.view.$el.find('.job-type.active').removeClass('active');
                var cat = target.attr('data-cat');
                var type = target.attr('data-type');
                var job = target.attr('data-id');
                target.addClass('active');
                parameters.view.options.data.set('activeJob', base.categories[cat].types[type].jobTypes[job].id);
                var durations = {};
                durations[base.master.get('id')] = base.categories[cat].types[type].jobTypes[job].price.duration;
                parameters.view.options.data.set('activeDurations', durations);
            } else {
                target.removeClass('active');
                if (parameters.view.options.data.get('activeJob').id == job) {
                    parameters.view.options.data.set('activeJob', null);
                }
            }
            //////console.log(parameters, $(e.target).attr('data-id'));
        },
        // fire parent click event
        clickParent: function(e, parameters){
            $(e.target).parent().click();
        }
    });
}