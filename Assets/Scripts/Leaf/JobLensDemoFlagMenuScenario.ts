// Demo state (not a done criterion): leaves the Lens on the checklist with the
// Flag issue menu open, for visual checks and screenshots.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, getPanel} from "./JobLensLeafHelpers"

@component
export class JobLensDemoFlagMenuScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(800)
    await it.freshJob()
    await it.tap("Task-Wipe counters")
    await it.tap("Task-Clean stovetop")
    await it.tap("FlagIssueButton")
    expect(getPanel().isFlagMenuOpen, "flag menu is open for the demo state").toBe(true)
  }
}
