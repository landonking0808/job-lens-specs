---
status: approved
---

# Design brief: Job Lens

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

Job Lens is a hands-free job checklist for house cleaners, made by Landon King for Wrenly Home, a small home-cleaning company starting up in the Peoria, Illinois area. During a clean your hands are gloved, wet, or holding a spray bottle and a cloth, so checking a checklist or the time on a phone means stopping, peeling off a glove, and touching a phone with dirty hands. Clients book a fixed time (like 2.5 hours) and expect every room done to a checklist, and things found on site (a stain, something broken, supplies running low) are easy to forget to report.

## The one spatial moment
I'm standing at the kitchen counter with gloves on and a cloth in one hand. I glance down and to the left, where the panel is parked next to the counter, and I pinch "Clean stovetop". It ticks, the ring fills up one step, and I can see I've got 1:40 left. I never take a glove off, and my eyes stay on the counter the rest of the time.

## Why it belongs on glasses
- Uses: leaves your body free (hands stay gloved and busy, eyes stay up on the work); draws in the world (the checklist is parked in the room beside the thing being cleaned, not held in a hand).
- Why it's better than the phone or laptop version: with a phone, every check-off means stopping, taking off a glove, and touching the phone with dirty hands. With glasses it's a glance and a pinch, and the checklist, timer and issue log stay beside the work for the whole job.

## Product or overlay
- Type: product. The checklist panel is the experience. It does not recognize or respond to anything real.
- What the real version would sense: nothing in this version. A future version might know which room you're in; this one does not. No object recognition.
- Stand-in for the preview: none needed for recognition. The room tabs along the top of the panel (Kitchen, Bathroom, Bedroom, Living room) are the stand-in for the glasses knowing which room you're in; the cleaner picks the room by pinching a tab. The panel is parked beside "the thing you're cleaning" by hand: it appears in front of the user at job start and the cleaner drags it where they want it with a handle.

