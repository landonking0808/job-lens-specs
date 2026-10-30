// Done criterion 1: Pinching Start job on the Start card shows the Kitchen checklist
// with 0 of its tasks done, and the timer starts at 0:00 used / 2:30:00 left and
// counts while tasks are checked off.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, getPanel, hasObject, textOf} from "./JobLensLeafHelpers"

@component
export class JobLensStartScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    await it.freshStart()

    expect(getPanel().currentPhase, "should be on the Start card").toBe("start")
    expect(hasObject("StartJobButton"), "Start card shows a Start job button").toBe(true)
    expect(textOf("StartDescription").toLowerCase().includes("booked 2h30"), "Start card describes the sample job").toBe(true)

    await it.tap("StartJobButton")

    const panel = getPanel()
    expect(panel.currentPhase, "Start job opens the checklist").toBe("job")
    expect(panel.state.currentRoom, "checklist opens on Kitchen").toBe(0)
    const title = textOf("RoomTitle")
    expect(title.includes("Kitchen"), `room title shows Kitchen: "${title}"`).toBe(true)
    expect(title.includes("0 of 6"), `Kitchen starts at 0 of 6 done: "${title}"`).toBe(true)
    expect(textOf("UsedTime"), "timer starts at 0:00 used").toBe("Used 0:00")
    expect(textOf("LeftTime"), "timer starts at 2:30:00 left").toBe("Left 2:30:00")
    expect(textOf("RingCount"), "ring starts empty").toBe("0/19")
    expect(hasObject("Task-Clean stovetop"), "Kitchen task rows are present").toBe(true)

    // Let real time pass while a task is checked off: the clock must keep counting.
    await sleep(1300)
    await it.tap("Task-Wipe counters")
    expect(getPanel().state.elapsedSeconds, "job clock counts in real time").toBeGreaterThan(1)
    expect(textOf("UsedTime"), "used time has moved on from 0:00").not.toBe("Used 0:00")
    expect(textOf("LeftTime").startsWith("Left 2:29:"), `time left counts down: "${textOf("LeftTime")}"`).toBe(true)
    expect(getPanel().state.isTaskDone(0, 0), "task checked while the clock ran").toBe(true)
  }
}
