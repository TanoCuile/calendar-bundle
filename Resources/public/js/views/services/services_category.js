function initializeServiceCategoryView(base){
    base.ServiceCategoriesView = Backbone.View.extend({
        activeCat: null,
        activeWorkers: [],
        categories: null,
        activeWorkersInit: function () {
            this.activeWorkers = _.toArray(this.categories.get(this.activeCat).get('workers'));
        },
        initialize: function(options){
            this.categories = options.categories;
            this.activeCat = this.$el.find('li.act a').attr('data-cat');
            this.activeWorkersInit();
            this.$el.find('a.service').click(function(e){
                e.preventDefault();
                this.$el.find('.menu ul li.act').removeClass('act');
                $(e.target).parent().addClass('act');
                var cat = $(e.target).attr('data-cat');
                this.activateCat(cat);
                //this.activateCat(cat);
            }.bind(this));

            //this.$el.find('.item a').click(.bind(this));
            this.activateCat(this.activeCat);
            rivets.bind(this.el, this);
//            this.$el.find('.submenu .item').each(function(i, el){
//                el = $(el);
//                rivets.bind(el[0], {
//                    master: options.categories.get(el.parents('.submenu').attr('data-cat')).get('workers')[el.attr('data-master')]
//                });
//            }.bind(this));
            this.$el.find('.submenu.hidden').removeClass('hidden');
        },
        getActiveCategory: function () {
            return this.categories.get(this.activeCat);
        },
        masterClick: function(e, view){
            e.preventDefault();
            var baseMasters = this.getActiveCategory(view).get('workers');
            if ($(e.target).hasClass('active')) {
                $(e.target).removeClass('active');
                baseMasters[$(e.target).attr('data-master')].active = false;
                var show = false;
                base.calendars.widget.checkMasters();
            } else {
                $(e.target).addClass('active');
                baseMasters[$(e.target).attr('data-master')].active = true;
                baseMasters[$(e.target).attr('data-master')].disable = false;
                base.calendar.widget.hideShadow(baseMasters);
            }

            base.jobTypesView.activate(baseMasters, view.activeCat);
        },
        clickParent: function(e, view){
            e.target = $(e.target).parent()[0];
            view.masterClick(e, view);
        },
        activateMaster: function(mit) {
            this.$el.find('.master-' + mit).addClass('active');
        },
        disactivateMaster: function(mit){
            this.$el.find('.master-' + mit).removeClass('active');
        },
        activateCat: function(cat){
            this.activeCat = cat;
            _.each(this.activeWorkers, function(type, id){
                this.activeWorkers.pop();
            }.bind(this));
            _.each(this.categories.get(this.activeCat).get('workers'), function(master){
                //type.jobTypes = _.toArray(type.jobTypes);
                this.activeWorkers[this.activeWorkers.length] = master;
            }.bind(this));
            this.$el.find('.submenu.active').removeClass('active').addClass('hidden');
            this.$el.find('.submenu.cat-' + cat).removeClass('hidden').addClass('active');
            this.$el.find('.submenu.cat-' + cat + ' .item a').addClass('active');
            _.each(this.categories.get(cat).get('workers'), function(master){
                master.active = true;
            });
            base.calendar.widget.setMasters(this.categories.get(cat).get('workers'));
            base.jobTypesView.activate(this.categories.get(cat).get('workers'), cat);
            if (base.categoriesView) {
                base.calendar.loadNotes();
            }
            this.activeWorkersInit();
        },
        activateJobType: function(jobType) {
            _.each(this.categories.get(this.activeCat).get('workers'), function(master){

            });
        },
        disactivateCat: function() {
            this.activeCat = null;
            this.$el.find('.submenu.active').removeClass('active').addClass('hidden');
        },
        selectJobType: function(jobs) {
            if (_.toArray(jobs).length == 0) {
                this.selectAll();
            } else {
                _.each(this.categories.get(this.activeCat).get('workers'), function(worker){
                    var active = false;
                    _.each(jobs, function(jobInfo){
                        var job = jobInfo.job;
                        var type = jobInfo.type;
                        if (worker.types[type]) {
                            _.each(worker.types[type].jobTypes, function(jobData){
                                if (jobData.id == job){
                                    active = true;
                                }
                            })
                        }
                    }.bind(this));
                    worker.active = active;
                });
            }
        },
        selectAll: function() {
            _.each(this.categories.get(this.activeCat).get('workers'), function(worker){
                worker.active = true;
            });
        }
    });

}