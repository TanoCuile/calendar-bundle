function initializeWeekCalendarInfo(base) {
    /**
     * required
     * {
     *      categories
     * }
     * @type {*|void|Object}
     */
    base.WeekCalendarInfo = base.CalendarInfo.extend({
        customDefaults: {
            categories: null,
        },
        customInitialize: function(options) {
            this.set('categories', options.categories);
        },

        activateCategory: function(category) {
            category.active = !category.active;
            _.each(category.masters, function(master){
                master.set('active', category.active);
            })
        },
        disactivateCategory: function(cid) {
            _.each(this.get('categories'), function(category){
                if (category.id == cid) {
                    category.active = false;
                    _.each(category.masters, function(master){
                        master.set('active', false);
                    })
                }
            });
        },

        categoryDisableOther: function(cid){
            _.each(this.get('categories'), function(category){
                if (category.id != cid) {
                    category.active = false;
                    _.each(category.masters, function(master){
                        master.set('active', false);
                    })
                }
            });
        },

        activateAllCategories: function() {
            _.each(this.get('categories'), function(category){
                category.active = true;
                _.each(category.masters, function(master){
                    master.set('active', true);
                })
            });
        }
    })
}