function initializeWeekCalendar(base) {
    /**
     * Api for calendar
     * Set categories
     * categories: [
     *  {
     *      name: 'sdsds',
     *      id: 1,
     *      preview: 's1',
     *      masters: {
     *          id: {
     *              name: 'sds',
     *              id: '2'
     *          }
     *      }
     *  }
     * ]
     **/
    base.WeekCalendarView = base.BaseCalendarView.extend({
        defaultOptions: {

        },
        customInitialize: function(options){
            this.options = this.defaultOptions;
        },

        initializeColumns: function() {
            var info = this;
            var ids = [];
            var models = {};
            var views = {};
            _.each(this.options.data.get('categories'), function(category, cid){
                ////console.log("Category", category);
                if (category.masters){
                    _.each(category.masters, function(master, id){
                        if (ids.indexOf(master.id) < 0) {
                            ids.push(master.id);
                            var columnInfo = new base.ColumnInfo(_.extend(master, { category: cid }));
                            models[master.id] = columnInfo;
                            category.masters[id] = columnInfo;
                            category.masters[id].set('active', true);

                            var columnView = new base.ColumnView({
                                model: models[master.id],
                                baseInfo: info.options.data,
                                calendarView: info
                            });
                            views[master.id] = columnView;
                            info.options.columns.push(columnView.createInterface());
                        } else {
                            category.masters[id] = models[master.id];
                            info.options.columns.push(views[master.id].createInterface());
                        }

                        info.options.data.get('columns').push(category.masters[id]);
                    });
                    if (_.toArray(category.masters).length == 0) {
                        category.disabled = true;
                    } else {
                        category.disabled = false;
                    }
                }
            });
        },

        categoryDisableOther: function(e, parameters) {
            parameters.data.categoryDisableOther(parameters.category.id);
        },

        categoryToggle: function(e, parameters) {
            parameters.data.activateCategory(parameters.category);
        },

        activateAll: function(el, parameters) {
            parameters.data.activateAllCategories();
        }
    })
}