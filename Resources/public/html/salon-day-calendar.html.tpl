<div class="calendar-container">
    <div class="clearfix">
        <div class="fl-l">
            <div class="empty-data day">
                Все расписание на день
            </div>
            <div class="time-labels">
                <div class="clearfix">
                    <div class="p-rel fl-l">
                        <div ng-repeat="timeSection in calendar.view.dayTimeSections" class="control time-label">
                            <div class="" ng-style="timeSection.display"
                                 ng-attr-height="{[ timeSection.display.height ]}">{[ timeSection.time ]}</div>
                        </div>
                    </div>
                    <div class="fl-l">
                        <div ng-repeat="greatTimeSection in calendar.view.dayTimeSections"
                             class="p-rel control time-label"
                             ng-class="{odd: greatTimeSection.odd}">
                            <div class="control time-small" ng-repeat="timeSection in greatTimeSection.sections"
                                 ng-style="timeSection.display">
                                {[ timeSection.time ]}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dilimiter"></div>
            </div>
        </div>
        <div class="table-wrapper fl-l"
             data-scroll-width="floatFullWidth"
             ng-scrolled="calendar"
             ng-style="calendar.view.dayStyle"
                >
            <table class="columns"
                   rv-call="view.initializeTable"
                    >
                <tr class="header">
                    <td ng-repeat="(cid, blanks) in calendar.currentDay" class="category">
                        {[ calendar.servicesHierarchy[cid].name ]}
                    </td>
                </tr>
                <tr class="header time-labels">
                    <td ng-repeat="(cid, blanks) in calendar.currentDay">
                       <table>
                           <tr>
                               <td ng-repeat="(columnId, plate) in blanks">
                                   <div class="master">{[ calendar.columns[columnId].presentation ]}</div>

                                   <calendar-plate plate="plate">

                                   </calendar-plate>
                               </td>
                           </tr>
                       </table>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</div>

