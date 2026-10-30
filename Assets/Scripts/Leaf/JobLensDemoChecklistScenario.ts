// Demo state (not a done criterion): leaves the Lens on the Kitchen checklist with
// two tasks checked, for visual checks and screenshots.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, getPanel} from "./JobLensLeafHelpers"

@component
export class JobLensDemoChecklistScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(800)
    await it.freshJob()
    await it.tap("Task-Wipe counters")
    await it.tap("Task-Clean stovetop")
    expect(getPanel().state.totalDone(), "two tasks are checked for the demo state").toBe(2)
  }
}
