// Demo state (not a done criterion): leaves the Lens on the summary card with a few
// tasks done and two issues flagged, for visual checks and screenshots.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, getPanel} from "./JobLensLeafHelpers"

@component
export class JobLensDemoSummaryScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(800)
    await it.freshJob()
    await it.tap("Task-Wipe counters")
    await it.tap("Task-Clean stovetop")
    await it.tap("Task-Clean sink")
    await it.flagIssue("Supplies low")
    await sleep(1200)
    await it.flagIssue("Stain")
    await it.tap("EndJobButton")
    expect(getPanel().currentPhase, "summary card is showing for the demo state").toBe("summary")
  }
}
