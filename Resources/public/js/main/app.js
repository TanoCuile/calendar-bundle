;
(function (angular) {
    if (!window.MainElements) {
        window.MainElements = {};
    }
    if (!window.MainElements.initAppCallStack) {
        window.MainElements.initAppCallStack = [];
    }
    var app = angular.module('app', ['ngTouch', 'ngDraggable', 'ngRoute', 'hmTouchEvents']);

    app.config(['$interpolateProvider', function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    }]);

    app.config(['$routeProvider', function ($http) {
        var dayCalendarRouteSettings = {
            controller: 'CalendarDayController',
            templateUrl: '/bundles/calendar/html/salon-day-calendar.html.tpl'
        };
        var weekCalendarRouteSettings = {
            controller: 'CalendarWeekController',
            templateUrl: '/bundles/calendar/html/salon-week-calendar.html.tpl'
        };
        $http
            .when('/week/:date/:note', weekCalendarRouteSettings)
            .when('/:date/:note', dayCalendarRouteSettings)
            .otherwise(dayCalendarRouteSettings);
    }]);


    angular.forEach(MainElements.initAppCallStack, function(callback){
        callback(app);
    });

    app.controller('CalendarSwitcherController', ['$scope', 'CalendarManager', function ($scope, calendarData) {
        $scope.calendar = calendarData;
    }]);

    app.controller('DataSwitchController', ['$scope', 'CalendarManager', function ($scope, calendarData) {
        $scope.calendar = calendarData;
        $scope.changeDate = function(date) {
            console.log("DATE", date);
        }
    }]);

    app.controller('NoteRemoveController', ['$scope', 'CalendarManager', function ($scope, calendarData) {
        $scope.calendar = calendarData;
    }]);

    app.controller('ColumnSwitcher', ['$scope', 'CalendarManager', function ($scope, calendarData) {
        $scope.calendar = calendarData;

        $scope.toggleCategory = function (category) {
            category.active = !category.active;
        }
    }]);
    app.controller('CalendarDayController', ['$scope', 'CalendarManager', function ($scope, calendarData) {
        calendarData.weekMode = false;
        $scope.calendar = calendarData;
    }]);
    app.controller('CalendarWeekController', ['$scope', 'CalendarManager', function ($scope, calendarData) {
        calendarData.weekMode = true;
        $scope.calendar = calendarData;
    }]);
    app.directive('scrolled', [function(){
        return {
            restrict: 'A',
            link: function($scope, el, attrs) {
                var axis = 'x';
                if ($(el).attr('axis')) {
                    axis = $(el).attr('axis');
                }
                var width = $(el).attr('data-scroll-width');
                var currentWidth = null;
                if (!width) {
                    width = false;
                } else {
                    if (width.localeCompare('floatFullWidth') == 0) {
                        currentWidth = $(el).width();
                        width = false;
                    }
                }

                var scroll = $(el).mCustomScrollbar({
                    axis: axis,
                    alwaysShowScrollbar: 1,
                    autoExpandScrollbar: true,
                    autoDraggerLength: true,
                    setWidth: width,
                    scrollButtons: {
                        enable: true
                    },
                    horizontalScroll: true,
                    advanced: {
                        updateOnContentResize: true,
                        autoExpandHorizontalScroll: true,
                        autoScrollOnFocus: false,
                        updateOnSelectorChange: false
                    },
                    callbacks: {
                        onInit: function () {
                            if (value) {
                                value.scrollPane = $(this);
                            }
                            if (currentWidth) {
                                el.firstElementChild.firstElementChild.firstElementChild.style['min-width'] = currentWidth + 'px';
                                $(el).mCustomScrollbar("update");
                            }
                        }
                    }
                });
                if (value && !value.scrollPane) {
                    value.scrollPane = scroll;
                }
            }
        }
    }]);
    app.directive('datepicker', [function() {
        return {
            restrict: 'A',
            template: '<input type="text">',
            scope: {
                changeDate: '&'
            },
            link: function($scope, el, attrs){
                console.log("TEST", el, attrs, $scope);
            }
        }
    }]);
    app.directive('categoryPreview', ['CalendarData', function (calendarData) {
        return {
            restrict: 'E',
            template: '<div class="preview"></div>',
            replace: true,
            link: function ($scope, el, attrs) {
                el.addClass('s' + $scope.category.id);
                $scope.$watch('category.active', function (value) {
                    if (value) {
                        el.addClass('active');
                    } else {
                        el.removeClass('active');
                    }
                });
            }
        }
    }]);
})(angular);