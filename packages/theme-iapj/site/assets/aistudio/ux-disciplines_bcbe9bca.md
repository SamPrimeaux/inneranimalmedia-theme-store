---
title: "The Disciplines Inside UX, and How They Fit Together"
slug: ux-disciplines
route: /blog/ux-guide/ux-disciplines
guide: ux-guide
chapter: 13
category: ui-ux-guides
dek: "UX is a family of crafts. A tour of the major disciplines, what each one owns, how they hand off, and how a small team covers them without a headcount for each."
author: InnerAnimalMedia
created: 2026-11-14
updated: 2026-11-14
seoTitle: "The Disciplines Inside UX and How They Fit Together | InnerAnimalMedia"
seoDescription: "A clear tour of UX disciplines: research, information architecture, interaction, content design, UI, accessibility, design systems and design engineering, and how small teams cover them."
cover:
  key: ux-guide/ux-disciplines-cover
  alt: "Cover illustration for UX disciplines"
  ratio: "1.8:1"
related: [product-designer, interaction-designer, roadmap-to-becoming-uiux-designer]
---

"UX designer" describes a family, not a single job. Behind the label sit several distinct crafts, each with its own methods, vocabulary and ways of failing. Knowing them helps in three ways: you can see what is missing from a product, you can tell what kind of person to hire or become, and you can cover the gaps deliberately when you cannot staff each one.

::media{key="ux-guide/ux-disciplines-hero" alt="A map of UX disciplines arranged from research to engineering" caption="The disciplines, arranged by what they own" ratio="16:9"}

## The Map

| Discipline | Owns | Key question |
|---|---|---|
| **UX research** | Evidence about people and behavior | What is true? |
| **Information architecture** | Structure, labels, navigation | Can people find and understand it? |
| **Interaction design** | Behavior, states, motion | How does it respond? |
| **Content design and UX writing** | Words in the product | What should it say? |
| **Visual and UI design** | Appearance, hierarchy, components | How does it look and read? |
| **Accessibility** | Usability for the full range of people | Who can't use this, and why? |
| **Design systems and ops** | Shared parts, rules, workflow | How do we stay consistent at speed? |
| **Design engineering** | The bridge between design and code | Can we build it, and can it be built well? |
| **Service design** | The end-to-end service, including backstage | What has to happen for this to work? |

Real roles blend these. The point of the table is to name the muscles.

## UX Research

Research reduces the risk of building the wrong thing. It spans generative work (what do people need?), evaluative work (does this design work?) and quantitative work (how many, how often?). Methods range from interviews and field observation to usability tests, surveys and analytics. See [user testing](/blog/ux-guide/user-testing) and [behavior data](/blog/ux-guide/user-behavior-data).

**Skills:** study design, interviewing, synthesis, statistics literacy, storytelling with evidence.

**When it is missing:** teams argue from opinion, ship features nobody asked for, and discover problems from support tickets.

## Information Architecture

IA is how things are organized: what exists, how it is grouped, what it is called and how people move between pieces. It determines whether a large product feels coherent or like a drawer of unlabeled cables. Methods include card sorting, tree testing, content inventories and sitemaps.

**Skills:** categorization, labeling, taxonomy, systems thinking.

**When it is missing:** features pile up in whatever menu had room, labels use internal jargon, and people cannot find things that exist.

## Interaction Design

Interaction design defines how a product behaves: states, transitions, feedback, input models and edge cases. See [what an interaction designer does](/blog/ux-guide/interaction-designer).

**Skills:** state modeling, prototyping, timing and motion, platform conventions.

**When it is missing:** interfaces look finished but feel brittle, with unclear loading, silent failures and inconsistent responses.

## Content Design and UX Writing

Words are interface. Content design covers labels, instructions, empty states, errors, onboarding and the tone of the whole product. Beyond microcopy, it involves deciding what content is needed, in what order, and in what form.

**Skills:** clear writing, editing, information hierarchy, voice and tone, localization awareness.

**When it is missing:** buttons say "Submit", errors say "Something went wrong", and every team names the same thing differently.

## Visual and UI Design

UI designers shape the visible layer: layout, hierarchy, typography, color, iconography, spacing and component appearance. In a systematic practice, that means designing the rules and parts so everything built later inherits quality.

**Skills:** typography, composition, color, craft in a design tool, component thinking, an eye for detail.

**When it is missing:** screens feel inconsistent, hierarchy is murky, and nothing quite lines up.

## Accessibility

