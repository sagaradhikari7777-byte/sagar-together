# Together

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Two couples sharing a household use Together on an iPhone, with desktop access, to record expenses, understand each couple's share and record settlements. The user has requested a compact, modern iOS-inspired interface with Liquid Glass navigation and clear identity.

## Capabilities and constraints

Preserve the existing vanilla JavaScript frontend, Vercel API, Upstash data and GitHub continuous deployment. Everyone in the household sees every expense. Only the creator can edit or delete their expense; settled expenses stay locked. Show actual couple names in split controls and entries, start and end dates for sheets, and the signed-in name. Preserve merchants, categories, quick repeat, receipts, CSV, archive/pin, swipes and button alternatives, dark mode, invitations and personal access links.

## Brand commitments

Together name and linked-rings mark. Calm iPhone interface, compact lists, floating translucent navigation, consistent styling across tabs and dialogs. The user has delegated design decisions and authorized implementation and publication.

## Evidence

Existing frontend in public/ and model policy tests in tests/. Demo records are explicitly labeled sample data. The app is a web application, not a native iOS binary.

## Expense entry (October 2026)

Keep Add Expense as a compact, naturally scrolling form with readable controls. Extra details is permanently expanded: expense sheet, optional description, visible Attach receipt/Choose control, then the optional calculator. Put the main Save button at the end, with Save & add another as a quieter secondary action. Inputs stay at least 16px to prevent iPhone focus zoom. Receipt previews, errors, and draft guards must expand the form without covering other fields. Keep the existing household records, author-only permissions, settled locks, and all other tabs intact.

Canonical source is `sagaradhikari7777-byte/sagar-together`, branch `main`; pushes auto-publish to https://sagar-together.vercel.app. Automatic QA email workflows were removed at the user's request; browser checks are manual.
