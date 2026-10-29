// Move the panel: pinch and drag the handle bar along the top edge. The panel
// stays wherever it is dropped (design brief → Hands and input).

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {JobLensLeafInteractor, findObject} from "./JobLensLeafHelpers"

@component
export class JobLensHandleDragScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    await it.ensureJobRunning()

    const panelObj = findObject("JobLensPanel")
    const before = panelObj.getTransform().getWorldPosition()
    const handle = findInteractablesByName("Handle", undefined, true)[0]
    expect(handle !== undefined, "the handle bar is pinchable").toBe(true)

    await it.drag(handle, new vec3(14, 0, 0), 900)
    await sleep(600)

    const after = panelObj.getTransform().getWorldPosition()
    const moved = after.distance(before)
    expect(moved, `dragging the handle moves the whole panel (moved ${moved.toFixed(1)} cm)`).toBeGreaterThan(3)
    expect(after.x - before.x, "panel followed the drag to the right").toBeGreaterThan(2)

    // It stays where it was dropped.
    await sleep(800)
    const later = panelObj.getTransform().getWorldPosition()
    expect(later.distance(after), "panel stays parked after the drop").toBeLessThan(1.0)
  }
}
