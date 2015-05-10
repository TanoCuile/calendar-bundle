function initializeCategoriesSwitcher(base){
    base.CategoriesSwitcherVeiew = Backbone.View.extend({
        rivets: null,
        $scrollPane: null,
        events: {
            'click .service-categories .service': 'categoryClickHandler'
        },
        options: {
        },
        defaults: {
            activeMasters: [],
            activeCat: 0,
        },
        initialize: function(options) {
            this.options = new base.CalendarInfo(_.extend({}, this.defaults, options));
            // check active category
            this.checkActiveCategory();

            this.rivets = rivets.bind(this.el, {data: this.options, view: this});

            // Show masters submenu if all ok
            if (this.options.get('activeCat')) {
                this.$el.find('.submenu').removeClass('hidden');
            }
            var scrollPane = this.$el.find('.masters .item-list').jScrollPane({});
            this.$scrollPane = scrollPane.data('jsp');

            // Initialize calendar widget, cause we want to have one data system initialized on categories system
            base.calendar = new base.CalendarWidgetView({
                el: $('.calendar_wrapper')[0],
                data: this.options
            });

            // Initialize job types switcher
            base.jobWidget = new base.JobTypeSwitcherView({
                el: $('.left-sidebar .job-types')[0],
                data: this.options
            });
        },
        categoryClickHandler: function(e){
            e.preventDefault(true);
            if ($(e.target).attr('data-cat') != this.options.get('activeCat')) {
                this.changeCategory($(e.target).attr('data-cat'));
            }
        },
        changeCategory: function(category) {
            category = parseInt(category);
            if (category) {
                this.options.set('activeCat', category);

                // Disactivate old masters
                _.each(this.options.get('activeMasters'), function(master){
                    master.set('active', false);
                }.bind(this));
                // Drop old masters, for correct rivets support
                _.each(this.options.get('activeMasters'), function(){
                    this.options.get('activeMasters').pop();
                }.bind(this));

                // Add masters of active category
                _.each(base.categories[category].subElements, function(master){
                    master.active = true;
                    master.inWork = true;
                    master.notes = [];
                    master.noteViews = [];
                    this.options.get('activeMasters').push(new Backbone.Model(master));
                }.bind(this));
                this.$el.find('.service-categories li').removeClass('act');
                this.$el.find('.service-categories li.category-' + category).addClass('act');
                this.$el.find('.submenu.active').removeClass('active').addClass('hidden');
                this.$el.find('.submenu.cat-' + category).removeClass('hidden').addClass('active');
                this.$el.find('.submenu.cat-' + category + ' .item a').addClass('active');
                this.$el.find('.submenu .item-container').css('width', this.options.get('activeMasters').length * 180);
                if (this.$scrollPane) {
                    this.$scrollPane.reinitialise();
                }
                this.options.trigger('change:activeMasters');
            }
        },
        checkActiveCategory: function () {
            var activeCat = this.$el.find('.service-categories li.act');
            if (!activeCat) {
                activeCat = this.$el.find('.service-categories li:first');
                if (activeCat) {
                    activeCat.addClass('act');
                }
            }
            if (!activeCat) {
                MainElements.messageManager.showMessage('У вас нет активных услуг. ' +
                    'Настройте предлагаемые услыги в разделе <a href="/salon/services">"Услуги"</a>', 9000);
            } else {
                this.changeCategory(activeCat.find('a').attr('data-cat'));
            }
        },
        // On click master picture
        masterClickHandler: function(e, parameters) {
            e.preventDefault(true);
            _.each(parameters.view.options.get('activeMasters'), function(master){
                if (master.id == parseInt($(e.target).attr('data-master'))) {
                    if (master.get('active')) {
                        master.set('active', false);
                    } else {
                        master.set('active', true);
                    }
                }
            });
        },
        // fire parent click event
        clickParent: function(e, parameters){
            e.target = $(e.target).parent()[0];
            parameters.view.masterClickHandler(e, parameters);
        }
    })
}