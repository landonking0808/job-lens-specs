// Job Lens — hint arrow. Lives under the camera. When the parked panel is out
// of view, a small arrow at the edge of the view points toward it. No sound.
// (devpost/design-brief.md → "Hint arrow")

const ICON_ARROW = requireAsset("../Icons/arrow_forward.png") as Texture

@component
export class JobLensHintArrow extends BaseScriptComponent {
  @ui.label("Job Lens — Hint Arrow")
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("The parked checklist panel (root SceneObject with the Frame).")
  panel!: SceneObject

  @input
  @hint("Image material (UI Kit Image.mat) cloned for the arrow glyph.")
  imageMaterial!: Material

  @input
  @hint("Distance in front of the eyes where the arrow floats, in cm.")
  @widget(new SliderWidget(30, 120, 1))
  arrowDistanceCm: number = 60

  @input
  @hint("Arrow size in cm.")
  @widget(new SliderWidget(1, 8, 0.1))
  arrowSizeCm: number = 3.0

  @input
  @hint("Half-width of the comfortable view at arrowDistanceCm, in cm. The arrow parks on this edge.")
  @widget(new SliderWidget(5, 40, 0.5))
  edgeHalfWidthCm: number = 13

  @input
  @hint("Half-height of the comfortable view at arrowDistanceCm, in cm.")
  @widget(new SliderWidget(5, 40, 0.5))
  edgeHalfHeightCm: number = 9

  @input
  @hint("Horizontal half-angle (degrees) inside which the panel counts as 'in view'.")
  @widget(new SliderWidget(5, 45, 1))
  inViewHalfAngleX: number = 22

  @input
  @hint("Vertical half-angle (degrees) inside which the panel counts as 'in view'.")
  @widget(new SliderWidget(5, 45, 1))
  inViewHalfAngleY: number = 16

  @input
  @widget(new ColorWidget())
  @hint("Arrow tint. Keep it light: black renders transparent on Specs.")
  arrowColor: vec4 = new vec4(1, 1, 1, 0.9)
  @ui.group_end

  private arrowObj!: SceneObject
  private arrowImage!: Image
  private visible = false

  onAwake() {
    this.arrowObj = global.scene.createSceneObject("HintArrow")
    this.arrowObj.setParent(this.sceneObject)
    this.arrowImage = this.arrowObj.createComponent("Component.Image") as Image
    const mat = this.imageMaterial.clone()
    mat.mainPass.baseTex = ICON_ARROW
    mat.mainPass.baseColor = this.arrowColor
    mat.mainPass.depthTest = false // always readable, it is a HUD hint
    mat.mainPass.depthWrite = false
    this.arrowImage.clearMaterials()
    this.arrowImage.addMaterial(mat)
    this.arrowObj.getTransform().setLocalScale(new vec3(this.arrowSizeCm, this.arrowSizeCm, 1))
    this.setVisible(false)

    this.createEvent("UpdateEvent").bind(() => this.update())
  }

  /** True while the arrow is showing (read by LEAF). */
  get isShowing(): boolean {
    return this.visible
  }

  private setVisible(v: boolean) {
    this.visible = v
    this.arrowObj.enabled = v
  }

  private update() {
    if (isNull(this.panel) || !this.panel.enabled) {
      this.setVisible(false)
      return
    }
    // Panel position in this object's (camera) local space. Camera looks down -Z.
    const camT = this.sceneObject.getTransform()
    const inv = camT.getInvertedWorldTransform()
    const p = inv.multiplyPoint(this.panel.getTransform().getWorldPosition())

    const behind = p.z > -1
    const depth = Math.max(1, -p.z)
    const angX = (Math.atan2(Math.abs(p.x), depth) * 180) / Math.PI
    const angY = (Math.atan2(Math.abs(p.y), depth) * 180) / Math.PI
    const inView = !behind && angX <= this.inViewHalfAngleX && angY <= this.inViewHalfAngleY

    if (inView) {
      this.setVisible(false)
      return
    }

    // Direction toward the panel in the view plane.
    let dx = p.x
    let dy = p.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.001) {
      dx = 0
      dy = behind ? -1 : 1
    } else {
      dx /= len
      dy /= len
    }
    // Park the arrow on the edge ellipse of the comfortable view.
    const ex = dx * this.edgeHalfWidthCm
    const ey = dy * this.edgeHalfHeightCm
    const t = this.arrowObj.getTransform()
    t.setLocalPosition(new vec3(ex, ey, -this.arrowDistanceCm))
    // arrow_forward points +X; roll it to point along (dx, dy).
    const roll = Math.atan2(dy, dx)
    t.setLocalRotation(quat.angleAxis(roll, vec3.forward()))
    this.setVisible(true)
  }
}
