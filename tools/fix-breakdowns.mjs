/* =============================================================================
   CineReview — tools/fix-breakdowns.mjs
   -----------------------------------------------------------------------------
   js/data.js documents its own contract at line 18:

       breakdown    5→1 star distribution; values sum to reviewCount

   The shipped values broke that contract: they were hand-authored percentages
   (62 / 24 / 8 / 4 / 2 — summing to 100) sitting next to a reviewCount of 4128.
   A rating breakdown is only meaningful as the number of votes at each level,
   so the percentages are apportioned onto reviewCount here.

   Apportionment uses the largest-remainder (Hamilton) method rather than naive
   rounding. Rounding each bucket independently and then correcting the largest
   one biases the top bucket; Hamilton assigns the leftover votes to whichever
   buckets were rounded down hardest, which keeps every level as close to the
   authored share as integers allow.

   Exactness matters: the sum must equal reviewCount to the vote, because that
   is what the contract promises and what the test suite asserts.

   Usage:
     node tools/fix-breakdowns.mjs          # rewrite js/data.js
     node tools/fix-breakdowns.mjs --check  # report only, change nothing
   ========================================================================== */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = join(HERE, "..", "js", "data.js");
const CHECK_ONLY = process.argv.includes("--check");

/**
 * Distribute `total` votes across `shares` (fractions of the whole) as integers
 * that sum to exactly `total`. Largest-remainder method.
 */
function apportion(shares, total) {
  const weight = shares.reduce((a, b) => a + b, 0);
  if (!weight) return shares.map(() => 0);

  const exact = shares.map((s) => (s / weight) * total);
  const floors = exact.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);

  // Rank by fractional part, descending; ties keep the original order, which
  // makes the output deterministic across runs.
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);

  const counts = floors.slice();
  for (let i = 0; remainder > 0; i++, remainder--) {
    counts[order[i % order.length].index] += 1;
  }
  return counts;
}

function parseBreakdown(text) {
  return text
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [stars, count] = pair.split(":").map((p) => p.trim());
      return { stars: Number(stars), count: Number(count) };
    });
}

const source = readFileSync(TARGET, "utf8");

/* One record at a time: from its id, to the first reviewCount and breakdown. */
const RECORD = /(id:\s*"[^"]+",[\s\S]*?reviewCount:\s*(\d+),[\s\S]*?breakdown:\s*\{([^}]*)\})/g;

let changed = 0;
let inspected = 0;

const output = source.replace(RECORD, (match, head, reviewCount, breakdownBody) => {
  inspected++;

  const pairs = parseBreakdown(breakdownBody);
  const shares = pairs.map((p) => p.count);
  const total = Number(reviewCount);

  const sum = shares.reduce((a, b) => a + b, 0);

  // Already an exact count breakdown? Leave it alone.
  if (sum === total) return match;

  const counts = apportion(shares, total);
  const verified = counts.reduce((a, b) => a + b, 0);
  if (verified !== total) {
    throw new Error(`apportionment lost votes: ${verified} != ${total}`);
  }

  changed++;
  const rebuilt = pairs
    .map((p, i) => `${p.stars}: ${counts[i]}`)
    .join(", ");
  const slug = (head.match(/id:\s*"([^"]+)"/) || [])[1];

  if (!CHECK_ONLY) {
    console.log(
      `  ${slug.padEnd(32)} ${sum}% of ${total}  ->  ${counts.join(" + ")} = ${verified}`
    );
  }

  return match.replace(breakdownBody, rebuilt);
});

console.log(`Inspected ${inspected} movie records.`);

if (changed === 0) {
  console.log("Every breakdown already sums to its reviewCount. Nothing to do.");
} else if (CHECK_ONLY) {
  console.log(`${changed} record(s) need apportioning (use without --check to apply).`);
} else {
  writeFileSync(TARGET, output);
  console.log(`Rewrote ${changed} breakdown(s) in js/data.js.`);
}
