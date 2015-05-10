function initializeJobTypeSwitcher(base) {
    base.JobTypeSwitcherView = Backbone.View.extend({
        rivets: null,
        data: null,
        options: {
        },
        defaults: {
            types: [],
            active: false
        },
        initialize: function(options) {
            // Initialize options
            this.options = _.extend({}, this.defaults, options, {view: this});

            // Initialize listener for active category
            //options.data.on('change:activeCat', this.changeCategory.bind(this));
            options.data.on('change:activeMasters', this.changeMasters.bind(this));
            this.data = options.data;

            // Set default fields
            this.initializeJobTypes();

            // Initialize rivets
            this.rivets = rivets.bind(this.el, this.options);

            // Show widget
            this.$el.removeClass('hidden');
            this.options.active = true;
            this.changeMasters();
        },
        initializeJobTypes: function() {
            _.each(base.categories, function(category){
                _.each(category.types, function(type){
                    type.link = 'job-type-' + type.id;
                    type.href = '#job-type-' + type.id;
                })
            })
        },
        changeMasters: function() {
            _.each(this.data.get('activeMasters'), function(master){
                master.on('change:active', this.checkMasterTypes.bind(this));
            }.bind(this));
            this.checkMasterTypes();
        },
        // Check master types
        checkMasterTypes: function() {
            var activeJobs = {};
            _.each(this.options.types, function(){
                this.options.types.pop();
            }.bind(this));
            _.each(this.data.get('activeMasters'), function(master) {
                if (master.get('active')) {
                    _.each(master.get('types'), function(type) {
                        activeJobs[type] = true;
                    });
                }
            });
            activeJobs = _.keys(activeJobs);
            //////console.log(base.categories[this.data.get('activeCat')], this.data.get('activeCat'), activeJobs);
            if (base.categories[this.data.get('activeCat')]) {
                _.each(base.categories[this.data.get('activeCat')].types, function(type){
                    _.each(type.jobTypes, function(job){
                        if (activeJobs.indexOf(job.id.toString()) >= 0) {
                            type.active = true;
                            type.jobs = _.toArray(type.jobTypes);
                        }
                    }.bind(this));
                    this.options.types.push(type);
                }.bind(this));
            }
        },
        disactivateJobTypes: function () {
            _.each(base.categories, function (category) {
                _.each(category.types, function (type) {
                    _.each(type.jobTypes, function (job) {
                        job.active = false;
                    });
                });
            });
        },
        // On select type, hide left mastters
        selectJobType: function(e, parameters){
            e.preventDefault(true);
            var currentType = $(e.target).attr('data-type');
            var currentJobId = $(e.target).attr('data-id');
            var job = base.categories[parameters.view.data.get('activeCat')].types[currentType].jobTypes[currentJobId];
            if (!job.active) {
                parameters.view.data.set('activeJob', job);
                parameters.view.prepareJob(job);
                parameters.view.disactivateJobTypes();
                job.active = true;
                _.each(parameters.view.data.get('activeMasters'), function(master){
                    ////console.log(master.get('types'), job);
                    if (master.get('types').indexOf(job.id) < 0) {
                        master.set('active', false);
                    }
                });
            } else {
                job.active = false;
                _.each(parameters.view.data.get('activeMasters'), function(master){
                    master.set('active', true);
                });
                parameters.view.data.set('activeDurations', {});
                parameters.view.data.set('activeJob', {});
            }
            parameters.view.data.set('message', 'Выерите удобное время');
        },
        prepareJob: function(job) {
            var durations = {};
            if (job.price) {
                if (job.price.customDuration) {
                    _.each(job.price.customDuration, function(duration) {
                        durations[duration.evenMaster.id] = parseInt(duration.duration);
                    }.bind(this));
                } else {
                    // TODO: Make smth lise this for masters
                }
            }
            ////console.log(durations);
            this.data.set('activeDurations', durations);
        },
        clickParent: function(e, parameters){
            e.target = $(e.target).parent()[0];
            parameters.view.selectJobType(e, parameters);
        }
    });
}