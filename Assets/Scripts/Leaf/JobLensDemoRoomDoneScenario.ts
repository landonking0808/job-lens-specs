// Demo state (not a done criterion): finishes the Kitchen so the "Kitchen done"
// toast is showing, the Kitchen tab has its check mark and the panel is on Bathroom.
// The toast is held open (toastSeconds) so a screenshot can be taken afterwards.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, childOf} from "./JobLensLeafHelpers"

@component
export class JobLensDemoRoomDoneScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(800)
    const panel = await it.freshJob()
    panel.toastSeconds = 120
    await it.checkAllTasksInCurrentRoom(panel)
    await sleep(600)
    expect(panel.isToastShowing, "Kitchen done toast is showing").toBe(true)
    expect(panel.toastMessage, "toast names the room").toBe("Kitchen done")
    expect(childOf("Tab-Kitchen", "TabCheck").enabled, "Kitchen tab has its check mark").toBe(true)
    expect(panel.state.currentRoom, "panel moved on to Bathroom").toBe(1)
  }
}
