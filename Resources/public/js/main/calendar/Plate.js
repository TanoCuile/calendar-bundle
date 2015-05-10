if (!window.MainElements) {
    window.MainElements = {};
}
if (!window.MainElements.initAppCallStack) {
    window.MainElements.initAppCallStack = [];
}
MainElements.initAppCallStack.push(function (app) {
    app.factory('PlateFactory', ['ScheduledDataFactory', 'DateManager',
        function (scheduled, dateManager) {
            var Plate = function (blank, category) {
                this.blank = blank;
                this.category = category;
                this.runnerData = {
                    show: false,
                    onRunner: false,
                    display: {
                        top: 0
                    }
                };
                this.createNote = function (startTime, duration) {
                    this.blank.createNote(
                        dateManager.pixelToTime(PlateFactory.preparePosition(startTime)) + this.blank.getPlanStart(),
                        duration?duration:PlateFactory.defaultDuration
                    );
                }
            };
            var PlateFactory = {
                defaultDuration: 60,
                generatePlate: function (blank, category) {
                    return new Plate(blank, category);
                },
                preparePosition: function (value) {
                    return value - value % dateManager.timeSectionHeight;
                }
            };

            return PlateFactory;
        }]);
    app.directive('calendarPlate', ['PlateFactory', 'DateManager', function (plateFactory, dateManager) {
        return {
            restrict: "E",
            templateUrl: '/bundles/calendar/html/plate.html.tpl',
            replace: true,
            scope: {
                plate: '='
            },
            link: function ($scope, el, attrs) {
                function getMouseOffset($event) {
                    if (typeof($event) == 'object') {
                        return $event.pageY - el.offset().top;
                    } else {
                        return event - el.offset().top;
                    }
                }
                $scope.onDrop = function (data, event) {
                    console.log("Test", plateFactory.preparePosition(getMouseOffset(event.event)));
                    data.setFromTime(plateFactory.preparePosition(dateManager.pixelToTime(getMouseOffset(event.event))) + $scope.plate.blank.getPlanStart());
                };
                $scope.onDrag = function (data, event) {
                    console.log("Drag success", data, event);
                };
                $scope.setRunner = function () {
                    $scope.plate.runnerData.fixed = true;
                };
                $scope.addNote = function ($event) {
                    console.log("sdsdsd", $event);
                    $scope.plate.createNote(getMouseOffset($event));
                };
                $scope.activatePlate = function () {
                    if (!$scope.plate.runnerData.onRunner) {
                        $scope.plate.runnerData.show = true;
                    }
                };
                $scope.disactivatePlate = function () {
                    if (!$scope.plate.runnerData.onRunner) {
                        $scope.plate.runnerData.show = false;
                    }
                };
                $scope.onDragStop = function ($data, $event) {
                    console.log("TRST", $data, $event);
                };
                $scope.runnerChangePosition = function ($event) {
                    $scope.plate.runnerData.top = plateFactory.preparePosition(getMouseOffset($event));
                };
            }
        };
    }]);
    app.directive('calendarPlateRunner', [function () {
        return {
            restrict: 'E',
            templateUrl: '/bundles/calendar/html/runner-field.html.tpl',
            replace: true,
            scope: {
                data: '='
            },
            link: function ($scope, el, attr) {
                $scope.$watch('data.top', function (value) {
                    $scope.data.display.top = value;
                });
            }
        }
    }]);
});