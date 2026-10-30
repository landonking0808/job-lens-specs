// Shared helpers for the Job Lens LEAF scenarios.
// Scene object names here must match what JobLensPanel.ts creates at runtime.

import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {findSceneObjectsByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {JobLensPanel} from "../JobLensPanel"

/** Time to let UI Kit buttons settle and the panel rebuild rows after a pinch. */
export const SETTLE_MS = 400

/** Live (enabled) scene objects by name. Replaced UI is hidden for a moment before
 *  it is destroyed, so disabled matches are stale and ignored. */
function liveObjects(name: string): SceneObject[] {
  const objs = findSceneObjectsByName(name) ?? []
  return objs.filter((o) => !isNull(o) && o.isEnabledInHierarchy)
}

export function findObject(name: string): SceneObject {
  const objs = liveObjects(name)
  if (objs.length === 0) throw new Error(`Scene object "${name}" not found`)
  return objs[0]
}

export function hasObject(name: string): boolean {
  return liveObjects(name).length > 0
}

export function textOf(name: string): string {
  const t = findObject(name).getComponent("Component.Text") as Text | null
  if (!t) throw new Error(`"${name}" has no Text component`)
  return t.text
}

/** Text of the raw label drawn on a button cell (child named "Label"). */
export function buttonLabel(buttonName: string): string {
  const btn = findObject(buttonName)
  for (let i = 0; i < btn.getChildrenCount(); i++) {
    const c = btn.getChild(i)
    if (c.name === "Label") {
      const t = c.getComponent("Component.Text") as Text | null
      if (t) return t.text
    }
  }
  throw new Error(`Button "${buttonName}" has no Label child`)
}

/** Child SceneObject of a cell by name (e.g. the TaskCheck icon on a task row). */
export function childOf(parentName: string, childName: string): SceneObject {
  const p = findObject(parentName)
  for (let i = 0; i < p.getChildrenCount(); i++) {
    const c = p.getChild(i)
    if (c.name === childName) return c
  }
  throw new Error(`"${parentName}" has no child "${childName}"`)
}

export function getPanel(): JobLensPanel {
  const so = findObject("JobLensPanel")
  const p = so.getComponent(JobLensPanel.getTypeName()) as JobLensPanel | null
  if (!p) throw new Error("JobLensPanel script component not found")
  return p
}

export function colorsClose(a: vec4, b: vec4, eps: number = 0.02): boolean {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps
}

export class JobLensLeafInteractor extends DefaultLeafInteractor {
  /** Pinch a UI Kit button (or any SIK interactable) by its scene object name. */
  async tap(name: string): Promise<void> {
    const target = findInteractablesByName(name, undefined, true)[0]
    if (!target) throw new Error(`Interactable "${name}" not found or not enabled`)
    await this.trigger(target)
    await sleep(SETTLE_MS)
  }

  /** Bring the panel to the Start card whatever phase it is in. */
  async resetToStart(): Promise<JobLensPanel> {
    if (getPanel().currentPhase === "job") await this.tap("EndJobButton")
    if (getPanel().currentPhase === "summary") await this.tap("NewJobButton")
    await sleep(SETTLE_MS)
    return getPanel()
  }

  /** Per-scenario setup: every scenario starts from the same state whatever ran
   *  before it in LEAF's "run all" (one preview, no reload between scenarios).
   *  Puts the panel back at its parked placement (a drag in an earlier scenario
   *  must not move the targets for the next one), restores the toast duration,
   *  and brings the panel to the Start card with a fresh, empty job. */
  async freshStart(): Promise<JobLensPanel> {
    getPanel().resetPlacementForTest()
    await this.resetToStart()
    await sleep(SETTLE_MS)
    const panel = getPanel()
    if (panel.currentPhase !== "start") throw new Error(`setup: expected the Start card, got "${panel.currentPhase}"`)
    if (!panel.isAtHomeForTest()) throw new Error("setup: panel is not at its parked placement")
    return panel
  }

  /** Per-scenario setup for scenarios that need a running job: fresh start, then
   *  Start job, so tasks, issues, clock and room all begin from zero. */
  async freshJob(): Promise<JobLensPanel> {
    await this.freshStart()
    await this.tap("StartJobButton")
    await sleep(SETTLE_MS)
    const panel = getPanel()
    if (panel.currentPhase !== "job") throw new Error(`setup: expected a running job, got "${panel.currentPhase}"`)
    if (panel.state.totalDone() !== 0 || panel.state.flags.length !== 0 || panel.state.currentRoom !== 0) {
      throw new Error("setup: fresh job did not start clean")
    }
    return panel
  }

  /** Per-scenario teardown: undo anything that outlives the scenario (placement). */
  teardown(): void {
    const p = getPanel()
    p.resetPlacementForTest()
  }

  /** Make sure a job is running (Start card → checklist) and return the panel. */
  async ensureJobRunning(): Promise<JobLensPanel> {
    if (getPanel().currentPhase === "summary") await this.tap("NewJobButton")
    if (getPanel().currentPhase === "start") await this.tap("StartJobButton")
    await sleep(SETTLE_MS)
    return getPanel()
  }

  /** Pinch every open task row in the current room (the last one completes the room). */
  async checkAllTasksInCurrentRoom(panel: JobLensPanel): Promise<void> {
    const room = panel.state.currentRoom
    const tasks = panel.state.rooms[room].tasks
    for (let i = 0; i < tasks.length; i++) {
      if (!panel.state.isTaskDone(room, i)) await this.tap("Task-" + tasks[i])
    }
  }

  /** Flag issue → preset: two pinches, no typing. */
  async flagIssue(preset: string): Promise<void> {
    await this.tap("FlagIssueButton")
    await this.tap("Flag-" + preset)
  }
}
