---
title: "What an Interaction Designer Actually Does"
slug: interaction-designer
route: /blog/ux-guide/interaction-designer
guide: ux-guide
chapter: 9
category: ui-ux-guides
dek: "The behavior layer of design: states, transitions, timing, feedback and the edge cases that decide whether an interface feels trustworthy."
author: InnerAnimalMedia
created: 2026-11-14
updated: 2026-11-14
seoTitle: "What an Interaction Designer Actually Does | InnerAnimalMedia"
seoDescription: "A clear guide to the interaction designer role: states, transitions, microinteractions, motion, input models, deliverables, tools and how it differs from UI and UX."
cover:
  key: ux-guide/interaction-designer-cover
  alt: "Cover illustration for the interaction designer role"
  ratio: "1.8:1"
related: [ux-task-analysis, product-designer, ux-disciplines]
---

An interaction designer owns behavior. Where a UI designer decides what something looks like at rest, an interaction designer decides what happens when someone touches, types, drags, waits, makes a mistake or changes their mind. They design the conversation between a person and a system, one exchange at a time.

The term is often credited to Bill Moggridge and Bill Verplank, who used it in the 1980s to describe designing for how digital products behave rather than how they are shaped. The idea has aged well: interfaces are not pictures, they are responsive systems, and the quality of the response is the experience.

::media{key="ux-guide/interaction-designer-hero" alt="A control moving through default, hover, pressed, loading and success states" caption="One control, many moments" ratio="16:9"}

## What the Role Covers

**States.** Every element exists in several conditions: default, hover, focus, pressed, disabled, loading, empty, error, success, selected, expanded, dragging. An interaction designer specifies them all, and what moves a component from one to another.

**Transitions.** The movement between states, and between screens. How a panel enters, how a list reorders, how a deleted item leaves, and what each conveys about cause and effect.

**Feedback.** How the system tells the person it heard them: a pressed state, a progress indicator, a confirmation, an error. Feedback has to be immediate, proportionate and honest.

**Input models.** Mouse, touch, keyboard, voice, pen, gamepad, gesture. Each has its own conventions, precision and failure modes, and the same feature often needs to work in several.

**Flow and logic.** What happens next, what is preserved, what can be undone, what is blocked and why.

**Edge cases.** The conditions most designs skip: very long text, no data, thousands of items, slow networks, lost connections, simultaneous edits, permission changes mid-task.

## How It Differs From UI and UX

The roles overlap and often live in one person on small teams. The distinctions are useful for knowing what you are doing at a given moment.

| | UX design | UI design | Interaction design |
|---|---|---|---|
| Core question | Is this the right thing, for the right people? | Does it look and read clearly? | Does it behave in a way people can predict and trust? |
| Works in | Research, strategy, flows | Layout, type, color, components | States, motion, input, logic |
| Typical artifact | Insights, journey maps | Visual designs, tokens | State tables, prototypes, motion specs |

A quick way to tell: if you are deciding what the button looks like, it is UI. If you are deciding what happens when someone double-clicks it, holds it, tabs to it, or presses it with no connection, it is interaction design.

## The Craft: Principles That Hold Up

**Direct and immediate response.** Within about a tenth of a second, a person should feel that the system responded. Around a second, they notice the delay. Beyond about ten, they lose their train of thought. Show something at once, even if the result takes longer.

**Visible state.** People should be able to tell what mode they are in, what is selected, what is saved and what is pending. Invisible state is where people get lost.

**Reversibility.** The easiest way to make an interface feel safe is to make actions undoable. It changes how boldly people explore.

**Constraints and affordances.** Make the right action obvious and the wrong action hard. Disable or hide what cannot work, and say why when it matters.

**Consistency.** The same gesture should do the same thing everywhere. Surprise costs trust.

**Forgiveness.** Accept varied input, preserve work on error, and let people recover without starting over.

**Progressive disclosure.** Show what matters now, reveal complexity when asked.

**Respect for attention.** Interrupt only when it is worth it.

## Microinteractions

Dan Saffer popularized the idea that small, single-purpose moments, such as toggling a setting, pulling to refresh or liking a post, deserve design attention of their own. He describes four parts:

- **Trigger:** what starts it, by the user or the system.
- **Rules:** what happens once it starts.
- **Feedback:** what the person sees, hears or feels.
- **Loops and modes:** how it repeats, changes over time or behaves in special cases.

