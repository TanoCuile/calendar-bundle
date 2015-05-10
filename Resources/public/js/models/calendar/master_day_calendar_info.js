function initializeMasterDayCalendarInfo(base) {
    /**
     * required
     * {
     *      categories
     * }
     * @type {*|void|Object}
     */
    base.DayCalendarInfo = base.CalendarInfo.extend({
        customDefaults: {
            categories: null,
            weekColumns: null
        },
        customInitialize: function(options) {
            this.set('weekColumns', []);
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
            _.each(this.get('categories'), function(category){
                if (category.id == cid) {
                    _.each(category.masters, function(master){
                        master.set('active', true);
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
        },
        getColumn: function(columnId, cid, dayId) {
            var currentColumn = null;
            _.each(this.get('columns'), function(targetColumn) {
                if (targetColumn.get('id') == columnId && targetColumn.get('dayId') == dayId) {
                    if (targetColumn.get('active')) {
                        currentColumn = targetColumn;
                    }
                    return {};
                }
            });
            return currentColumn;
        }
    })
}