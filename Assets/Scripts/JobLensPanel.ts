// Job Lens — the one parked panel. Start card → checklist → summary, all inside a
// single movable UI Kit Frame so the panel stays wherever the cleaner dropped it.
// Spec: devpost/design-brief.md. Built with Spectacles UI Kit (FlexLayout, Frame,
// Button, RoundedRectangle) so pinches work with the mouse in Interactive Preview and with LEAF.

import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {Frame} from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {GradientParameters, RoundedRectangle, RoundedRectBlendMode} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {RoundedRectangleVisual} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {JobLensState, JobPhase} from "./JobLensState"
import {FLAG_PRESETS, JOB_DESCRIPTION} from "./JobLensData"

const ICON_CHECK = requireAsset("../Icons/check.png") as Texture
const ICON_DOT = requireAsset("../Icons/circle.png") as Texture
const ICON_EMPTY = requireAsset("../Icons/radio_button_unchecked_wght500.png") as Texture

// ── Typography: the single source of truth for text size + weight ────────────
// Component.Text.size is the glyph em-square height (cm ≈ size / 44). These are tuned
// for a panel ~1 m away: task rows fill most of their 4.2 cm height, the time-left
// clock is the biggest number on the panel. Pick a role, never a raw number.
type TextRole =
  | "AppTitle" | "BigTitle" | "CardTitle" | "Heading" | "Tab" | "Row" | "Clock" | "ClockBig"
  | "Ring" | "Button" | "Subheading" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  AppTitle: {size: 54, weight: 700},
  BigTitle: {size: 124, weight: 700},
  CardTitle: {size: 94, weight: 700},
  Heading: {size: 74, weight: 700},
  Tab: {size: 56, weight: 500},
  Row: {size: 84, weight: 500},
  Clock: {size: 60, weight: 500},
  ClockBig: {size: 102, weight: 700},
  Ring: {size: 58, weight: 700},
  Button: {size: 66, weight: 500},
  Subheading: {size: 66, weight: 700},
  Body: {size: 60, weight: 500},
  Caption: {size: 50, weight: 500},
}
function applyTextRole(t: Text, role: TextRole): void {
  t.size = TYPE_SCALE[role].size
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

// ── Palette: one mid slate-blue card, lighter surfaces for rows and buttons,
// white text. Never dark, never black: Specs displays are additive, so brightness is
// what reads as solidity and dark colours go see-through.
const PANEL_BG = new vec4(0.33, 0.47, 0.62, 1)
const PANEL_BG_DEEP = new vec4(0.29, 0.42, 0.56, 1)
const PANEL_BORDER = new vec4(0.66, 0.76, 0.87, 1) // pre-blended: the card plate is opaque
const SURFACE = new vec4(0.46, 0.6, 0.74, 1)
const SURFACE_HOVER = new vec4(0.54, 0.67, 0.8, 1)
const SURFACE_PRESS = new vec4(0.62, 0.74, 0.86, 1)
const SURFACE_MUTED = new vec4(0.36, 0.5, 0.64, 1) // done rows: close to the card
const SURFACE_MUTED_HOVER = new vec4(0.41, 0.55, 0.69, 1)
const ACCENT = new vec4(0.14, 0.64, 0.8, 1) // the room you're in
const ACCENT_HOVER = new vec4(0.2, 0.72, 0.88, 1)
const OVERLAY_BG = new vec4(0.26, 0.38, 0.52, 1)
const OVERLAY_BORDER = new vec4(1, 1, 1, 0.4)
const HANDLE_COLOR = new vec4(1, 1, 1, 0.5)
const BUTTON_EDGE = new vec4(0.64, 0.75, 0.86, 1) // subtle light edge on surfaces
const BUTTON_EDGE_HOVER = new vec4(0.92, 0.96, 1, 1)
const ACCENT_EDGE = new vec4(0.55, 0.85, 0.95, 1)
const MUTED_EDGE = new vec4(0.42, 0.56, 0.7, 1)

/** A "gradient" with one colour at every stop: the theme's gradient pipeline, our flat fill. */
function flatGradient(color: vec4): GradientParameters {
  const stop = (percent: number) => ({enabled: true, color, percent})
  return {
    enabled: true,
    type: "Linear",
    start: new vec2(-1, 1),
    end: new vec2(1, -1),
    stop0: stop(0),
    stop1: stop(0.5),
    stop2: stop(0.95),
    stop3: stop(1),
  }
}

type ButtonPalette = {normal: vec4; hover: vec4; press: vec4; on: vec4; onHover: vec4; onPress: vec4; onEdge: vec4}
const BUTTON_PALETTE: ButtonPalette = {
  normal: SURFACE, hover: SURFACE_HOVER, press: SURFACE_PRESS,
  on: ACCENT, onHover: ACCENT_HOVER, onPress: ACCENT_HOVER, onEdge: ACCENT_EDGE,
}
const ROW_PALETTE: ButtonPalette = {
  normal: SURFACE, hover: SURFACE_HOVER, press: SURFACE_PRESS,
  on: SURFACE_MUTED, onHover: SURFACE_MUTED_HOVER, onPress: SURFACE_MUTED_HOVER, onEdge: MUTED_EDGE,
}

// ── Layout (cm). 32 cm wide per the brief. Six task rows at 4.2 cm (above the 4 cm
// Interaction Kit minimum) plus header, tabs, title, ring row and footer come to
// ~47 cm; the panel parks with its centre 6.5 cm below eye level so the whole card,
// footer included, is inside the view at 1 m.
const PANEL_W = 32
const CARD_MARGIN = 1.0 // Frame margin around the content (its default 4 cm reads as dead space)
const PAD = 1.0
const INNER_W = PANEL_W - PAD * 2 // 30
const COL_GAP = 0.35
const HEADER_H = 2.0
const TAB_H = 3.0
const TAB_GAP = 0.4
const TITLE_H = 2.2
const ROW_H = 4.2
const ROW_GAP = 0.25
const MAX_ROWS = 6
const ROWS_BLOCK_H = MAX_ROWS * ROW_H + (MAX_ROWS - 1) * ROW_GAP // 26.45
const RING_ROW_H = 5.2
const FOOT_H = 4.2
const CHECKLIST_H =
  PAD * 2 + HEADER_H + TAB_H + TITLE_H + ROWS_BLOCK_H + RING_ROW_H + FOOT_H + COL_GAP * 5 // 46.8
const START_H = 19
const SUMMARY_BASE_H = 26.0 // pads, title, two spacers, stats, issues heading, button, and their gaps
const SUMMARY_LINE_H = 2.6
const SUMMARY_GAP = 0.6
const MAX_SUMMARY_LINES = 6
const BIG_BUTTON_W = 18
const BIG_BUTTON_H = 5.2

const CONTENT_Z = 0.6 // content sits in front of the Frame plate (depth tie-breaker)
const BUTTON_LABEL_Z = 0.08 // labels drawn ON a button face
const OVERLAY_Z = 1.2 // flag menu / toast float above the task rows
// Text is not reliably depth-sorted against plates, so overlays also get a higher render order.
const OVERLAY_ORDER = 10
const RING_BOX = 5.4
const RING_OUTER = 5.2 // track outer diameter
const RING_WIDTH = 0.8 // track band width
const RING_RADIUS = RING_OUTER / 2 - RING_WIDTH / 2 // centre line of the band
const RING_DOT = 0.95 // fill dots (icon has ~15% transparent padding)
const RING_SEGMENTS_PER_TASK = 3 // dots overlap heavily so the arc reads as solid
const RETIRE_DELAY_S = 1.0 // hide-then-destroy delay for replaced UI (0.25 s raced LEAF's pinch release under load)

type Phase = JobPhase

@component
export class JobLensPanel extends BaseScriptComponent {
  @ui.label("Job Lens — Checklist Panel")
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Image material (UI Kit Image.mat). Cloned per icon / ring dot.")
  imageMaterial!: Material

  @input
  @hint("Seconds the toast (room done / issue logged) stays before it has faded.")
  @widget(new SliderWidget(0.5, 5, 0.1))
  toastSeconds: number = 2.0

  @input
  @widget(new ColorWidget())
  @hint("Primary text colour. Keep it light: black renders transparent on Specs.")
  textColor: vec4 = new vec4(1, 1, 1, 1)

  @input
  @widget(new ColorWidget())
  @hint("Secondary text colour (done rows, captions).")
  dimTextColor: vec4 = new vec4(1, 1, 1, 0.72)

  @input
  @widget(new ColorWidget())
  @hint("Done colour: check marks, filled ring arc, finished room tabs.")
  doneColor: vec4 = new vec4(0.45, 0.92, 0.55, 1)

  @input
  @widget(new ColorWidget())
  @hint("Progress ring track colour (the unfilled part).")
  ringEmptyColor: vec4 = new vec4(1, 1, 1, 0.3)

  @input
  @widget(new ColorWidget())
  @hint("Warm colour for time left under 15 minutes and for overtime.")
  warnColor: vec4 = new vec4(1.0, 0.72, 0.35, 1)
  @ui.group_end

  // ── State ──
  readonly state = new JobLensState()
  private frame!: Frame
  private content!: SceneObject
  private pane: SceneObject | null = null

  // Checklist handles (rebuilt whenever the checklist pane is built)
  private tabButtons: Button[] = []
  private tabLabels: Text[] = []
  private tabChecks: SceneObject[] = []
  private rowsHost: SceneObject | null = null
  private roomTitle: Text | null = null
  private usedText: Text | null = null
  private leftText: Text | null = null
  private ringCenter: Text | null = null
  private ringDots: Material[] = []
  private ringDotObjs: SceneObject[] = []
  private flagButtonLabel: Text | null = null
  private flagMenu: SceneObject | null = null
  private toastRoot: SceneObject | null = null
  private toastText: Text | null = null
  private toastAge = 0
  private lastLeftLabel = ""
  private lastUsedLabel = ""

  private readonly phaseEvent = new Event<Phase>()
  /** Fires after the panel switches phase (start / job / summary). */
  get onPhaseChanged(): PublicApi<Phase> {
    return this.phaseEvent.publicApi()
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onAwake() {
    this.sceneObject.createComponent("Component.Canvas")
    this.frame = this.sceneObject.createComponent(Frame.getTypeName()) as Frame
    this.frame.autoShowHide = false
    this.frame.autoScaleContent = false
    this.frame.allowScaling = false
    this.frame.allowTranslation = true

    this.frame.onInitialized.add(() => {
      this.frame.showCloseButton = false
      this.frame.showFollowButton = false
      this.frame.innerSize = new vec2(PANEL_W, START_H)
      this.frame.margin = CARD_MARGIN
      this.paintFrame()
      this.content = this.obj(this.frame.contentTransform.getSceneObject(), "Content", new vec3(0, 0, CONTENT_Z))
      this.showPhase("start")
    })

    this.createEvent("UpdateEvent").bind(() => this.update())

  }

  /** The Frame ships as grey glass drawn by its own shader, which ignores the plain
   *  background colour. Hide that body and draw an opaque card plate of the same size
   *  and corner radius in our palette; the Frame keeps its collider, drag and layout. */
  private cardPlate: RoundedRectangle | null = null
  private paintFrame() {
    const rr = this.frame.roundedRectangle
    if (!rr) return
    rr.renderMeshVisual.enabled = false
    const host = this.plate(rr.getSceneObject(), "CardPlate", rr.size.x, rr.size.y, PANEL_BG, PANEL_BORDER, rr.cornerRadius)
    this.cardPlate = host.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    this.cardPlate.borderSize = 0.15
  }

  /** Keep the card plate matched to the Frame body (innerSize changes per phase). */
  private syncCardPlate() {
    const rr = this.frame.roundedRectangle
    if (!rr || !this.cardPlate) return
    const s = rr.size
    const c = this.cardPlate.size
    if (Math.abs(s.x - c.x) > 0.01 || Math.abs(s.y - c.y) > 0.01) this.cardPlate.size = new vec2(s.x, s.y)
  }

  // Rebuilds that destroy the button being pinched run on the next frame, so the
  // interactor (mouse, hands or LEAF) can finish its trigger/hover-exit on a live object.
  private pending: (() => void)[] = []
  private queue(fn: () => void) {
    this.pending.push(fn)
  }

  /** Hide a retired UI subtree now and destroy it shortly after, so any interactor
   *  mid-trigger on one of its buttons can finish its hover-exit on a live object. */
  private retire(so: SceneObject) {
    if (isNull(so)) return
    so.enabled = false
    const ev = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
    ev.bind(() => {
      if (!isNull(so)) so.destroy()
      this.removeEvent(ev)
    })
    ev.reset(RETIRE_DELAY_S)
  }

  private update() {
    this.syncCardPlate()
    if (this.pending.length > 0) {
      const actions = this.pending
      this.pending = []
      for (const fn of actions) fn()
    }
    const dt = getDeltaTime()
    if (this.state.phase === "job") {
      this.state.tick(dt)
      this.refreshClock()
    }
    if (this.toastRoot && this.toastRoot.enabled) {
      this.toastAge += dt
      const a = Math.max(0, 1 - this.toastAge / this.toastSeconds)
      if (this.toastText) {
        this.toastText.textFill.color = new vec4(this.textColor.x, this.textColor.y, this.textColor.z, a)
      }
      if (this.toastAge >= this.toastSeconds) this.toastRoot.enabled = false
    }
  }

  // ── Public API (used by LEAF and the hint arrow) ───────────────────────────

  /** Test hook: move the job clock forward without waiting. Timer behaviours past 15 min can't be reached in a short demo. */
  advanceClockForTest(seconds: number): void {
    this.state.tick(seconds)
    this.refreshClock(true)
  }

  get currentPhase(): Phase {
    return this.state.phase
  }

  get isFlagMenuOpen(): boolean {
    return !!this.flagMenu && this.flagMenu.enabled
  }

  get isToastShowing(): boolean {
    return !!this.toastRoot && this.toastRoot.enabled
  }

  get toastMessage(): string {
    return this.toastText ? this.toastText.text : ""
  }

  /** Current colour of the time-left label (LEAF checks the warm colour). */
  get leftTextColor(): vec4 | null {
    return this.leftText ? this.leftText.textFill.color : null
  }

  // ── Phases ─────────────────────────────────────────────────────────────────

  private showPhase(phase: Phase) {
    if (this.pane) {
      this.retire(this.pane)
      this.pane = null
    }
    if (this.flagMenu) {
      this.retire(this.flagMenu)
      this.flagMenu = null
    }
    if (this.toastRoot) {
      this.retire(this.toastRoot)
      this.toastRoot = null
      this.toastText = null
    }
    this.tabButtons = []
    this.tabLabels = []
    this.tabChecks = []
    this.rowsHost = null
    this.roomTitle = null
    this.usedText = null
    this.leftText = null
    this.ringCenter = null
    this.ringDots = []
    this.ringDotObjs = []
    this.flagButtonLabel = null
    this.lastLeftLabel = ""
    this.lastUsedLabel = ""

    if (phase === "start") this.buildStartCard()
    else if (phase === "job") this.buildChecklist()
    else this.buildSummary()
    this.phaseEvent.invoke(phase)
  }

  // ── Start card ─────────────────────────────────────────────────────────────

  private buildStartCard() {
    this.frame.innerSize = new vec2(PANEL_W, START_H)
    const col = this.column(this.content, "StartCard", START_H, {gap: 1.0})
    this.addTextRow(col, "StartTitle", "Job Lens", "BigTitle", 4.6, HorizontalAlignment.Center, this.textColor)
    this.addTextRow(col, "StartDescription", JOB_DESCRIPTION, "Body", 4.8, HorizontalAlignment.Center, this.dimTextColor)
    this.addButtonRow(col, [{name: "StartJobButton", label: "Start job", onTap: () => this.startJob()}], BIG_BUTTON_W, BIG_BUTTON_H)
    this.pane = col
  }

  private startJob() {
    this.state.startJob()
    this.queue(() => this.showPhase("job"))
  }

  // ── Checklist ──────────────────────────────────────────────────────────────

  private buildChecklist() {
    this.frame.innerSize = new vec2(PANEL_W, CHECKLIST_H)
    const col = this.column(this.content, "Checklist", CHECKLIST_H, {gap: COL_GAP})
    this.pane = col

    this.addHeader(col)
    this.addTabs(col)
    this.roomTitle = this.addTextRow(col, "RoomTitle", "", "Heading", TITLE_H, HorizontalAlignment.Left, this.textColor)

    // Fixed-height block so the ring and footer stay put for 4-, 5- and 6-task rooms.
    const rowsBlock = this.flexChild(col, {w: INNER_W, h: ROWS_BLOCK_H}, (block) => {
      block.name = "TaskRows"
      const f = this.newFlex(block)
      f.width = INNER_W
      f.height = ROWS_BLOCK_H
      f.direction = FlexDirection.Column
      f.alignItems = FlexAlign.Stretch
      f.justifyContent = FlexJustify.Start
      f.rowGap = ROW_GAP
    })
    this.rowsHost = rowsBlock

    this.addRingAndClock(col)
    this.addButtonRow(
      col,
      [
        {name: "FlagIssueButton", label: this.flagLabel(), onTap: () => this.toggleFlagMenu(), keep: (t) => (this.flagButtonLabel = t)},
        {name: "EndJobButton", label: "End job", onTap: () => this.endJob()},
      ],
      (INNER_W - 0.6) / 2,
      FOOT_H,
    )

    this.showRoom(this.state.currentRoom)
    this.refreshClock(true)
  }

  /** Header: small bold "Job Lens" at the left, grab handle pill in the middle. */
  private addHeader(col: SceneObject) {
    this.flexChild(col, {w: INNER_W, h: HEADER_H}, (cell) => {
      cell.name = "HeaderRow"
      const titleW = 10
      const title = this.makeText(cell, "AppTitle", "Job Lens", "AppTitle", titleW, HEADER_H, HorizontalAlignment.Left, this.textColor)
      title.getSceneObject().getTransform().setLocalPosition(new vec3(-INNER_W / 2 + titleW / 2, 0, 0))

      // Grab handle: pinch-and-drag moves the whole panel (the Frame's own border drags it too).
      const w = 10
      const h = 1.0
      const bar = this.plate(cell, "Handle", w, h, HANDLE_COLOR, null, h / 2, true)
      const collider = bar.createComponent("Physics.ColliderComponent") as ColliderComponent
      const shape = Shape.createBoxShape()
      shape.size = new vec3(w + 2, h + 1.6, 1.5)
      collider.shape = shape
      bar.createComponent(Interactable.getTypeName())
      const manip = bar.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
      manip.setManipulateRoot(this.sceneObject.getTransform())
      manip.setCanRotate(false)
      manip.setCanScale(false)
    })
  }

  private addTabs(col: SceneObject) {
    const rooms = this.state.rooms
    const tabW = (INNER_W - TAB_GAP * (rooms.length - 1)) / rooms.length
    this.flexChild(col, {w: INNER_W, h: TAB_H}, (rowObj) => {
      rowObj.name = "RoomTabs"
      const f = this.newFlex(rowObj)
      f.width = INNER_W
      f.height = TAB_H
      f.direction = FlexDirection.Row
      f.alignItems = FlexAlign.Center
      f.justifyContent = FlexJustify.Start
      f.columnGap = TAB_GAP
      for (let i = 0; i < rooms.length; i++) {
        const roomIndex = i
        this.flexChild(rowObj, {w: tabW, h: TAB_H}, (cell) => {
          cell.name = "Tab-" + rooms[i].name
          const btn = cell.createComponent(Button.getTypeName()) as Button
          btn.size = new vec3(tabW, TAB_H, 1)
          btn.setIsToggleable(true)
          this.styleButton(btn, BUTTON_PALETTE)
          const label = this.makeText(cell, "TabLabel", rooms[i].name, "Tab", tabW - 0.6, TAB_H, HorizontalAlignment.Center, this.textColor)
          label.getSceneObject().getTransform().setLocalPosition(new vec3(0, 0, BUTTON_LABEL_Z))
          const check = this.addImage(cell, "TabCheck", ICON_CHECK, 1.4, this.doneColor)
          check.getTransform().setLocalPosition(new vec3(-tabW / 2 + 1.1, 0, BUTTON_LABEL_Z))
          check.enabled = false
          btn.onTriggerUp.add(() => this.queue(() => this.showRoom(roomIndex)))
          this.tabButtons.push(btn)
          this.tabLabels.push(label)
          this.tabChecks.push(check)
        })
      }
    })
  }

  /** Switch the panel to a room: rebuild the task rows, refresh tabs and title. */
  private showRoom(roomIndex: number) {
    this.state.currentRoom = roomIndex
    if (!this.rowsHost) return
    // Destroy-and-rebuild so the rows FlexLayout re-discovers its children.
    const rowsLayout = this.rowsHost.getComponent(FlexLayout.getTypeName()) as FlexLayout
    const old = this.rowsHost.children.slice()
    const oldItems: FlexItem[] = []
    for (const c of old) {
      if (!c.enabled) continue // already retired
      const item = c.getComponent(FlexItem.getTypeName()) as FlexItem | null
      if (item) oldItems.push(item)
      this.retire(c)
    }
    if (oldItems.length > 0) rowsLayout.removeItems(oldItems)
    const room = this.state.rooms[roomIndex]
    const iconSize = 2.4
    const iconX = -INNER_W / 2 + 2.2
    const labelW = INNER_W - 5.6
    const labelX = -INNER_W / 2 + 4.4 + labelW / 2
    for (let t = 0; t < room.tasks.length; t++) {
      const taskIndex = t
      this.flexChild(this.rowsHost, {w: INNER_W, h: ROW_H}, (cell) => {
        cell.name = "Task-" + room.tasks[t]
        const done = this.state.isTaskDone(roomIndex, taskIndex)
        const btn = cell.createComponent(Button.getTypeName()) as Button
        btn.size = new vec3(INNER_W, ROW_H, 1)
        btn.setIsToggleable(true)
        btn.isOn = done
        this.styleButton(btn, ROW_PALETTE)
        // Unchecked: empty circle. Checked: green check, dimmed label, muted row fill.
        const empty = this.addImage(cell, "TaskEmpty", ICON_EMPTY, iconSize, new vec4(1, 1, 1, 0.85))
        empty.getTransform().setLocalPosition(new vec3(iconX, 0, BUTTON_LABEL_Z))
        empty.enabled = !done
        const check = this.addImage(cell, "TaskCheck", ICON_CHECK, iconSize, this.doneColor)
        check.getTransform().setLocalPosition(new vec3(iconX, 0, BUTTON_LABEL_Z))
        check.enabled = done
        const label = this.makeText(cell, "TaskLabel", room.tasks[t], "Row", labelW, ROW_H, HorizontalAlignment.Left, done ? this.dimTextColor : this.textColor)
        label.getSceneObject().getTransform().setLocalPosition(new vec3(labelX, 0, BUTTON_LABEL_Z))
        btn.onTriggerUp.add(() => this.onTaskPinched(roomIndex, taskIndex, btn, check, empty, label))
      })
    }
    rowsLayout.markDirty()
    this.refreshTabs()
    this.refreshProgress()
  }

  private onTaskPinched(roomIndex: number, taskIndex: number, btn: Button, check: SceneObject, empty: SceneObject, label: Text) {
    const result = this.state.toggleTask(roomIndex, taskIndex)
    btn.isOn = result.done
    check.enabled = result.done
    empty.enabled = !result.done
    label.textFill.color = result.done ? this.dimTextColor : this.textColor
    this.refreshTabs()
    this.refreshProgress()
    if (result.roomCompleted) {
      const roomName = this.state.rooms[roomIndex].name
      this.showToast(roomName + " done")
      if (result.nextRoom !== roomIndex) this.queue(() => this.showRoom(result.nextRoom))
    }
  }

  private refreshTabs() {
    for (let i = 0; i < this.tabButtons.length; i++) {
      const done = this.state.isRoomDone(i)
      this.tabButtons[i].isOn = i === this.state.currentRoom
      this.tabChecks[i].enabled = done
      this.tabLabels[i].textFill.color = done ? this.doneColor : this.textColor
      this.tabLabels[i].getSceneObject().getTransform().setLocalPosition(new vec3(done ? 0.6 : 0, 0, BUTTON_LABEL_Z))
    }
    if (this.roomTitle) {
      const r = this.state.currentRoom
      this.roomTitle.text = `${this.state.rooms[r].name}  ·  ${this.state.roomDoneCount(r)} of ${this.state.roomTotal(r)} done`
    }
  }

  private refreshProgress() {
    const done = this.state.totalDone()
    const filled = done * RING_SEGMENTS_PER_TASK
    for (let i = 0; i < this.ringDotObjs.length; i++) {
      this.ringDotObjs[i].enabled = i < filled
    }
    if (this.ringCenter) this.ringCenter.text = `${done}/${this.state.totalTasks()}`
  }

  private addRingAndClock(col: SceneObject) {
    this.flexChild(col, {w: INNER_W, h: RING_ROW_H}, (rowObj) => {
      rowObj.name = "ProgressRow"
      const f = this.newFlex(rowObj)
      f.width = INNER_W
      f.height = RING_ROW_H
      f.direction = FlexDirection.Row
      f.alignItems = FlexAlign.Center
      f.justifyContent = FlexJustify.Start
      f.columnGap = 1.4
      f.paddingLeft = 0.4

      this.flexChild(rowObj, {w: RING_BOX, h: RING_BOX}, (ring) => {
        ring.name = "ProgressRing"
        const total = this.state.totalTasks()
        const segments = total * RING_SEGMENTS_PER_TASK
        // Track: a border-only circle plate (smooth). Fill: dense dots along the band,
        // clockwise from 12 o'clock so the ring "fills up" the way a clock face reads.
        const track = this.obj(ring, "RingTrack")
        const rr = track.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
        rr.initialize()
        rr.blendMode = RoundedRectBlendMode.Normal
        rr.cornerRadius = RING_OUTER / 2
        rr.gradient = false
        rr.backgroundColor = new vec4(0, 0, 0, 0)
        rr.border = true
        rr.borderSize = RING_WIDTH
        rr.borderColor = this.ringEmptyColor
        rr.size = new vec2(RING_OUTER, RING_OUTER)
        this.ringDots = []
        this.ringDotObjs = []
        for (let i = 0; i < segments; i++) {
          const a = Math.PI / 2 - (i / segments) * Math.PI * 2
          const dot = this.addImage(ring, "RingDot", ICON_DOT, RING_DOT, this.doneColor)
          dot.getTransform().setLocalPosition(new vec3(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0.05))
          dot.enabled = false
          const img = dot.getComponent("Component.Image") as Image
          this.ringDots.push(img.mainMaterial)
          this.ringDotObjs.push(dot)
        }
        this.ringCenter = this.makeText(ring, "RingCount", "0/" + total, "Ring", RING_BOX - 1.6, 2.0, HorizontalAlignment.Center, this.textColor)
      })

      const w = INNER_W - RING_BOX - 1.8
      this.flexChild(rowObj, {w, h: RING_ROW_H, grow: 1}, (clock) => {
        clock.name = "Clock"
        const cf = this.newFlex(clock)
        cf.width = -1
        cf.height = RING_ROW_H
        cf.direction = FlexDirection.Column
        cf.alignItems = FlexAlign.Stretch
        cf.justifyContent = FlexJustify.Center
        cf.rowGap = 0.2
        this.usedText = this.addTextRow(clock, "UsedTime", "Used 0:00", "Clock", 1.9, HorizontalAlignment.Left, this.dimTextColor, w)
        this.leftText = this.addTextRow(clock, "LeftTime", "Left 2:30:00", "ClockBig", 3.0, HorizontalAlignment.Left, this.textColor, w)
      })
    })
  }

  private refreshClock(force: boolean = false) {
    if (!this.usedText || !this.leftText) return
    const used = "Used " + this.state.usedLabel()
    const left = (this.state.isOverTime ? "" : "Left ") + this.state.leftLabel()
    if (force || used !== this.lastUsedLabel) {
      this.usedText.text = used
      this.lastUsedLabel = used
    }
    if (force || left !== this.lastLeftLabel) {
      this.leftText.text = left
      this.leftText.textFill.color = this.state.isUnderWarning ? this.warnColor : this.textColor
      this.lastLeftLabel = left
    }
  }

  // ── Flag issue menu ────────────────────────────────────────────────────────

  private flagLabel(): string {
    return `Flag issue (${this.state.flags.length})`
  }

  private toggleFlagMenu() {
    if (!this.flagMenu) {
      this.buildFlagMenu() // built on first use, and shown
      return
    }
    this.flagMenu.enabled = !this.flagMenu.enabled
  }

  /** Top edge (y) of the task rows block. The column packs from the top: header, tabs,
   *  title (each followed by COL_GAP), then the rows block. */
  private rowsTopY(): number {
    const top = CHECKLIST_H / 2 - PAD
    return top - (HEADER_H + TAB_H + TITLE_H + COL_GAP * 3)
  }

  /** Centre (y) of a span of whole rows starting at row index `first`. Overlays are sized
   *  to whole rows so they never cut a neighbouring label in half. */
  private rowSpanCenterY(first: number, count: number): number {
    const spanTop = this.rowsTopY() - first * (ROW_H + ROW_GAP)
    return spanTop - (count * ROW_H + (count - 1) * ROW_GAP) / 2
  }

  private rowSpanHeight(count: number): number {
    return count * ROW_H + (count - 1) * ROW_GAP + ROW_GAP // eats half a gap each side
  }

  private buildFlagMenu() {
    const menuW = INNER_W
    const padX = 1.0
    const btnW = (menuW - padX * 2 - 0.6) / 2
    const btnH = 6.0
    const capH = 2.6
    const menuH = this.rowSpanHeight(4) // covers rows 1-4 exactly
    const padY = (menuH - (capH + 0.5 + btnH * 2 + 0.6)) / 2
    const menu = this.plate(this.content, "FlagMenu", menuW, menuH, OVERLAY_BG, OVERLAY_BORDER, 1.4, false, OVERLAY_ORDER)
    menu.getTransform().setLocalPosition(new vec3(0, this.rowSpanCenterY(1, 4), OVERLAY_Z))

    const inner = this.obj(menu, "FlagMenuInner", new vec3(0, 0, CONTENT_Z))
    const col = this.newFlex(inner)
    col.width = menuW
    col.height = menuH
    col.direction = FlexDirection.Column
    col.alignItems = FlexAlign.Stretch
    col.justifyContent = FlexJustify.Start
    col.rowGap = 0.5
    col.paddingTop = padY
    col.paddingBottom = padY
    col.paddingLeft = padX
    col.paddingRight = padX

    const title = this.addTextRow(inner, "FlagMenuTitle", "What did you find?", "Heading", capH, HorizontalAlignment.Center, this.textColor, menuW - padX * 2)
    title.renderOrder = OVERLAY_ORDER + 2
    const presets = FLAG_PRESETS
    for (let r = 0; r < 2; r++) {
      const pair = presets.slice(r * 2, r * 2 + 2)
      this.addButtonRow(
        inner,
        pair.map((p) => ({name: "Flag-" + p, label: p, onTap: () => this.logFlag(p)})),
        btnW,
        btnH,
        0.6,
        menuW - padX * 2,
        "Body",
        OVERLAY_ORDER + 1,
      )
    }
    this.flagMenu = menu
  }

  private logFlag(label: string) {
    this.state.addFlag(label)
    if (this.flagMenu) this.flagMenu.enabled = false
    if (this.flagButtonLabel) this.flagButtonLabel.text = this.flagLabel()
    this.showToast(label + " logged")
  }

  // ── Toast (fades after ~2 s) ───────────────────────────────────────────────

  private showToast(message: string) {
    if (!this.toastRoot) {
      const w = INNER_W
      const h = this.rowSpanHeight(1)
      this.toastRoot = this.plate(this.content, "Toast", w, h, OVERLAY_BG, OVERLAY_BORDER, 1.4, false, OVERLAY_ORDER + 3)
      this.toastText = this.makeText(this.toastRoot, "ToastText", "", "Heading", w - 1, h, HorizontalAlignment.Center, this.textColor)
      this.toastText.renderOrder = OVERLAY_ORDER + 4
      this.toastText.getSceneObject().getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))
    }
    // Sit exactly over one task row (the third, or the last in a short room) so no
    // neighbouring label is cut in half.
    const rows = this.state.rooms[this.state.currentRoom].tasks.length
    const row = Math.min(2, rows - 1)
    this.toastRoot.getTransform().setLocalPosition(new vec3(0, this.rowSpanCenterY(row, 1), OVERLAY_Z + 0.3))
    this.toastText!.text = message
    this.toastText!.textFill.color = this.textColor
    this.toastAge = 0
    this.toastRoot.enabled = true
  }

  // ── Summary card ───────────────────────────────────────────────────────────

  private endJob() {
    this.state.endJob()
    this.queue(() => this.showPhase("summary"))
  }

  private buildSummary() {
    const flags = this.state.flags
    const lines = Math.min(flags.length, MAX_SUMMARY_LINES) + (flags.length > MAX_SUMMARY_LINES ? 1 : 0)
    const h = SUMMARY_BASE_H + Math.max(1, lines) * (SUMMARY_LINE_H + SUMMARY_GAP)
    this.frame.innerSize = new vec2(PANEL_W, h)
    const col = this.column(this.content, "SummaryCard", h, {gap: SUMMARY_GAP})
    this.pane = col

    this.addTextRow(col, "SummaryTitle", "Job summary", "CardTitle", 3.8, HorizontalAlignment.Center, this.textColor)
    this.addSpacer(col, 0.6)
    this.addTextRow(col, "SummaryTasks", `Tasks done ${this.state.totalDone()} of ${this.state.totalTasks()}`, "Heading", 3.0, HorizontalAlignment.Left, this.textColor)
    const booked = JobLensState.formatClock(this.state.bookedSeconds)
    const over = this.state.isOverTime ? `  (over by ${JobLensState.formatClock(-this.state.timeLeftSeconds)})` : ""
    this.addTextRow(col, "SummaryTime", `Time used ${this.state.usedLabel()} of ${booked} booked${over}`, "Body", 2.6, HorizontalAlignment.Left, this.state.isOverTime ? this.warnColor : this.textColor)
    this.addSpacer(col, 0.8)
    this.addTextRow(col, "SummaryIssuesTitle", `Issues flagged (${flags.length})`, "Subheading", 2.6, HorizontalAlignment.Left, this.textColor)
    if (flags.length === 0) {
      this.addTextRow(col, "SummaryIssue-none", "No issues flagged", "Body", SUMMARY_LINE_H, HorizontalAlignment.Left, this.dimTextColor)
    }
    for (let i = 0; i < Math.min(flags.length, MAX_SUMMARY_LINES); i++) {
      const f = flags[i]
      this.addTextRow(col, "SummaryIssue-" + i, `${f.label}  ·  ${f.room}  ·  ${JobLensState.formatClock(f.jobSeconds)}`, "Body", SUMMARY_LINE_H, HorizontalAlignment.Left, this.textColor)
    }
    if (flags.length > MAX_SUMMARY_LINES) {
      this.addTextRow(col, "SummaryIssue-more", `+${flags.length - MAX_SUMMARY_LINES} more`, "Body", SUMMARY_LINE_H, HorizontalAlignment.Left, this.dimTextColor)
    }
    this.addSpacer(col, 0.8)
    this.addButtonRow(col, [{name: "NewJobButton", label: "New job", onTap: () => this.newJob()}], BIG_BUTTON_W, BIG_BUTTON_H)
  }

  private newJob() {
    this.state.reset()
    this.queue(() => this.showPhase("start"))
  }

  // ── Layout helpers ─────────────────────────────────────────────────────────

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    if (position) so.getTransform().setLocalPosition(position)
    return so
  }

  /** A flat rounded plate (handle pill, flag menu, toast) in our palette. */
  private plate(parent: SceneObject, name: string, w: number, h: number, bg: vec4, border: vec4 | null, cornerRadius: number, alphaBlend: boolean = false, renderOrder: number = 0): SceneObject {
    const so = this.obj(parent, name)
    const rr = so.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    rr.initialize()
    rr.renderOrder = renderOrder
    if (alphaBlend) rr.blendMode = RoundedRectBlendMode.Normal
    rr.cornerRadius = cornerRadius
    rr.gradient = false
    rr.backgroundColor = bg
    if (border) {
      rr.border = true
      rr.borderSize = 0.12
      rr.borderColor = border
    }
    rr.size = new vec2(w, h)
    return so
  }

  /** Recolour a UI Kit button's rounded-rect visual for every interaction state.
   *  The SnapOS2 theme paints buttons with gradients and re-applies them on every
   *  state change, so each state gets a flat gradient in our colour instead. */
  private styleButton(btn: Button, p: ButtonPalette) {
    const apply = () => {
      const v = btn.visual as RoundedRectangleVisual | undefined
      if (!v) return
      v.defaultGradient = flatGradient(p.normal)
      v.hoveredGradient = flatGradient(p.hover)
      v.triggeredGradient = flatGradient(p.press)
      v.toggledDefaultGradient = flatGradient(p.on)
      v.toggledHoveredGradient = flatGradient(p.onHover)
      v.toggledTriggeredGradient = flatGradient(p.onPress)
      v.inactiveGradient = flatGradient(p.normal)
      // Borders are gradient-driven in the theme too (gold when toggled); flatten them.
      v.borderDefaultColor = BUTTON_EDGE
      v.borderHoveredColor = BUTTON_EDGE_HOVER
      v.borderTriggeredColor = BUTTON_EDGE_HOVER
      v.borderToggledDefaultColor = p.onEdge
      v.borderToggledHoveredColor = BUTTON_EDGE_HOVER
      v.borderToggledTriggeredColor = BUTTON_EDGE_HOVER
      v.borderInactiveColor = BUTTON_EDGE
      v.borderDefaultGradient = flatGradient(BUTTON_EDGE)
      v.borderHoveredGradient = flatGradient(BUTTON_EDGE_HOVER)
      v.borderTriggeredGradient = flatGradient(BUTTON_EDGE_HOVER)
      v.borderToggledDefaultGradient = flatGradient(p.onEdge)
      v.borderToggledHoveredGradient = flatGradient(BUTTON_EDGE_HOVER)
      v.borderToggledTriggeredGradient = flatGradient(BUTTON_EDGE_HOVER)
      v.borderInactiveGradient = flatGradient(BUTTON_EDGE)
      // Paint the resting colour now rather than tweening up from theme grey.
      const rr = (v as unknown as {roundedRectangle: RoundedRectangle}).roundedRectangle
      if (rr) rr.setBackgroundGradient(flatGradient(btn.isOn ? p.on : p.normal))
    }
    if (btn.initialized) apply()
    else btn.onInitialized.add(apply)
  }

  /** Full-width column pane inside the Frame content area. */
  private column(parent: SceneObject, name: string, height: number, opts: {gap: number}): SceneObject {
    const col = this.obj(parent, name)
    const f = this.newFlex(col)
    f.width = PANEL_W
    f.height = height
    f.direction = FlexDirection.Column
    f.alignItems = FlexAlign.Stretch
    f.justifyContent = FlexJustify.Start
    f.rowGap = opts.gap
    f.paddingTop = PAD
    f.paddingBottom = PAD
    f.paddingLeft = PAD
    f.paddingRight = PAD
    return col
  }

  /** Create a FlexLayout that is fed by explicit addItems (auto-discovery only works for pre-start children). */
  private newFlex(host: SceneObject): FlexLayout {
    const f = host.createComponent(FlexLayout.getTypeName()) as FlexLayout
    f.autoDiscoverItemsOnStart = false
    return f
  }

  /** Child cell of a FlexLayout host. Registers the FlexItem explicitly (mandatory). */
  private flexChild(parent: SceneObject, size: {w?: number; h?: number; grow?: number}, builder: (cell: SceneObject) => void): SceneObject {
    const cell = this.obj(parent, "Item")
    const item = cell.createComponent(FlexItem.getTypeName()) as FlexItem
    if (size.w !== undefined && size.w > 0) item.overrideWidth = size.w
    if (size.h !== undefined && size.h > 0) item.overrideHeight = size.h
    item.flexGrow = size.grow ?? 0
    item.flexShrink = 0
    builder(cell)
    const layout = parent.getComponent(FlexLayout.getTypeName()) as FlexLayout | null
    if (layout) layout.addItems([item])
    return cell
  }

  /** Vertical breathing room between sections of a column. */
  private addSpacer(col: SceneObject, h: number) {
    this.flexChild(col, {w: INNER_W, h}, (cell) => (cell.name = "Spacer"))
  }

  private makeText(parent: SceneObject, name: string, str: string, role: TextRole, w: number, h: number, hAlign: HorizontalAlignment, color: vec4): Text {
    return this.textOn(this.obj(parent, name), str, role, w, h, hAlign, color)
  }

  /** Attach a Component.Text to an existing SceneObject (a layout cell gets the TextHandler this way). */
  private textOn(so: SceneObject, str: string, role: TextRole, w: number, h: number, hAlign: HorizontalAlignment, color: vec4): Text {
    const t = so.createComponent("Component.Text") as Text
    t.text = str
    t.depthTest = true
    applyTextRole(t, role)
    t.horizontalAlignment = hAlign
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
    t.textFill.color = color
    return t
  }

  /** A text row in a column: stretches to the column width so alignment is honoured. */
  private addTextRow(col: SceneObject, name: string, str: string, role: TextRole, h: number, hAlign: HorizontalAlignment, color: vec4, width?: number): Text {
    let text!: Text
    this.flexChild(col, {w: width, h}, (cell) => {
      // The Text lives ON the cell so the layout's TextHandler sizes its rect to the
      // allocated cell (a child-only Text would hit the no-handler fallback, which
      // scales the cell by allocatedWidth / 1 cm and smears the glyphs).
      cell.name = name
      const w = width ?? INNER_W
      text = this.textOn(cell, str, role, w, h, hAlign, color)
    })
    const item = text.getSceneObject().getComponent(FlexItem.getTypeName()) as FlexItem
    if (width === undefined) item.alignSelf = FlexAlignSelf.Stretch
    return text
  }

  private addImage(parent: SceneObject, name: string, tex: Texture, size: number, color: vec4): SceneObject {
    const so = this.obj(parent, name)
    const img = so.createComponent("Component.Image") as Image
    const mat = this.imageMaterial.clone()
    mat.mainPass.baseTex = tex
    mat.mainPass.baseColor = color
    mat.mainPass.depthTest = true
    mat.mainPass.depthWrite = false
    img.clearMaterials()
    img.addMaterial(mat)
    so.getTransform().setLocalScale(new vec3(size, size, 1))
    return so
  }

  /** A centred row of equally sized buttons with raw text labels (width-budgeted). */
  private addButtonRow(
    col: SceneObject,
    buttons: {name: string; label: string; onTap: () => void; keep?: (label: Text) => void}[],
    btnW: number,
    btnH: number,
    gap: number = 0.6,
    rowW: number = INNER_W,
    labelRole: TextRole = "Button",
    renderOrder: number = 0,
  ) {
    this.flexChild(col, {w: rowW, h: btnH}, (rowObj) => {
      rowObj.name = "ButtonRow"
      const f = this.newFlex(rowObj)
      f.width = rowW
      f.height = btnH
      f.direction = FlexDirection.Row
      f.alignItems = FlexAlign.Center
      f.justifyContent = FlexJustify.Center
      f.columnGap = gap
      for (const b of buttons) {
        this.flexChild(rowObj, {w: btnW, h: btnH}, (cell) => {
          cell.name = b.name
          const btn = cell.createComponent(Button.getTypeName()) as Button
          btn.size = new vec3(btnW, btnH, 1)
          btn.renderOrder = renderOrder
          this.styleButton(btn, BUTTON_PALETTE)
          const label = this.makeText(cell, "Label", b.label, labelRole, btnW - 0.6, btnH, HorizontalAlignment.Center, this.textColor)
          label.renderOrder = renderOrder + 1
          label.getSceneObject().getTransform().setLocalPosition(new vec3(0, 0, BUTTON_LABEL_Z))
          if (b.keep) b.keep(label)
          btn.onTriggerUp.add(() => b.onTap())
        })
      }
    })
  }
}
