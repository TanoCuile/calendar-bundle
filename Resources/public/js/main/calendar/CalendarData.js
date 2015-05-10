if (!window.MainElements) {
    window.MainElements = {};
}
if (!window.MainElements.initAppCallStack) {
    window.MainElements.initAppCallStack = [];
}
window.MainElements.initAppCallStack.push(function (app) {
    app.factory('ColumnManager', ['DateManager', function (dateManager) {
        var Column = function(columnInfo) {
            angular.extend(this, columnInfo);

            this.display = {

            };
            this.class = ['start0'];
            this.setWorkDay = function(currentDay, boundaryTop, boundaryBottom){
                if (currentDay) {
                    var top = currentDay.timeFrom < boundaryTop ? boundaryTop : currentDay.timeFrom;
                    var bottom = currentDay.timeTo > boundaryBottom ? boundaryBottom : currentDay.timeTo;

                    this.display.height = dateManager.timeToPixel(bottom - top);
                    this.display.top = dateManager.timeToPixel(boundaryTop > top ? 0 : top - boundaryTop);

                    switch(this.top % 60 ) {
                        case 0: this.class = ['start0'];break;
                        case 15: this.class = ['start15'];break;
                        case 30: this.class = ['start30'];break;
                        case 45: this.class = ['start45'];break;
                    }
                    this.viewParameters = {
                        top: top,
                        bottom: bottom
                    };

                } else {
                    this.display.height = 0;
                    this.display.top = 0;
                }
            };
            this.getTopBoundary = function() {
                return this.viewParameters.top;
            };
            this.getBottomBoundary = function() {
                return this.viewParameters.bottom;
            };
        };
        return {
            prepareColumn: function(columnInfo) {
                return new Column(columnInfo);
            },
            columnsReorder: function() {

            },
            toggleColumn: function(master) {

            }
        };
    }]);

    app.factory('ServicesHierarchyManager', [function () {
        return {
            toggleCategory: function() {

            }
        };
    }]);

    app.factory('CalendarData', [
        'ColumnManager',
        'ServicesHierarchyManager',
        function (columnFactory, serviceHierarchyFactory) {
            function validateData(data) {
                var message = null;
                if (!data.account) {
                    message = "Set main account data";
                }
                if (!data.columns) {
                    message = "Set columns for display";
                }
                if (!data.servicesHierarchy) {
                    message = "Set services hierarchy";
                }
                if (message){
                    throw {
                        message: message,
                        value: data
                    }
                }
            };


            function prepareCategories() {
                // Prepare category info
                angular.forEach(data.servicesHierarchy, function (item) {
                    item.active = true;
                    item.columns = {};
                    item.columnsOrder = [];
                    item.weekData = {};
                });
            }
            function linkData() {
                // Prepare column-dependent information
                angular.forEach(data.columns, function (column, cid) {
                    data.columns[cid] = new columnFactory.prepareColumn(column);
                    column = data.columns[cid];
                    console.log("C", column);

                    var categoryJobs = {};
                    angular.forEach(column.categories, function (catId) {
                        categoryJobs[catId] = {};
                        // Add column link to category
                        data.servicesHierarchy[catId].columns[column.id] = column;
                        column.weight = Object.keys(data.servicesHierarchy[catId].columns).length;
                        // Add types to column info
                        angular.forEach(column.types, function (type) {
                            // Column has types different categories
                            if (data.servicesHierarchy[catId].types[type]) {
                                angular.forEach(column.jobTypes, function (jobTypesId) {
                                    // Column has jobTypes different types
                                    if (data.servicesHierarchy[catId].types[type].jobTypes[jobTypesId]) {
                                        // Add for column link to jobType
                                        categoryJobs[catId][jobTypesId] = data.servicesHierarchy[catId].types[type].jobTypes[jobTypesId];
                                        // Add link to column
                                        if (!data.servicesHierarchy[catId].types[type].jobTypes[jobTypesId].columns) {
                                            data.servicesHierarchy[catId].types[type].jobTypes[jobTypesId].columns = {};
                                        }
                                        data.servicesHierarchy[catId].types[type].jobTypes[jobTypesId].columns[column.id] = column;
                                    }
                                });
                            }
                        });
                    });
                    column.jobs = categoryJobs;
                });
            }

            var data = {
                weekMode: false,
                view: {
                    dayStyle: {},
                    weekStyle: {},
                    dayTimeSections: {},
                    weekTimeSections: {}
                }
            };
            // Getting default data for calendar contains: columns, servicesHierarchy, schedules
            window.getCalendarData(data);
            validateData(data);
            prepareCategories();
            linkData();

            return data;
        }]);
});