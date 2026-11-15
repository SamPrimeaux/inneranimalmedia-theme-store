---
title: "User Testing: Methods, Sample Sizes and Session Craft"
slug: user-testing
route: /blog/ux-guide/user-testing
guide: ux-guide
chapter: 3
category: ui-ux-guides
dek: "Choosing the right test for the question, recruiting the right people, writing tasks that don't lead, and turning what you watched into fixes."
author: InnerAnimalMedia
created: 2026-11-14
updated: 2026-11-14
seoTitle: "User Testing: Methods, Sample Sizes and Session Craft | InnerAnimalMedia"
seoDescription: "A hands-on guide to usability and user testing: techniques by question, sample sizes, task writing, moderated vs unmoderated sessions, severity ratings and synthesis."
cover:
  key: ux-guide/user-testing-cover
  alt: "Cover illustration for user testing"
  ratio: "1.8:1"
related: [user-behavior-data, ux-task-analysis, user-personas]
---

User testing is the practice of watching real people try to use something and learning from where they succeed and where they stall. It is cheap, fast, humbling and consistently the highest-return research habit a product team can build. Most of the skill is not in the tooling. It is in choosing the right question, giving people fair tasks, staying quiet, and writing down what you saw.

::media{key="ux-guide/user-testing-hero" alt="A participant, a facilitator and a note-taker around a screen" caption="A moderated session" ratio="16:9"}

## What User Testing Tells You, and What It Doesn't

**It tells you** where people get confused, which parts of a design work, what language they use, and how severe a problem is in practice. It is excellent at finding problems.

**It does not tell you** how many people will have a problem, whether anyone will want the thing, or what the business impact will be. Small samples find issues. They do not size them. Behavior data and larger studies answer those questions.

It also tests a design, not the person. When someone fails a task, the interface has failed. Say this to participants out loud, because many of them assume otherwise.

## Pick the Technique by the Question

| The question | Technique | What you do |
|---|---|---|
| Can people complete real tasks? | **Usability test** | Give tasks, observe, note problems |
| Is the structure understandable? | **Card sort** | Ask people to group and label content |
| Can they find things in my structure? | **Tree test** | Test navigation with the visuals removed |
| Where would they click first? | **First-click test** | Show a screen, record the first action |
| Is the message clear? | **Five-second test** | Show briefly, ask what they remember |
| How do they behave over time? | **Diary study** | Have participants log use over days |
| What do they do in their own setting? | **Contextual inquiry** | Observe where they actually work |
| Which of two designs performs better? | **A/B test** | Split live traffic, measure behavior |

Start with the question, then choose the cheapest technique that can answer it. A first-click test takes minutes to set up and often settles an argument that a meeting could not.

## Who to Test With

Recruit people who resemble your real users in the ways that matter for the tasks. For a general consumer flow, almost anyone in the target group will do. For a specialist workflow, a passerby is useless; you need people who do that work.

Write a short screener: a few questions that include the right people and exclude the wrong ones without revealing the right answers. Avoid testing with colleagues, friends and your own team, who know too much and will be too kind.

Include a range. If your product claims to serve novices and experts, test both, because they fail differently. Include people who use assistive technology when the flow should work for them, which it should.

## How Many Participants

The classic finding is that a small group uncovers most of the usability problems in a single design. In the model by Nielsen and Landauer, each person finds a share of the problems, and the returns diminish quickly: about five participants find roughly 85 percent of the issues that a test of that design is capable of finding.

Use that carefully.

- It applies to **one user group and one design**. Two meaningfully different groups need their own small samples.
- It is a reason to **test several times with few people**, fixing between rounds, rather than once with many.
- It does **not** support quantitative claims. If you need to report a task success rate with confidence, you need far more participants, often twenty or more per group.

A practical pattern is three to five people, fix what you found, repeat.

## Writing Tasks That Don't Lead

Tasks are the heart of the test and the easiest place to spoil it.

**Give a goal, not instructions.** "Change the site so it looks like your brand" is a task. "Click the theme tab and choose a color" is a script, and it tells you nothing about whether anyone could find the tab.

**Avoid the interface's vocabulary.** If the button is labeled "Publish," don't write "Publish your page." Say "Make your changes visible to visitors." Otherwise you are testing whether people can match words.

**Give a motive and context.** "You run a small bakery and want customers to see your new holiday menu on your site" is easier to act on than an abstract instruction, and closer to real behavior.

**Make success observable.** Decide what counts as completion in advance, and also what counts as success with difficulty.

**Order matters.** Start with an easy task to settle nerves, put the most important tasks early before fatigue sets in, and keep a spare in case something breaks.

**Pilot first.** Run the script on one colleague to catch broken links, ambiguous wording and impossible timing.

## Moderated and Unmoderated Testing

| | Moderated | Unmoderated |
|---|---|---|
| Format | Live session with a facilitator | Participants complete tasks alone, recorded |
| Strengths | Follow-up questions, rich insight, complex or early designs | Speed, scale, low cost, natural setting |
| Weaknesses | Scheduling effort, small numbers, facilitator influence | No probing, unclear tasks go unnoticed, lower-quality participants |
| Best for | Concepts, prototypes, why questions | Validating specific flows, benchmarking, larger samples |