Apply the lens to something ordinary: sending a message in an agent composer. The trigger is pressing send or the keyboard shortcut. The rules decide whether empty input is blocked, whether the draft clears, and whether a second submit is allowed while the first is running. The feedback shows the message appear, the field reset and a response begin streaming. The loops decide what happens on failure: does the text come back, with an explanation?

## Motion With a Purpose

Motion is the most visible tool and the easiest to misuse. Use it for four jobs:

- **Orientation:** show where something came from or went.
- **Feedback:** confirm an action.
- **Causality:** connect a change to its cause.
- **Attention:** direct the eye to what matters.

Practical defaults:

- Most interface transitions fall between 100 and 300 milliseconds. Shorter feels abrupt, longer feels sluggish.
- Use ease-out for elements entering and ease-in for elements leaving.
- Animate transform and opacity, which are cheap, rather than properties that force layout.
- Keep movement proportional to distance and importance.
- Honor the reduced-motion preference by replacing movement with a fade or an instant change.
- For waits over a second, use progress, not endless motion.

If you cannot say which of the four jobs a piece of motion does, cut it.

## Designing for Waiting, Failure and Recovery

Many interfaces are designed for the instant when everything works. Real use includes waiting and failure.

**Waiting.** Skeletons and progress indicators for known layouts, determinate progress when you can measure, step lists for long tasks. Say what is happening, and whether the person can leave.

**Failure.** Name what went wrong in plain terms, say whether anything was lost, and offer a way forward. "Something went wrong" is a missed opportunity.

**Recovery.** Preserve input. Allow retry. Offer undo. Make partial success visible.

**Empty states.** The first-use screen is an interaction too. Say what belongs here and how to start.

## Interaction Design for Agents and AI

When the system takes actions, interaction design extends to supervision.

- **Streaming and progress.** Show that work is happening and what stage it is in.
- **Approval moments.** Design the prompt so the person can understand what they are authorizing, in plain language, with the target and the consequence. Make the safe choice easy and the dangerous one deliberate.
- **Interruption.** A stop control that works, and clear state about what had and had not happened when it was pressed.
- **Correction.** Let people edit a plan, redirect mid-run and undo outcomes.
- **Transparency.** A readable log, not a wall of internals.

The timing of an approval prompt, its wording and its default state shape whether people stay in control or click through.

## Deliverables

Interaction designers communicate behavior, which pictures do poorly. Typical outputs:

- **State tables** that enumerate every state and transition for a component.
- **Flow diagrams** with decisions and error branches.
- **Interactive prototypes** that let people feel the behavior.
- **Motion specs** with duration, easing, properties and triggers.
- **Annotated wireframes** that describe logic in words.
- **Behavior notes** for edge cases: truncation, overflow, validation timing.
- **Input maps** for keyboard, touch and pointer.

A small state table already beats most mockups:

| State | Appearance | Behavior |
|---|---|---|
| Default | Primary fill | Click submits |
| Hover | Slightly lifted | Pointer cursor |
| Focus | Visible ring, never hidden | Enter or Space submits |
| Pressed | Depressed | Submits on release |
| Loading | Spinner replaces label, width fixed | Further clicks ignored |
| Disabled | Muted, with reason available | Not focusable, or focusable with explanation |
| Error | Inline message beside the control | Retry available |

## Tools

Whatever lets you express behavior cheaply: a design tool with variables and prototyping for flows, a coded prototype when feel matters, paper for early logic, a motion tool or small animation library to test timing, and a screen reader plus keyboard-only testing to check that behavior holds for everyone.

For many teams, the real component library with fake data is the best prototype, because it brings real focus order, real timing and real states for free.

## Working With Engineers

Interaction design lives or dies in implementation. A few habits help:

- **Specify behavior, not just appearance,** and write it where engineers will find it.
- **Prototype the risky interaction,** so debates are about something real.
- **Agree on the vocabulary** for states and transitions.
- **Review the build** with the actual interaction, not screenshots.
- **Know the cost.** Understanding what is simple and what is expensive makes proposals more credible.

## Skills to Build

- Observation: noticing small hesitations and misclicks.
- Systems thinking: seeing every state, not just the main one.
- Prototyping: the fastest route from idea to evidence.
- Knowledge of platform conventions and accessibility.
- Basic code literacy, enough to reason about events, state and timing.
- Writing: labels, errors and confirmations are part of behavior.

## A Closing Test

Pick any control in a product you are building and ask: what does it do when I press it, hold it, tab to it, press it twice, press it with no connection, and press it while something else is happening? If you do not know all six answers, there is interaction design left to do.
