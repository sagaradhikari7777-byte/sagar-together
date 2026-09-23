---
name: Together Studio
description: A compact shared journal with calm green surfaces and glass navigation.
colors:
  primary: "#17634e"
  ink: "#172c28"
  muted: "#61716c"
  canvas: "#f4f6f3"
  surface: "#ffffff"
  input: "#f2f5f2"
  border: "#dce4df"
  balance: "#e7efe4"
  balance-ink: "#194c3b"
  dark-canvas: "#111917"
  dark-surface: "#1c2823"
  dark-ink: "#e9f0ea"
  dark-primary: "#a3d8ba"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "15px"
    letterSpacing: "-0.015em"
  headline:
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  section:
    fontSize: "19px"
    fontWeight: 650
  input:
    fontSize: "16px"
rounded:
  surface: "22px"
  control: "14px"
  balance: "26px"
  dialog: "28px"
spacing:
  small: "8px"
  medium: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
---

# Together Studio

## Overview

A calm household journal. Compact content, legible monetary amounts, familiar iPhone controls, and floating translucent navigation. Preserve the linked-rings mark and green identity. This is responsive web UI; system typography uses the device's installed font.

Design guidance used: [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) and [Impeccable](https://github.com/pbakaus/impeccable). Runtime uses neither service nor an additional subscription.

## Colors

Use semantic properties from `public/ios.css`. Primary green signals actions; mint separates the balance summary. White content surfaces sit on a neutral canvas. Category colours supplement icons and labels. Dark appearance changes the complete token set, including primary-button foreground.

## Typography

Use the platform font stack throughout. Section headings are distinct from 12–13px metadata and 15px expense titles. Inputs stay 16px to avoid iPhone input zoom. Money uses tabular numerals. Balance figures are 40px on mobile, 56px on desktop; narrow-screen exceptions live in CSS. Long names wrap or truncate only where the full value remains accessible by opening the item.

## Layout

The shell is at most 1080px wide. Below 701px, use one column with 18px safe-area-aware gutters, reducing to 14px below 361px. Desktop uses 36px gutters and two Home columns. Shared dock clearance includes its 64px height, 12px bottom gap, safe area and additional scroll padding. End content must scroll fully above it.

## Elevation & Depth

Content is mostly flat with thin borders. Reserve blur and edge highlights for the floating dock, with a 22px backdrop blur and opaque accessibility fallback. Dialogs use a dimmed, blurred backdrop. Reduced-motion and increased-contrast modes must remain usable.

## Shapes

Grouped lists use the surface radius; balance summaries are slightly softer. Category symbols use circles, inputs use 12px corners, and the navigation uses capsules. Avoid adding another decorative card around an existing content card.

## Components

Every signed-in page shares the same identity header and four-tab dock with separate Add control. Preserve 44px minimum action targets and button alternatives to swipes. Remember scroll position between tabs; retapping the current tab returns to its top.

Expense entry leads with amount, merchant, payer and actual couple split names. More details contains category, date, sheet, notes and receipt; its summary reflects category and date. Invalid collapsed fields expand before validation focus. Closing changed entries asks to keep editing or discard. Edits open their details section.

Sheets show full start and end dates. Expense lists retain creator permissions and named full-share allocations. View options groups filters, sort, sheet switching and CSV access. Settings groups profile, household and preferences. Onboarding uses the same palette, fields and buttons.

## Do's and Don'ts

- Keep amounts, couple names and sheet periods readable before adding decoration.
- Keep theme colours in semantic tokens and verify both themes.
- Preserve visible focus, reduced effects, safe areas and unobscured final content.
- Do not reduce touch targets to make content look smaller.
- Do not hide household expenses or weaken creator-only permissions.
- Do not introduce a competing colour system or duplicate navigation for nested views.
