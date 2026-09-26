// Fixed strings for the team page (handover/update-v3/data/additions.json → copy). Placeholders in
// braces ({club}, {sponsor}, {n}, {level}, {period}…) are filled with fill(). Strings marked
// "not in the design" cover states the v3 design doesn't show; keep them plain and factual.

export const TEAM_COPY = {
  explainer: {
    lead: 'What is this?',
    text: 'Behind the Jersey shows who really pays for the sponsors on a club’s shirt. We trace each sponsor to its owner, check the human-rights record behind the money, and rate the shirt on a four-step scale from {clean} to {soaked}.',
    button: 'How we rate →',
  },
  scale: {
    label: 'Rating · hover a level',
    labelTouch: 'Rating · tap a level',
    labelNotRated: 'Rating · not rated yet',
    marker: '▲ {club}',
    noteHere: '{club} is here',
    noteWas: '{club} was here in {period}',
    /** Not in the design: on an old shirt, for the level of today's shirt. */
    noteNow: '{club} is here now',
  },
  why: { lead: 'Why is that a problem?' },
  sponsors: {
    title: 'Every sponsor on the shirt',
    sub: 'Click a row for the money and the evidence. The numbers match the shirt.',
    /** Not in the design: no marked photo to match. */
    subNoMarkers: 'Click a row for the money and the evidence.',
    /** Not in the design: no sponsors on file. */
    empty: 'No sponsors on file for this shirt yet.',
    columns: ['#', 'Sponsor', 'Who really pays', 'Rating', ''],
    notChecked: 'Not checked yet',
    /** Not in the design: a sponsor whose owner and evidence we have, but whose rating is on hold. */
    heldLead: 'Not rated yet.',
    heldDetail:
      'We know who owns {sponsor}, but the rating waits until a person has checked the evidence behind it against its sources.',
    unratedDetail:
      'We haven’t traced who owns {sponsor} yet, so there is no rating. A rating only goes up once every claim is sourced.',
    helpLink: 'Help check it →',
    evidenceLead: 'Evidence:',
    allSources: 'All sources for {sponsor} →',
    moneyLabel: 'Money (reported)',
    ownedThroughLabel: 'Owned through',
    /** Not in the design: "Who really pays" as the first fact on narrow screens. */
    payerLabel: 'Who really pays',
    valueUnknown: 'Value not disclosed',
    dealRunsTo: 'deal runs to {year}',
    leftChip: 'Left in {year}',
    departedLine: 'Gone since {monthYear}, after {seasons}.',
    departedSince: 'the end of {season}',
    departedWhy: 'That’s why {club} is {level} now, not {prevLevel}.',
    /** Not in the design: the same sentence on an old shirt. */
    departedWhyPast: 'That’s why {club} was {level} then, not {prevLevel}.',
    gone: 'Gone',
  },
  act: {
    kicker: 'Now what?',
    title: 'What you can do',
    intro:
      'You don’t have to stop supporting {club} or wearing the shirt. Sponsors do change, and fans speaking up is part of why',
    introLink: 'See who dropped a sponsor →',
    tell: {
      title: 'Tell {club}',
      text: 'It takes about two minutes. Send the club a short, polite message: we write the draft, you change what you like and send it from your own email to the club’s supporter liaison officer.',
      /** Not in the design: when the only checked address is a general fan inbox or contact page. */
      textGeneral:
        'It takes about two minutes. Send the club a short, polite message: we write the draft, you change what you like and send it from your own email.',
      /** Not in the design: no checked address yet. */
      textNoAddress:
        'It takes about two minutes. We write a short, polite draft; you change what you like and send it to the club yourself.',
      raiseLabel: 'What to raise',
      unratedSuffix: '· not rated yet',
      buttonOne: 'Write to {club} about {sponsor}',
      buttonMany: 'Write to {club} about {n} sponsors',
      buttonNone: 'Tick a sponsor first',
      draftLabel: 'Your message (draft)',
      draftEmpty: 'Tick a sponsor to see your message.',
      /** Mobile only. */
      draftMore: 'Show the whole message',
      draftLess: 'Show less',
    },
    moreLabel: 'More ways to help',
    more: {
      share: {
        title: 'Share {club}’s status',
        text: 'Most fans don’t know who pays for their shirt. Share a card with the rating and the facts.',
        button: 'Share the card',
      },
      group: {
        title: 'Bring it to your fan group',
        text: 'A supporters’ trust carries more weight than one email. Take a one-page fact sheet with every source.',
        button: 'Get the fact sheet',
      },
      /** Not in the design: a club with no shirt on file yet. */
      checkClub: {
        title: 'Help check {club}',
        text: 'Nobody has recorded the sponsors on {club}’s shirt yet. Anyone can add them, with a source for each one.',
        button: 'Help check it',
      },
      check: {
        title: 'Help check {sponsor}',
        text: 'We haven’t traced who owns {sponsor} yet. Anyone can add a source, and every one is checked.',
        button: 'Help check it',
      },
      follow: {
        title: 'Follow {club}',
        text: 'One email when the shirt changes or a sponsor deal comes up for renewal. Nothing else.',
        button: 'Follow {club}',
      },
    },
    /** Not in the design: the dialog when we have no checked email address for the club. */
    writeDialog: {
      title: 'Your message to {club}',
      noAddress:
        'We don’t have a checked address for {club} yet, so copy the message and send it from your own email. Change anything you like.',
      copy: 'Copy message',
      copied: 'Copied',
      contactPage: 'Open {club}’s contact page',
      close: 'Close',
    },
    followDialog: {
      title: 'Follow {club}',
      text: 'Alerts aren’t live yet. For now you can watch the open data on GitHub, where every change is recorded.',
      link: 'Open data on GitHub',
      close: 'Close',
    },
    shareTitle: '{club} is {level}',
    linkCopied: 'Link copied',
  },
  shirt: {
    header: 'The shirt · {kitLabel}',
    front: 'Front',
    back: 'Back',
    backNone: 'Back · no sponsor',
    hint: 'Hover a number to find it in the list.',
    /** Not in the design: a photo whose logos haven't been marked yet. */
    unmarked: 'The logos on this photo aren’t marked yet. Every sponsor is in the list.',
    /** Not in the design: no photo of the shirt yet. */
    noPhoto: 'No photo of this shirt yet.',
    noKit: 'No shirt on file yet.',
    /** Not in the design: the same hint on touch screens. */
    hintTouch: 'Tap a number to find it in the list.',
  },
  travel: {
    title: 'Travel back in time',
    sub: 'Click a season to see that shirt and its sponsors.',
    here: 'You are here',
    now: 'now',
    pastNotice: 'You’re looking at an old shirt ({period}).',
    pastNoticeLink: 'Back to today’s shirt →',
  },
  message: {
    subject: 'A question about our shirt sponsor',
    greeting: 'Dear {club},',
    opening: 'I’ve supported the club for years and I’m proud of our shirt.',
    /** {owner} carries its article: 'the Government of Dubai', 'Payward, Inc.'. */
    sponsorParagraph: 'But our {placement} sponsor, {sponsor}, is {ownerVerb} {owner}. {messageLine}',
    sponsorParagraphNext: 'Our {placement} sponsor, {sponsor}, is {ownerVerb} {owner}. {messageLine}',
    ask: 'Please don’t let our shirt be used to cover for that. When the deal is next reviewed, please look for a sponsor every fan can be proud of.',
    signoff: 'Thank you,\nA supporter',
  },
  headline: {
    /** Used when a kit has no headline of its own (UPDATE.md §8). */
    driven: 'The shirt {is} {level}: the {placement} sponsor, {sponsor}, is {ownerVerb} {owner}.',
    drivenNoOwner: 'The shirt {is} {level}: the {placement} sponsor is {sponsor}.',
    notRated: 'We haven’t rated this shirt yet: {n} sponsors still need checking.',
    notRatedOne: 'We haven’t rated this shirt yet: one sponsor still needs checking.',
    clean: 'The shirt {is} {level}: we checked every sponsor and found nothing.',
    /** Not in the design: a club with no shirt on file yet. */
    noKit: 'We haven’t recorded the sponsors on {club}’s shirt yet.',
  },
} as const;

/** Replace {name} placeholders. Unknown placeholders are left as they are, so gaps stay visible. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** 8 → 'eight'; words up to ten, digits after that. */
export function numberWord(n: number): string {
  return WORDS[n] ?? String(n);
}
