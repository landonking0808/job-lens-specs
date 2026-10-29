// Demo state (not a done criterion): logs "Supplies low" so the confirmation toast
// is showing and the footer reads "Flag issue (1)". The toast is held open
// (toastSeconds) so a screenshot can be taken afterwards.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensLeafInteractor, buttonLabel} from "./JobLensLeafHelpers"

@component
export class JobLensDemoFlagConfirmScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(800)
    const panel = await it.ensureJobRunning()
    await it.tap("Task-Wipe counters")
    await it.tap("Task-Clean stovetop")
    panel.toastSeconds = 120
    await it.flagIssue("Supplies low")
    await sleep(400)
    expect(panel.isToastShowing, "confirmation toast is showing").toBe(true)
    expect(panel.toastMessage, "toast confirms the preset").toBe("Supplies low logged")
    expect(buttonLabel("FlagIssueButton"), "footer counts the flag").toBe("Flag issue (1)")
  }
}
