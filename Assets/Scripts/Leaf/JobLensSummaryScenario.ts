// Done criterion 5: Pinching End job shows a summary card with tasks done x out of y,
// time used versus the 2:30 booked, and the flagged issues listed with room and time.
// Pinching New job resets everything back to the Start card.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensState} from "../JobLensState"
import {JobLensLeafInteractor, getPanel, hasObject, textOf} from "./JobLensLeafHelpers"

@component
export class JobLensSummaryScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    const panel = await it.ensureJobRunning()
    const state = panel.state

    // Make sure there is something to summarise: at least one task and one issue.
    const room = state.currentRoom
    const tasks = state.rooms[room].tasks
    for (let i = 0; i < tasks.length; i++) {
      if (!state.isTaskDone(room, i)) {
        await it.tap("Task-" + tasks[i])
        break
      }
    }
    if (state.flags.length === 0) await it.flagIssue("Stain")

    const done = state.totalDone()
    const total = state.totalTasks()
    const flags = state.flags.slice()
    const usedBefore = state.usedLabel()
    expect(done, "at least one task is done").toBeGreaterThan(0)
    expect(flags.length, "at least one issue is flagged").toBeGreaterThan(0)

    await it.tap("EndJobButton")

    expect(panel.currentPhase, "End job opens the summary").toBe("summary")
    expect(hasObject("RoomTitle"), "checklist is gone").toBe(false)
    expect(textOf("SummaryTasks"), "summary shows tasks done x of y").toBe(`Tasks done ${done} of ${total}`)
    const time = textOf("SummaryTime")
    expect(time.startsWith("Time used " + usedBefore.substring(0, usedBefore.length - 1)), `summary shows time used: "${time}"`).toBe(true)
    expect(time.includes("of 2:30:00 booked"), `summary compares against the 2:30 booked: "${time}"`).toBe(true)
    expect(textOf("SummaryIssuesTitle").includes(`(${flags.length})`), "summary counts the flagged issues").toBe(true)
    for (let i = 0; i < Math.min(flags.length, 7); i++) {
      const line = textOf("SummaryIssue-" + i)
      expect(line.includes(flags[i].label), `issue ${i} lists its label: "${line}"`).toBe(true)
      expect(line.includes(flags[i].room), `issue ${i} lists its room: "${line}"`).toBe(true)
      expect(line.includes(JobLensState.formatClock(flags[i].jobSeconds)), `issue ${i} lists its job time: "${line}"`).toBe(true)
    }

    await it.tap("NewJobButton")

    const fresh = getPanel()
    expect(fresh.currentPhase, "New job goes back to the Start card").toBe("start")
    expect(hasObject("StartJobButton"), "Start job button is back").toBe(true)
    expect(hasObject("SummaryTasks"), "summary card is gone").toBe(false)
    expect(fresh.state.totalDone(), "tasks are reset").toBe(0)
    expect(fresh.state.flags.length, "issues are reset").toBe(0)
    expect(fresh.state.elapsedSeconds, "clock is reset").toBe(0)
    expect(fresh.state.currentRoom, "room is reset to Kitchen").toBe(0)

    // And a fresh job really starts clean.
    await it.tap("StartJobButton")
    expect(textOf("RoomTitle").includes("0 of 6"), "fresh job starts at 0 of 6").toBe(true)
    expect(textOf("UsedTime"), "fresh job starts at 0:00").toBe("Used 0:00")
  }
}
