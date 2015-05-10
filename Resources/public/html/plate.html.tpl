<div class="plate"
     ng-style="plate.blank.column.display"
     ng-class="plate.blank.column.class"
     ng-drop="true"
     ng-drop-success="onDrop($data, $event)"
     hm-tap="setRunner($event)"
     hm-doubletap="addNote($event)"
     ng-dblclick="addNote($event)"
     ng-mouseover="activatePlate($event)"
     ng-mouseleave="disactivatePlate($event)"
     ng-mousemove="runnerChangePosition($event)"
        >
    <calendar-plate-runner data="plate.runnerData">

    </calendar-plate-runner>

    <calendar-note ng-repeat="note in plate.blank.notes" note="note">

    </calendar-note>
</div>