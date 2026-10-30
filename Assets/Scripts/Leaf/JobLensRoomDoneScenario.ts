// Done criterion 3: Checking the last task in a room marks that room's tab as done
// and moves the panel to the next unfinished room. Pinching the room tabs switches rooms.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, childOf, getPanel, hasObject, textOf} from "./JobLensLeafHelpers"

@component
export class JobLensRoomDoneScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    const panel = await it.freshJob()
    const state = panel.state

    // Work in the Kitchen.
    if (state.currentRoom !== 0) await it.tap("Tab-Kitchen")
    expect(state.currentRoom, "Kitchen tab selects the Kitchen").toBe(0)
    expect(state.isRoomDone(0), "Kitchen still has open tasks at the start of this scenario").toBe(false)
    expect(childOf("Tab-Kitchen", "TabCheck").enabled, "Kitchen tab has no check mark yet").toBe(false)

    await it.checkAllTasksInCurrentRoom(panel)

    expect(state.isRoomDone(0), "all Kitchen tasks are checked").toBe(true)
    expect(childOf("Tab-Kitchen", "TabCheck").enabled, "Kitchen tab gets a check mark").toBe(true)
    expect(panel.isToastShowing, "a room-done message shows").toBe(true)
    expect(panel.toastMessage, "message reads 'Kitchen done'").toBe("Kitchen done")

    const expectedNext = state.nextUnfinishedRoom(0)
    expect(expectedNext, "there is another unfinished room").not.toBe(-1)
    expect(state.currentRoom, "panel moves on to the next unfinished room").toBe(expectedNext)
    const nextName = state.rooms[expectedNext].name
    expect(textOf("RoomTitle").includes(nextName), `room title now shows ${nextName}: "${textOf("RoomTitle")}"`).toBe(true)
    expect(hasObject("Task-" + state.rooms[expectedNext].tasks[0]), "next room's task rows are shown").toBe(true)

    // Tabs switch rooms both ways.
    await it.tap("Tab-Bedroom")
    expect(getPanel().state.currentRoom, "Bedroom tab selects Bedroom").toBe(2)
    expect(textOf("RoomTitle").includes("Bedroom"), "title shows Bedroom").toBe(true)
    expect(hasObject("Task-Make bed"), "Bedroom rows are shown").toBe(true)

    await it.tap("Tab-Kitchen")
    expect(getPanel().state.currentRoom, "Kitchen tab goes back to the finished Kitchen").toBe(0)
    expect(textOf("RoomTitle").includes("Kitchen"), "title shows Kitchen").toBe(true)
    expect(textOf("RoomTitle").includes("6 of 6"), `Kitchen shows 6 of 6 done: "${textOf("RoomTitle")}"`).toBe(true)
    expect(childOf("Task-Mop floor", "TaskCheck").enabled, "finished Kitchen rows keep their check marks").toBe(true)

    // Fade: the room-done message is gone after about 2 seconds.
    await sleep(2200)
    expect(getPanel().isToastShowing, "room-done message fades out").toBe(false)
  }
}
