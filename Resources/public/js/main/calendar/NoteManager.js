if (!window.MainElements) {
    window.MainElements = {};
}
if (!window.MainElements.initAppCallStack) {
    window.MainElements.initAppCallStack = [];
}
MainElements.initAppCallStack.push(function(app) {
    app.factory('NoteManager', ['DateManager', function(dateManager) {
        var Note = function(noteInfo) {
            this.display = {

            };
            angular.extend(this, noteInfo);
            this.setFromTime = function(value) {
                this.fromTime = value;
            };
            this.setDuration = function(value) {
                this.duration = value;
            };
            this.getFromTime = function() {
                return this.fromTime;
            };
            this.getDuration = function() {
                return this.duration;
            };

            this.calculateDisplayHeight = function() {
                var duration = this.getDuration();

                if (this.offsetBottom) {
                    duration -= dateManager.timeSectionDuration;
                }
                if (this.offsetTop) {
                    duration -= dateManager.timeSectionDuration;
                }

                this.display.height = dateManager.timeToPixel(duration);
            };

            this.calculateDisplayTop = function() {
                var top = this.fromTime - this.blank.getPlanStart();

                if (this.offsetTop) {
                    top += dateManager.timeSectionDuration;
                }

                this.display.top = dateManager.timeToPixel(top);
            }
        };
        return {
            defaultNoteData: {
                duration: 0,
                fromTime: 0,
                offsetTop: false,
                offsetBottom: false
            },
            getDefaultNoteInfo: function(customDefaults) {
                if (!customDefaults) {
                    customDefaults = {};
                }
                return angular.extend(customDefaults, this.defaultNoteData, {
                    id: Math.random().toString(36).substring(10)
                });
            },
            prepareNote: function (noteInfo) {
                return new Note(noteInfo);
            }
        }
    }]);
    app.directive('calendarNote', ['DateManager', function(dateManager) {
        return {
            templateUrl: '/bundles/calendar/html/note.html.tpl',
            replace: true,
            restrict: 'E',
            scope: {
                note: '=',
                noteChangeCallback: '&'
            },
            link: function($scope, el, attr) {
                $scope.$watch('note.fromTime', function(value) {
                    $scope.note.calculateDisplayTop();
                });
                $scope.$watch('note.offsetTop', function() {
                    $scope.note.calculateDisplayTop();
                    $scope.note.calculateDisplayHeight();
                });
                $scope.$watch('note.duration', function(value) {
                    $scope.note.calculateDisplayHeight();
                });
                $scope.$watch('note.offsetBottom', function() {
                    $scope.note.calculateDisplayHeight();
                });
            }
        }
    }]);
});