// Reachability: a full-arm IK avatar standing where the cleaner stands must be able
// to physically reach the Start job button and a task row on the parked panel
// (about 1 m ahead, 15 cm below eye level). A trigger that fails to converge is a
// real placement finding, not a test bug.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {JobLensLeafInteractor, getPanel} from "./JobLensLeafHelpers"

@component
export class JobLensIkReachScenario extends Scenario {
  private readonly ik = createIKInteractor()

  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    await it.resetToStart()

    const start = findInteractablesByName("StartJobButton", undefined, true)[0]
    expect(start !== undefined, "Start job button exists").toBe(true)
    await this.ik.trigger(start)
    await sleep(600)
    expect(getPanel().currentPhase, "IK reach pinched Start job").toBe("job")

    const row = findInteractablesByName("Task-Clean stovetop", undefined, true)[0]
    expect(row !== undefined, "Clean stovetop row exists").toBe(true)
    await this.ik.trigger(row)
    await sleep(600)
    expect(getPanel().state.isTaskDone(0, 1), "IK reach checked Clean stovetop").toBe(true)
  }
}
