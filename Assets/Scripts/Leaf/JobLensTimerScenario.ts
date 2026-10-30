// Timer behaviours that real time cannot reach in a short demo (design brief →
// Risks): under 15 minutes left the time-left number turns a warmer colour, and
// past zero it shows how far over the booked time the job is. Uses the panel's
// advanceClockForTest hook to move the job clock forward.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, colorsClose, textOf} from "./JobLensLeafHelpers"

@component
export class JobLensTimerScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    const panel = await it.freshJob()
    const state = panel.state

    // Plenty of time left: normal colour.
    expect(textOf("LeftTime").startsWith("Left "), "time left shows while the job runs").toBe(true)
    expect(colorsClose(panel.leftTextColor!, panel.textColor), "time left is the normal colour at the start").toBe(true)
    expect(colorsClose(panel.leftTextColor!, panel.warnColor), "time left is not warm at the start").toBe(false)

    // Jump to 14 minutes left.
    const toFourteenLeft = state.bookedSeconds - 14 * 60 - state.elapsedSeconds
    panel.advanceClockForTest(toFourteenLeft)
    await sleep(300)
    expect(state.isUnderWarning, "under 15 minutes counts as the warning window").toBe(true)
    expect(state.isOverTime, "but not over time yet").toBe(false)
    const left = textOf("LeftTime")
    expect(left.startsWith("Left 13:") || left.startsWith("Left 14:"), `time left reads about 14 minutes: "${left}"`).toBe(true)
    expect(colorsClose(panel.leftTextColor!, panel.warnColor), "time left turns the warm colour").toBe(true)
    expect(textOf("UsedTime").startsWith("Used 2:16:") || textOf("UsedTime").startsWith("Used 2:15:"), `time used reads about 2:16: "${textOf("UsedTime")}"`).toBe(true)

    // Jump 20 more minutes: six minutes over the booked time.
    panel.advanceClockForTest(20 * 60)
    await sleep(300)
    expect(state.isOverTime, "past zero counts as over time").toBe(true)
    const over = textOf("LeftTime")
    expect(over.startsWith("Over 6:") || over.startsWith("Over 5:"), `time left shows how far over: "${over}"`).toBe(true)
    expect(colorsClose(panel.leftTextColor!, panel.warnColor), "overtime stays the warm colour").toBe(true)

    // The summary reports the overrun too.
    await it.tap("EndJobButton")
    const time = textOf("SummaryTime")
    expect(time.includes("over by"), `summary notes the overrun: "${time}"`).toBe(true)
    await it.tap("NewJobButton")
  }
}
