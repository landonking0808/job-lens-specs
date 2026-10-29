// Done criterion 2: Pinching a task row checks it, and the done count and the
// progress ring update. Pinching it again unchecks it, and the count and ring go back.
// Uses delta assertions so it is resilient to whatever state the Lens is in.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, childOf, textOf} from "./JobLensLeafHelpers"

@component
export class JobLensTaskToggleScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    const panel = await it.ensureJobRunning()
    const state = panel.state
    const room = state.currentRoom
    const tasks = state.rooms[room].tasks
    const total = state.totalTasks()

    // Pick an open task that is not the last open one (so the room does not complete and switch).
    let taskIndex = -1
    for (let i = 0; i < tasks.length; i++) {
      if (!state.isTaskDone(room, i)) {
        taskIndex = i
        break
      }
    }
    expect(taskIndex, "there is an open task to check").not.toBe(-1)
    const rowName = "Task-" + tasks[taskIndex]
    const doneBefore = state.totalDone()
    const roomDoneBefore = state.roomDoneCount(room)
    expect(childOf(rowName, "TaskCheck").enabled, "open row shows no check mark").toBe(false)

    // Check it
    await it.tap(rowName)
    expect(state.isTaskDone(room, taskIndex), "pinching the row checks it").toBe(true)
    expect(state.totalDone(), "job done count goes up by one").toBe(doneBefore + 1)
    expect(textOf("RingCount"), "ring fills one step").toBe(`${doneBefore + 1}/${total}`)
    expect(
      textOf("RoomTitle").includes(`${roomDoneBefore + 1} of ${tasks.length}`),
      `room done count updates: "${textOf("RoomTitle")}"`,
    ).toBe(true)
    expect(childOf(rowName, "TaskCheck").enabled, "checked row shows its check mark").toBe(true)

    // Uncheck it
    await it.tap(rowName)
    expect(state.isTaskDone(room, taskIndex), "pinching again unchecks it").toBe(false)
    expect(state.totalDone(), "done count goes back").toBe(doneBefore)
    expect(textOf("RingCount"), "ring goes back one step").toBe(`${doneBefore}/${total}`)
    expect(
      textOf("RoomTitle").includes(`${roomDoneBefore} of ${tasks.length}`),
      `room done count goes back: "${textOf("RoomTitle")}"`,
    ).toBe(true)
    expect(childOf(rowName, "TaskCheck").enabled, "check mark hides again").toBe(false)
  }
}
