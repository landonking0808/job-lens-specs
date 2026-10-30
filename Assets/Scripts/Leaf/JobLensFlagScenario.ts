// Done criterion 4: Pinching Flag issue, then Supplies low, adds that issue with the
// current room and the job time, shows a confirmation that fades, and the count on
// the Flag issue button goes up to "Flag issue (1)".

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {JobLensLeafInteractor, buttonLabel, getPanel} from "./JobLensLeafHelpers"

@component
export class JobLensFlagScenario extends Scenario {
  async run(): Promise<void> {
    const it = new JobLensLeafInteractor()
    await sleep(1000)
    const panel = await it.freshJob()
    const state = panel.state
    const flagsBefore = state.flags.length
    expect(buttonLabel("FlagIssueButton"), "button shows the current flag count").toBe(`Flag issue (${flagsBefore})`)
    expect(panel.isFlagMenuOpen, "flag menu starts closed").toBe(false)

    // First pinch: open the menu with the four presets.
    await it.tap("FlagIssueButton")
    expect(panel.isFlagMenuOpen, "Flag issue opens the preset menu").toBe(true)
    for (const preset of ["Stain", "Broken item", "Supplies low", "Pet or safety hazard"]) {
      expect(findInteractablesByName("Flag-" + preset, undefined, true).length, `preset "${preset}" is pinchable`).toBeGreaterThan(0)
    }

    // Second pinch: log Supplies low.
    const roomName = state.rooms[state.currentRoom].name
    const elapsedAtFlag = state.elapsedSeconds
    await it.tap("Flag-Supplies low")

    expect(state.flags.length, "one issue was added").toBe(flagsBefore + 1)
    const entry = state.flags[state.flags.length - 1]
    expect(entry.label, "issue is Supplies low").toBe("Supplies low")
    expect(entry.room, "issue is logged with the current room").toBe(roomName)
    expect(entry.jobSeconds, "issue is logged with the job time").toBeGreaterThan(elapsedAtFlag - 0.001)
    expect(entry.jobSeconds, "job time is not in the future").toBeLessThan(state.elapsedSeconds + 0.001)
    expect(panel.isFlagMenuOpen, "menu closes after a preset is pinched").toBe(false)
    expect(buttonLabel("FlagIssueButton"), "flag count goes up on the button").toBe(`Flag issue (${flagsBefore + 1})`)
    expect(panel.isToastShowing, "a confirmation shows").toBe(true)
    expect(panel.toastMessage, "confirmation names the issue").toBe("Supplies low logged")

    // ...and fades after about 2 seconds.
    await sleep(2200)
    expect(getPanel().isToastShowing, "confirmation has faded").toBe(false)

    // Pinching Flag issue again toggles the menu open and closed without logging.
    await it.tap("FlagIssueButton")
    expect(getPanel().isFlagMenuOpen, "menu opens again").toBe(true)
    await it.tap("FlagIssueButton")
    expect(getPanel().isFlagMenuOpen, "second Flag issue pinch closes the menu").toBe(false)
    expect(getPanel().state.flags.length, "no extra issue was logged").toBe(flagsBefore + 1)
  }
}
