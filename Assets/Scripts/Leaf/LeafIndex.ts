// LEAF scenario registry for Job Lens. Attached to the "LeafIndex" scene object.
// Scenario ids map to the done criteria in devpost/design-brief.md.

import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {JobLensStartScenario} from "./JobLensStartScenario"
import {JobLensTaskToggleScenario} from "./JobLensTaskToggleScenario"
import {JobLensRoomDoneScenario} from "./JobLensRoomDoneScenario"
import {JobLensFlagScenario} from "./JobLensFlagScenario"
import {JobLensSummaryScenario} from "./JobLensSummaryScenario"
import {JobLensTimerScenario} from "./JobLensTimerScenario"
import {JobLensHandleDragScenario} from "./JobLensHandleDragScenario"
import {JobLensIkReachScenario} from "./JobLensIkReachScenario"
import {JobLensDemoFlagConfirmScenario} from "./JobLensDemoFlagConfirmScenario"
import {JobLensDemoRoomDoneScenario} from "./JobLensDemoRoomDoneScenario"
import {JobLensDemoChecklistScenario} from "./JobLensDemoChecklistScenario"
import {JobLensDemoFlagMenuScenario} from "./JobLensDemoFlagMenuScenario"
import {JobLensDemoSummaryScenario} from "./JobLensDemoSummaryScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "01-start-job-shows-kitchen-and-timer", typename: JobLensStartScenario.getTypeName()},
    {id: "02-task-row-check-and-uncheck", typename: JobLensTaskToggleScenario.getTypeName()},
    {id: "03-room-done-marks-tab-and-moves-on", typename: JobLensRoomDoneScenario.getTypeName()},
    {id: "04-flag-issue-supplies-low", typename: JobLensFlagScenario.getTypeName()},
    {id: "05-end-job-summary-and-new-job", typename: JobLensSummaryScenario.getTypeName()},
    {id: "06-timer-warning-and-overtime", typename: JobLensTimerScenario.getTypeName()},
    {id: "07-drag-handle-moves-panel", typename: JobLensHandleDragScenario.getTypeName()},
    {id: "08-ik-reach-start-and-task-row", typename: JobLensIkReachScenario.getTypeName()},
    {id: "95-demo-state-flag-confirmation", typename: JobLensDemoFlagConfirmScenario.getTypeName()},
    {id: "96-demo-state-room-done-toast", typename: JobLensDemoRoomDoneScenario.getTypeName()},
    {id: "97-demo-state-checklist-two-done", typename: JobLensDemoChecklistScenario.getTypeName()},
    {id: "98-demo-state-flag-menu-open", typename: JobLensDemoFlagMenuScenario.getTypeName()},
    {id: "99-demo-state-summary-card", typename: JobLensDemoSummaryScenario.getTypeName()},
  ]
}
