// Job Lens — hard-coded sample job data (devpost/design-brief.md → "Sample job data").
// One sample job, no persistence, no backend. Edit here to change rooms or tasks.

export interface RoomDef {
  name: string
  tasks: string[]
}

export const ROOMS: RoomDef[] = [
  {
    name: "Kitchen",
    tasks: [
      "Wipe counters",
      "Clean stovetop",
      "Clean microwave inside",
      "Wipe cabinet fronts",
      "Clean sink",
      "Mop floor",
    ],
  },
  {
    name: "Bathroom",
    tasks: ["Clean toilet", "Clean shower and tub", "Clean sink and mirror", "Wipe counters", "Mop floor"],
  },
  {
    name: "Bedroom",
    tasks: ["Make bed", "Dust surfaces", "Empty trash", "Vacuum floor"],
  },
  {
    name: "Living room",
    tasks: ["Dust surfaces", "Wipe tables", "Tidy and straighten", "Vacuum floor"],
  },
]

/** Booked job length: 2 h 30 min. */
export const BOOKED_SECONDS = 2 * 3600 + 30 * 60

/** Time-left turns a warmer colour under this many seconds (15 min). */
export const WARN_SECONDS = 15 * 60

/** The four big preset buttons in the Flag issue menu. */
export const FLAG_PRESETS = ["Stain", "Broken item", "Supplies low", "Pet or safety hazard"]

export const JOB_TITLE = "Job Lens"
// Two balanced lines on the Start card (explicit break; the text row does not wrap).
export const JOB_DESCRIPTION = "Sample job  ·  3 rooms + living room\nBooked 2h30"
