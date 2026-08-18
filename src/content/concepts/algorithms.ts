import type { Concept } from "@/types/content";

export const algorithmsConcepts: Concept[] = [
  {
    slug: "counting-the-work",
    trackId: "algorithms",
    title: "Counting the work",
    blurb: "Sort six numbers by hand under a comparison budget, then find out why the budget was set there.",
    syllabusRef: "CLRS 4e, Ch 2 Getting Started and Ch 3 Characterizing Running Times",
    minutes: 12,
    prerequisites: [],
    phases: [
      {
        kind: "predict",
        prompt:
          "You have six shuffled numbers. Every comparison and every swap costs one unit. How many units do you think a careful hand-sort will take?",
        options: ["Around 8", "Around 20", "Around 35", "Around 60"],
        correctIndex: 1,
        afterword:
          "Most people guess low. A textbook insertion sort on this exact row costs 19 operations once you count the comparisons and the swaps together.",
      },
      {
        kind: "play",
        brief:
          "Sort the row from smallest to largest. You can compare two cards to see which is bigger, or swap two cards. Each action costs one unit. Stay inside the budget.",
        puzzleId: "insertion-sort-budget",
      },
      {
        kind: "reveal",
        heading: "What the budget was measuring",
        body: [
          "The budget was not arbitrary. Insertion sort walks left to right, and for each card it shuffles that card backwards until it sits in the right place. On a shuffled list, each new card travels about halfway back through the sorted part.",
          "Add that up across n cards and you get roughly n squared over four comparisons, plus a similar number of swaps. On this row that works out to 19 operations. A different shuffle of the same six numbers would land somewhere else nearby, and a reversed row would cost noticeably more.",
          "So the shape of the cost is n squared. That is what people mean when they write O(n squared). It is not a precise count. It is a claim about how the cost grows when n grows.",
          "Here is the part worth sitting with. Doubling the list to twelve cards does not double the work. It roughly quadruples it. That gap is why algorithm choice beats a faster machine once the input gets large.",
        ],
      },
      {
        kind: "implement",
        heading: "The same thing in code",
        language: "typescript",
        code: `export function insertionSort(values: number[]): number[] {
  const sorted = [...values];

  for (let boundary = 1; boundary < sorted.length; boundary += 1) {
    const candidate = sorted[boundary];
    let position = boundary - 1;

    while (position >= 0 && sorted[position] > candidate) {
      sorted[position + 1] = sorted[position];
      position -= 1;
    }

    sorted[position + 1] = candidate;
  }

  return sorted;
}`,
        notes: [
          "The outer loop marks the boundary between the sorted prefix and the untouched rest. Everything left of it is already in order.",
          "The inner while loop is the backwards shuffle you did by hand. It is also where the n squared comes from, because it can run the full length of the sorted prefix.",
          "The function copies the input instead of sorting in place. That costs memory but it keeps the caller's array untouched, which is usually worth it.",
        ],
      },
      {
        kind: "case",
        heading: "Where a slow sort is still the right call",
        body: [
          "Insertion sort sounds useless next to an n log n sort. It is not. On short or nearly sorted lists it beats the fancier options, because it has almost no setup cost and it does very little work when the input is already close to ordered.",
          "Timsort, the sorting algorithm behind Python's sorted() and list.sort() and behind Java's Arrays.sort() for object arrays, takes advantage of this. It splits the input into runs and uses binary insertion sort on the small ones, then merges the runs together.",
          "So the practical lesson is not that insertion sort is bad. It is that the cost model tells you which tool fits which input size.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "Timsort's use of binary insertion sort on small runs is described in Tim Peters' listsort.txt in the CPython source tree. The complexity claims for insertion sort come from CLRS 4e Ch 2. I have not re-verified the CPython run-length constants for the current release.",
      },
    ],
  },
  {
    slug: "halving-the-search",
    trackId: "algorithms",
    title: "Halving the search",
    blurb: "Find a number in sixteen hidden cells with only four looks. Scanning will not get you there.",
    syllabusRef: "CLRS 4e, Ch 2 Getting Started and Ch 3 Characterizing Running Times",
    minutes: 10,
    prerequisites: ["counting-the-work"],
    phases: [
      {
        kind: "predict",
        prompt:
          "Sixteen cells hold numbers in ascending order, all face down. You get four looks to find one specific value. Can it be done every time?",
        options: [
          "No, four looks is not enough",
          "Only if you are lucky",
          "Yes, four looks is always enough",
          "Only if the target sits near the middle",
        ],
        correctIndex: 2,
        afterword:
          "Four looks is exactly enough for sixteen cells, and it works every time. The order in the list is the thing that makes it possible.",
      },
      {
        kind: "play",
        brief:
          "The cells are sorted in ascending order but hidden. Each look reveals one cell and costs one unit. Find the target inside the budget.",
        puzzleId: "binary-search-budget",
      },
      {
        kind: "reveal",
        heading: "Why four looks covers sixteen cells",
        body: [
          "Every look at a sorted list tells you two things, not one. It tells you the value in that cell, and it tells you which half of the remaining range the target must be in.",
          "That second piece is the whole trick. Look at the middle, and whatever the answer is, half the list is gone. Look at the middle of what is left and half of that is gone too.",
          "Sixteen becomes eight becomes four becomes two becomes one. Four halvings. In general, k looks cover 2 to the power of k cells, which is the same as saying n cells need log base 2 of n looks.",
          "Compare that to scanning left to right, which needs up to sixteen looks here. The gap widens fast. A million sorted cells need twenty looks, not a million.",
          "One condition carries all of this: the list has to be sorted. Sorting is the price you pay up front so that every later search is cheap. That trade shows up everywhere in systems, and it is exactly what a database index is.",
        ],
      },
      {
        kind: "implement",
        heading: "The same thing in code",
        language: "typescript",
        code: `export function binarySearch(sortedValues: number[], target: number): number {
  let low = 0;
  let high = sortedValues.length - 1;

  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const value = sortedValues[middle];

    if (value === target) return middle;
    if (value < target) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return -1;
}`,
        notes: [
          "The midpoint is written as low plus half the gap, not as low plus high divided by two. On fixed-width integer types the second version can overflow when the array is very large.",
          "The bounds move past the midpoint rather than onto it. Setting low to middle instead of middle plus one is the classic way to write an infinite loop here.",
          "Returning -1 for a miss matches the convention in most standard libraries. Returning the insertion point instead is also common and is more useful when you want to add the value.",
        ],
      },
      {
        kind: "case",
        heading: "The bug that lived in production for years",
        body: [
          "Joshua Bloch published a post on the Google Research blog in 2006 titled 'Extra, Extra - Read All About It: Nearly All Binary Searches and Mergesorts are Broken'. The bug he described was the midpoint calculation.",
          "Writing the midpoint as (low + high) / 2 works fine until low plus high exceeds the maximum value of a signed 32-bit integer. Then the sum wraps negative and the index goes out of range. It shipped inside java.util.Arrays.binarySearch and sat there for about nine years.",
          "The reason it survived so long is that it only shows up on arrays of roughly a billion elements or more. Nobody's test suite had one.",
          "The lesson generalises past this bug. Correct on paper and correct at every input size are different claims, and the second one is the one production tests.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "The Google Research blog post by Joshua Bloch (2006) is the primary source and is widely cited. The nine-year figure comes from that post's own account of when the code was written. I have not re-fetched the post to confirm exact wording, so treat the quoted title as the identifying reference rather than a verbatim excerpt.",
      },
    ],
  },
];
