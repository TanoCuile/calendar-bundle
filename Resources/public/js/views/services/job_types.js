function initializeJobTypesView(base) {
    base.JobTypesView = Backbone.View.extend({
        types: [],
        active: false,
        cat: null,
        rivets: null,
        activeJobTypes: {},
        currentJobType: null,
        initialize: function(options){
            this.$el.find('.job-type').click(function(e){
                e.preventDefault();

                var cb = '';
                if (!$(e.target).hasClass('active')) {
                    $(e.target).addClass('active');
                    cb = 'addCol';
                } else {
                    $(e.target).removeClass('active');
                    cb = 'removeCol';
                }
                base.categories.get($(e.target).attr('data-cat'))
                    .get('types').get($(e.target).attr('data-type')).get('service')
                    .get('prices').each(function(price){
                        if (price.get('jobType') == parseInt($(e.target).attr('data-id'))) {
                            price.get('customDuration').each(function(duration){
                                base.calendar.widget[cb](duration);
                                if (cb == 'removeCol') {
                                    base.categoriesView.disactivateMaster(duration.get('evenMaster').get('id'));
                                }
                            });
                        }
                    });
            }.bind(this));
            this.rivets = rivets.bind(this.el, this);
            this.$el.removeClass('hidden');
            this.$message = this.$el.find('.message');
        },
        selectJobType: function(e, view) {
            e.preventDefault(true);
            if (!$(e.target).hasClass('active')){
                //$(e.target).addClass('active');
                base.jobTypesView.currentJobType = $(e.target).attr('data-id');
                view.activeJobTypes[base.jobTypesView.currentJobType] = {
                    job: $(e.target).attr('data-id'),
                    type: $(e.target).attr('data-type')
                };
                _.each(view.types, function(type) {
                    if (type.type.id == $(e.target).attr('data-type')) {
                        _.each(type.jobTypes, function(job){
                            if (job.id == base.jobTypesView.currentJobType) {
                                job.active = true;
                            }
                        })
                    }
                });
                base.categoriesView.selectJobType(view.activeJobTypes);
                //showBSMessage('Выберите время');
                base.calendar.showMessage('Выберите время');
            } else {
                delete view.activeJobTypes[$(e.target).attr('data-id')];
                //$(e.target).removeClass('active');
                if(base.jobTypesView.currentJobType && base.jobTypesView.currentJobType == $(e.target).attr('data-id')) {
                    base.jobTypesView.currentJobType = null;
                    ////console.log('delete');
                }
                _.each(view.types, function(type) {
                    if (type.type.id == $(e.target).attr('data-type')) {
                        _.each(type.jobTypes, function(job){
                            if (job.id == $(e.target).attr('data-id')) {
                                job.active = false;
                            }
                        })
                    }
                });
                base.categoriesView.selectJobType(view.activeJobTypes);
            }
        },
        activate: function(masters, cat) {
            this.active = true;
            this.cat = cat;
            var count = _.toArray(masters).length;
            if (count > 0) {
                var i = 0;
                var baseTypes = {} ;
                _.each(masters, function(master){
                    if (master.active) {
                        if (i == 0) {
                            _.each(master.types, function(type, tid){
                                baseTypes[tid] = type;
                                // Check isactive type
                                _.each(baseTypes[tid].jobTypes, function(job, jid){
                                    if (this.activeJobTypes[job.id]) {
                                        job.active = true;
                                    } else {
                                        job.active = false;
                                    }
                                }.bind(this));
                            }.bind(this));
                        } else {
                            _.each(master.types, function(type, tid){
                                if (!baseTypes[tid]) {
                                    baseTypes[tid] = type;
                                } else {
                                    _.each(type.jobTypes, function(job, jid){
                                        if(!baseTypes[tid].jobTypes[jid]) {
                                            // Check and set jobTypes object
                                            if (baseTypes[tid].jobTypes) {
                                                baseTypes[tid].jobTypes = {};
                                            }
                                            // Add job type to base types
                                            baseTypes[tid].jobTypes[jid] = job;
                                            // Check isactive type
                                            if (this.activeJobTypes[job.id]) {
                                                baseTypes[tid].jobTypes[jid].active = true;
                                            } else {
                                                baseTypes[tid].jobTypes[jid].active = false;
                                            }
                                        }
                                    }.bind(this));
                                }
                            }.bind(this));
                        }
                        ++i;
                    }
                }.bind(this));
                _.each(this.types, function(type, id){
                    this.types.pop();
                }.bind(this));
                _.each(baseTypes, function(type){
                    type.jobTypes = _.toArray(type.jobTypes);
                    this.types.push(type);
                }.bind(this));
//                this.rivets.unbind();
//                this.rivets = rivets.bind(this.el, this);
            } else {
                _.each(this.types, function(type, id){
                    this.types.pop();
                }.bind(this));
            }
//            _.each(masters, function(master, id){
//                this.masters.push(master);
//            }.bind(this));
//            this.$el.find('.category-types.active').removeClass('active').addClass('hidden');
//            this.$el.find('.category-types.master-' + mit).removeClass('hidden').addClass('active');
        },
        clickParent: function(e, view) {
            e.target = $(e.target).parent()[0];
            view.selectJobType(e, view);
        }
    });
}