A common good path: moderated early to discover problems and refine tasks, unmoderated later to validate at scale.

Remote testing removed most geographic limits, and for many products it is simply better, since people use the product on their own device in their own space. In-person is still valuable when you need to see context, hardware or body language.

## Where Most Tests Break

- **The facilitator talks too much.** Explaining, rescuing and leading are the usual culprits. Every sentence you add contaminates the result.
- **Leading questions.** "Was that easy to find?" invites yes. "Tell me about finding that" does not.
- **Testing what people say instead of what they do.** Opinions about a design are cheap and unreliable. Behavior is the evidence.
- **Testing the wrong people.** Friendly coworkers are not users.
- **Fixing problems mid-study.** Change one thing at a time and track versions, or you cannot interpret the sessions.
- **No pass criteria.** Without a prior definition of success, any result can be rationalized.
- **Too many tasks.** Fatigue makes the late tasks worthless. Four to six is plenty for an hour.

## Running the Session

A reliable structure for a 45-to-60 minute moderated session:

1. **Welcome (3 minutes).** Explain the purpose, say plainly you are testing the product not the person, ask permission to record, and tell them there are no wrong answers.
2. **Context questions (5 minutes).** A few easy questions about their experience and habits, used to warm up and to understand them.
3. **Tasks (30 to 40 minutes).** One at a time, with the scenario read aloud and also visible in writing. Encourage thinking aloud. When they ask what to do, answer with "What would you do if I weren't here?"
4. **Wrap-up (5 minutes).** Open questions: what stood out, what was frustrating, anything missing.
5. **Thanks and incentive.** Pay people fairly.

During tasks:

- **Stay quiet.** Silence is uncomfortable and productive. Count to ten before you speak.
- **Watch behavior more than words.** Hesitation, backtracking, hovering, rereading and repeated clicks are data.
- **Probe after, not during.** When someone stalls, note the time and ask about it at the end of the task: "At that point you paused. What were you thinking?"
- **Don't defend the design.** If participants criticize something, thank them. Your job is to learn.
- **Know when to move on.** If someone is stuck for several minutes, note the failure and help them move to the next task. Stuck is a result, not something to prolong.

Use a second person as a note-taker. Facilitating and note-taking at once degrades both.

## Capturing Notes You Can Use Later

Record sessions with permission. Take notes in a consistent form so they can be compared:

- **Timestamp.**
- **Task.**
- **Observation** (what they did or said, not your interpretation).
- **Tag** (finding, quote, question, idea).

Mark successes as well as failures. Teams that only note problems overcorrect and break what worked.

## Turning Findings Into Fixes

### Group and Count

After sessions, collect observations on a shared board and cluster similar ones. Count how many participants hit each issue. Frequency matters, but so does consequence.

### Rate Severity

A zero-to-four scale keeps discussion short:

| Rating | Meaning |
|---|---|
| 0 | Not a usability problem |
| 1 | Cosmetic, fix if time allows |
| 2 | Minor, low priority |
| 3 | Major, important to fix |
| 4 | Catastrophe, must fix before release |

Combine how often it occurred, how badly it hurt, and whether people could recover.

### Write the Finding in Full

A good finding has an observation, evidence, a cause hypothesis and a recommendation.

> **Finding.** Four of six participants did not find the publish control. Three scrolled the settings panel twice before giving up. **Cause (hypothesis).** The control sits below the fold and is styled as a tertiary action. **Recommendation.** Move publish into the persistent header and style it as the primary action. **Severity.** 4.

### Prioritize and Assign

Take the top few findings, assign owners, and agree what you will retest. A report listing forty issues is a document nobody reads. A report that names five and gets them fixed is research doing its job.

### Retest

The fix is a hypothesis. Run a short follow-up to confirm that the change solved the problem and did not create a new one.

## Testing Agent and AI Experiences

Testing products where software acts on the user's behalf has a few extra considerations.

- **Test the supervision, not just the result.** Can people understand what the agent is doing, notice a mistake, stop it and recover? Give tasks that include a deliberate agent error and watch whether participants catch it.
- **Test trust calibration.** Observe whether people over-rely or under-rely. Both are failures.
- **Use Wizard of Oz early.** A human operating behind the interface lets you test behavior and expectations before the agent exists.
- **Expect variability.** The same task may produce different agent outputs per session. Record what happened, and don't assume a problem is a bug in the study.

## Synthetic Users and AI Moderation

AI tools can now simulate participants and moderate sessions. They are useful for pressure-testing a script, drafting tasks, and summarizing recordings. They are not substitutes for real people, because synthetic participants reproduce plausible averages and miss the specific, odd, memorable ways real people get stuck. Use them to prepare and to analyze. Keep humans in the sessions that decide what you build.

## A Minimal Setup That Works

You can run a credible test with a prototype or build, a video-call tool that records, a task script, a note-taking template, and three to five carefully chosen participants. Half a day, including synthesis. Repeat every few weeks, and testing stops being an event and becomes a habit.