Accessibility is the practice of making products usable by people with a wide range of abilities and circumstances: vision, hearing, motor, cognitive, and temporary or situational limits. It is rooted in standards such as WCAG, now at version 2.2, and in assistive technologies such as screen readers, switch devices and voice control.

In practice: sufficient contrast, keyboard operation, visible focus, meaningful structure and labels, targets that are big enough, no reliance on color alone, motion that respects preferences, and clear language. It works best as a property of components and tokens, with testing at the end, not a review stage that finds problems too late.

**Skills:** standards knowledge, assistive technology use, semantic markup, inclusive research.

**When it is missing:** whole groups of people cannot complete basic tasks, legal exposure grows, and retrofits cost many times more than doing it right.

## Design Systems and Design Operations

Design systems keep a growing product coherent: tokens, components, patterns, documentation and governance. Design operations is the surrounding practice of workflow, tooling, standards, research logistics and team health.

**Skills:** component architecture, token design, documentation, versioning, change management, diplomacy.

**When it is missing:** every screen reinvents buttons, themes are impossible, and design debt compounds silently.

## Design Engineering

Design engineers work in both worlds. They build prototypes and production components, close the gap between what was designed and what shipped, and make interactions feel right in code. The role is growing because the cost of translating between disciplines is real.

**Skills:** front-end engineering, animation, accessibility implementation, visual taste, system design.

**When it is missing:** designs are hard to build, details get lost in translation, and motion and states regress in the build.

## Service Design

Service design looks past the interface at the whole system that delivers an experience: people, processes, policies and tools, front stage and back stage. It uses blueprints, journey maps and ecosystem maps. See [journey mapping](/blog/ux-guide/customer-journey-map).

**Skills:** systems mapping, facilitation, operations understanding, cross-team influence.

**When it is missing:** good interfaces sit on top of slow, broken or contradictory processes, and the experience fails at the seams.

## Other Specialties Worth Knowing

- **Conversational and voice design:** structuring dialog, handling misunderstanding, designing for turn-taking.
- **Motion design:** timing, easing and choreography that express brand and behavior.
- **Data and AI experience design:** making probabilistic systems legible, supervisable and trustworthy.
- **Game and spatial design:** designing for depth, gaze and embodiment.
- **Localization and internationalization:** design that survives other languages, scripts and cultures.

## How They Hand Off, and Where They Fight

The craft lines are drawn where work changes hands, and that is where friction collects.

- **Research to design:** findings need to arrive as decisions, not reports. Pair early.
- **IA to content:** labels and structure are co-dependent. Decide them together.
- **Interaction to UI:** behavior and appearance are intertwined. Co-design states.
- **Design to engineering:** the most expensive handoff. Prototype together and review builds.
- **Accessibility to everyone:** needs to be shared from the start, not owned by one person at the end.

The healthiest teams treat the lines as a guide to who leads a decision, not a wall.

## Covering the Map on a Small Team

Most teams cannot hire for each discipline. A workable approach:

1. **Identify the highest risk.** Is it that you are building the wrong thing (research), that people cannot find things (IA), or that it feels brittle (interaction)? Invest there first.
2. **Build the system once.** Tokens, components with complete states and accessible behavior cover a large share of UI, interaction and accessibility work automatically.
3. **Use checklists as scaffolding.** A short pre-release list for states, copy, accessibility and responsiveness catches most problems.
4. **Borrow research.** Five hours of watching people beats five weeks of debate.
5. **Make writing someone's job,** even if part-time. Consistent language is a cheap, visible win.
6. **Pair a designer with an engineer** early and often.
7. **Use AI as a force multiplier:** to draft states, audit tokens, generate test scripts and check accessibility, with people reviewing the results.

## Choosing Your Path

If you are building a career, find the discipline whose problems you find absorbing, and go deep enough that you are useful. Then widen enough to understand your neighbors. "T-shaped" is the familiar phrase: one deep stem, broad collaboration across the top.

- Drawn to people and evidence: research.
- Drawn to structure and language: IA or content design.
- Drawn to behavior and feel: interaction or motion.
- Drawn to craft and systems: UI, design systems, design engineering.
- Drawn to fairness and edge cases: accessibility.
- Drawn to the whole picture: service design or product design.

For the start of that journey, see [the twelve-month roadmap](/blog/ux-guide/roadmap-to-becoming-uiux-designer).

## The Takeaway

A product's experience is the sum of all these disciplines, whether or not anyone is named for them. The ones nobody owns do not disappear. They are done implicitly, by whoever is nearest, with whatever time they have. Naming them is the first step toward doing them on purpose.
