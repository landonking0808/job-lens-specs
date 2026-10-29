// Job Lens — pure job state. No scene objects, no UI Kit: just the checklist,
// the clock and the issue log. JobLensPanel renders it; LEAF scenarios read it.

import {BOOKED_SECONDS, ROOMS, RoomDef, WARN_SECONDS} from "./JobLensData"

export type JobPhase = "start" | "job" | "summary"

export interface FlagEntry {
  label: string
  room: string
  /** Job clock (seconds since Start job) when the issue was flagged. */
  jobSeconds: number
}

export interface ToggleResult {
  /** New done state of the task that was pinched. */
  done: boolean
  /** True when this pinch checked the last open task in the room. */
  roomCompleted: boolean
  /** Room the panel should show next (unchanged unless roomCompleted). */
  nextRoom: number
}

export class JobLensState {
  phase: JobPhase = "start"
  currentRoom = 0
  elapsedSeconds = 0
  flags: FlagEntry[] = []
  private done: boolean[][] = []

  constructor(
    public readonly rooms: RoomDef[] = ROOMS,
    public readonly bookedSeconds: number = BOOKED_SECONDS,
    public readonly warnSeconds: number = WARN_SECONDS,
  ) {
    this.reset()
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  reset(): void {
    this.phase = "start"
    this.currentRoom = 0
    this.elapsedSeconds = 0
    this.flags = []
    this.done = this.rooms.map((r) => r.tasks.map(() => false))
  }

  startJob(): void {
    this.reset()
    this.phase = "job"
  }

  endJob(): void {
    this.phase = "summary"
  }

  /** Advance the real-time clock. Only counts while the job runs. */
  tick(dtSeconds: number): void {
    if (this.phase === "job") this.elapsedSeconds += dtSeconds
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  isTaskDone(room: number, task: number): boolean {
    return this.done[room][task]
  }

  roomDoneCount(room: number): number {
    return this.done[room].filter((d) => d).length
  }

  roomTotal(room: number): number {
    return this.rooms[room].tasks.length
  }

  isRoomDone(room: number): boolean {
    return this.roomDoneCount(room) === this.roomTotal(room)
  }

  totalDone(): number {
    let n = 0
    for (let r = 0; r < this.rooms.length; r++) n += this.roomDoneCount(r)
    return n
  }

  totalTasks(): number {
    let n = 0
    for (let r = 0; r < this.rooms.length; r++) n += this.roomTotal(r)
    return n
  }

  /** Pinch a task row: check it, or uncheck it if already checked. */
  toggleTask(room: number, task: number): ToggleResult {
    const now = !this.done[room][task]
    this.done[room][task] = now
    const roomCompleted = now && this.isRoomDone(room)
    let nextRoom = room
    if (roomCompleted) {
      const next = this.nextUnfinishedRoom(room)
      if (next >= 0) nextRoom = next
    }
    return {done: now, roomCompleted, nextRoom}
  }

  /** Next room after `from` (wrapping) that still has open tasks, or -1 when every room is done. */
  nextUnfinishedRoom(from: number): number {
    for (let i = 1; i <= this.rooms.length; i++) {
      const idx = (from + i) % this.rooms.length
      if (!this.isRoomDone(idx)) return idx
    }
    return -1
  }

  // ── Issues ─────────────────────────────────────────────────────────────────

  addFlag(label: string): FlagEntry {
    const entry: FlagEntry = {
      label,
      room: this.rooms[this.currentRoom].name,
      jobSeconds: this.elapsedSeconds,
    }
    this.flags.push(entry)
    return entry
  }

  // ── Clock ──────────────────────────────────────────────────────────────────

  get timeLeftSeconds(): number {
    return this.bookedSeconds - this.elapsedSeconds
  }

  get isOverTime(): boolean {
    return this.timeLeftSeconds < 0
  }

  /** Under 15 minutes left (including overtime): time-left shows in the warm colour. */
  get isUnderWarning(): boolean {
    return this.timeLeftSeconds < this.warnSeconds
  }

  /** "M:SS" under an hour, "H:MM:SS" from one hour up. 0 → "0:00", 9000 → "2:30:00". */
  static formatClock(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number) => (n < 10 ? "0" + n : "" + n)
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
  }

  usedLabel(): string {
    return JobLensState.formatClock(this.elapsedSeconds)
  }

  /** Time left, or how far over the booked time once past zero. */
  leftLabel(): string {
    const left = this.timeLeftSeconds
    // Count down with ceil so it reads 2:30:00 until a whole second has passed.
    return left >= 0 ? JobLensState.formatClock(Math.ceil(left - 1e-6)) : "Over " + JobLensState.formatClock(-left)
  }
}