## Where things live
- Where the user is looking during the main task: down at the counter, sink, or surface in front of them. They glance down and to the side to the panel only when they want to check something off or see the time.
- Checklist panel (one panel, the only thing on screen during the job): appears about 1 m in front of the user at job start, a little below eye level (about 15 cm below eye height `(default)`), facing the user, and stays anchored in the room right there until moved. It does not follow the user and never slides in front of what they're cleaning. About 32 cm wide (the learner asked for 30 to 35 cm) by 45 cm tall `(default)`, so it fits inside the usable view at 1 m. Colours: light or white text on mid-tone panels, never black or dark text or dark panel backgrounds, since black shows up as see-through on the glasses. Layout from top to bottom: room tabs; room title with done count; task rows; progress ring with time used and time left beside it; a Flag issue button and an End job button along the bottom `(default)`. The Flag issue button shows the running flag count in its label, like "Flag issue (1)".
- Handle: a grab handle on the panel (bar along the top edge `(default)`) so the cleaner can pinch and drag the whole panel next to whatever they're cleaning, and carry it to the next room.
- Hint arrow: when the panel is out of view, a small arrow at the edge of the view points toward where it's parked. No sound.
- Flag issue menu: a small menu that opens on the panel over the task rows `(default)`, with four big preset buttons: Stain, Broken item, Supplies low, Pet or safety hazard.
- Start card: appears about 1 m in front of the user, a little below eye level, at job launch. Text like "Sample job, 3 rooms plus living room, booked 2h30" and a Start job button.
- Summary card: replaces the checklist panel in the same spot when End job is pinched.
- Sample job data (hard-coded): booked time 2:30:00. Every room has 4 to 6 tasks. Kitchen (the learner's list): Wipe counters, Clean stovetop, Clean microwave inside, Wipe cabinet fronts, Clean sink, Mop floor. Bathroom `(default)`: Clean toilet, Clean shower and tub, Clean sink and mirror, Wipe counters, Mop floor. Bedroom `(default)`: Make bed, Dust surfaces, Empty trash, Vacuum floor. Living room `(default)`: Dust surfaces, Wipe tables, Tidy and straighten, Vacuum floor.

## Hands and input
- Check a task: pinch the task row. It ticks, the done count and the progress ring update.
- Uncheck a task: pinch the checked row again. The count and ring go back.
- Switch rooms: pinch a room tab along the top of the panel.
- Move the panel: pinch and drag the handle. The panel stays wherever it's dropped.
- Flag an issue: pinch Flag issue, then pinch one of the four presets. Two pinches total, no typing, no voice. The issue is logged with the current room and the job time, and the count on the Flag issue button goes up, like "Flag issue (1)".
- Start a job: pinch Start job on the Start card.
- End a job: pinch End job on the panel. Opens the summary card.
- New job: pinch New job on the summary card. Resets everything back to the Start card.
- Targets are big and highlight when aimed at. Task rows are at least 5 cm tall `(default)`.
- Only standard pinch interactions. No custom gestures, no two-hand gestures.
- Voice (if any) and the button that does the same job: none. No voice input.

## When things show
- Start card: shows at launch and after New job; hides when Start job is pinched.
- Checklist panel: shows when Start job is pinched; hides when End job is pinched. During the job it is the only thing on screen.
- Timer: always on the panel while the job runs. Shows time used (starts at 0:00) and time left (starts at 2:30:00) against the booked 2 hours 30. Runs in real time. When time left drops under 15 minutes, the time-left number changes to a warmer colour. Past zero, it shows how far over the booked time the job is. No pop-ups, no alarms, nothing that grabs attention while the cleaner isn't looking at the panel.
- Flag issue menu: shows when Flag issue is pinched; hides when a preset is pinched (or when Flag issue is pinched again `(default)`).
- Flag confirmation: a short confirmation (for example "Supplies low logged") shows after a preset is pinched and fades after about 2 seconds.
- Room done message: when the last task in a room is checked, that room's tab gets a check mark, a short "Kitchen done" style message shows and fades after about 2 seconds, and the panel moves on to the next room that isn't finished.
- Summary card: shows when End job is pinched; hides when New job is pinched. Shows tasks done out of total, time used versus the 2:30 booked, and every flagged issue with its room and the time it was flagged.
- If something needs attention out of view: a small arrow at the edge of the view pointing to the parked panel. No sound.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinching Start job on the Start card shows the Kitchen checklist with 0 out of its tasks done, and the timer starts at 0:00 used and 2:30:00 left and counts while tasks are checked off.
2. Pinching a task row checks it, and the done count and the progress ring update. Pinching it again unchecks it, and the count and ring go back.
3. Checking the last task in a room marks that room's tab as done and moves the panel to the next unfinished room. Pinching the room tabs switches between rooms.
4. Pinching Flag issue, then Supplies low, adds that issue with the current room and the job time, shows a confirmation that fades, and the count on the Flag issue button goes up to "Flag issue (1)".
5. Pinching End job shows a summary card with tasks done x out of y, time used versus the 2:30 booked, and the flagged issues listed with room and time. Pinching New job resets everything back to the Start card.

## Out of scope
- Recognizing which room the cleaner is in, or recognizing counters, stains, or any real object. Room tabs stand in for this.
- Sending the summary or issues anywhere: no syncing to a Wrenly Home backend, to King AI, or to the client. The summary is read on the spot.
- Voice input and typing.
- Multiple jobs, custom checklists, or remembering anything between sessions. One hard-coded sample job.
- Alarms, pop-ups, or any attention-grabbing timer behaviour.
- Multiple panels. Everything lives on the one parked panel.
- Photos or any camera use. Nothing is captured.
- Multi-user or shared Lenses. One cleaner, one Lens.

## Risks and open questions
- One panel carries everything (tabs, tasks, ring, timer, flag, end). The learner chose this knowingly: it's parked in the room beside the work and only seen on a glance, not stuck to the face. Watch that it stays readable and doesn't get crowded; if it does, the fix is bigger targets and fewer rows visible at once, not more panels.
- Feel unproven: whether a parked panel beside a real counter at ~1 m and a little below eye level is a comfortable glance for a real cleaner with gloves on. Only real glasses can answer this.
- Feel unproven: whether the hint arrow is enough to find the panel again after moving between rooms, or whether cleaners end up wanting it to follow. The preview can show the arrow but not the habit.
- The timer runs in real time, so the under-15-minutes colour change and the overtime display can't be reached in a short demo. They should be built and tested by LEAF, but the demo video only shows the timer starting and counting.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
