import type { Concept } from "@/types/content";

export const objectDesignConcepts: Concept[] = [
  {
    slug: "blast-radius",
    trackId: "object-design",
    title: "Blast radius",
    blurb: "A delivery app spread its messaging code across three classes. Watch what one provider change costs.",
    syllabusRef: "Head First OOA&D, Ch 4 Analysis and Ch 5 part 2 Cohesion",
    minutes: 12,
    prerequisites: [],
    phases: [
      {
        kind: "predict",
        prompt:
          "Three classes each send a different kind of message: email, SMS, push. The company switches messaging provider. How many classes have to change?",
        options: ["One", "Two", "Three", "Three, plus anything that depends on them"],
        correctIndex: 3,
        afterword:
          "Change spreads. It hits every class holding that responsibility, and then it hits whatever depends on those classes and has to be retested.",
      },
      {
        kind: "play",
        brief:
          "Move responsibilities between blueprints. The meter shows how many blueprints each change request would touch. Get the worst case down to the target, and do not leave any blueprint empty.",
        puzzleId: "notification-coupling",
      },
      {
        kind: "reveal",
        heading: "Cohesion is what shrinks the blast radius",
        body: [
          "The fix was not clever. You gathered the three messaging responsibilities into one blueprint. Now a provider switch touches one place instead of three.",
          "You probably also noticed that pricing would not go below two. Delivery already depends on Order, so any edit to Order drags Delivery into retesting no matter how tidy the responsibilities are. Some coupling is inherited from the call graph and no amount of rearranging removes it.",
          "That property has a name. Cohesion is how much the things inside one class belong together. High cohesion means a class does one job, so a change to that job lands in one file.",
          "Coupling is the other half. It is how much one class needs to know about another. The ripple in the puzzle was coupling in action: a blueprint that depends on a changed blueprint gets dragged into the change even if you never edit it, because it has to be retested and might break.",
          "Here is the thing that makes this more than vocabulary. You cannot judge a design by looking at it. A class either has high cohesion or it does not, and the way you find out is to ask what changes are likely and count what each one touches.",
          "That is why the puzzle gives you change requests rather than a style guide. Good design is not the layout that looks tidiest. It is the layout that is cheapest to change in the directions change is actually going to come from.",
        ],
      },
      {
        kind: "implement",
        heading: "Gathering the responsibility",
        language: "typescript",
        code: `export interface MessageChannel {
  send(recipient: string, body: string): Promise<void>;
}

export class Messenger {
  constructor(private readonly channels: Record<string, MessageChannel>) {}

  async notify(channelName: string, recipient: string, body: string): Promise<void> {
    const channel = this.channels[channelName];
    if (!channel) {
      throw new Error(\`No message channel registered as "\${channelName}".\`);
    }
    await channel.send(recipient, body);
  }
}

export class Order {
  constructor(private readonly messenger: Messenger) {}

  async confirm(customerEmail: string): Promise<void> {
    await this.messenger.notify("email", customerEmail, "Your order is confirmed.");
  }
}`,
        notes: [
          "Order no longer knows what an email provider is. It knows there is a messenger and it tells the messenger what it wants. That is delegation.",
          "The Messenger takes its channels through the constructor rather than building them itself. Swapping the provider in a test means passing a different object, no mocking library needed.",
          "MessageChannel is the seam. Everything above it survives a provider change untouched, and everything below it is one small class per channel.",
        ],
      },
      {
        kind: "case",
        heading: "The same shape in Node's EventEmitter",
        body: [
          "Node's EventEmitter is this pattern in the standard library. A component calls emit with an event name and a payload. It has no idea who is listening, how many listeners there are, or what they do.",
          "That is the coupling reduction made concrete. Adding a new reaction to an event means calling on somewhere else in the codebase. The emitting code does not change and does not need retesting.",
          "The trade is real and worth naming. Once the caller does not know its listeners, you lose the ability to read one file and know what happens next. Debugging gets harder. Loose coupling buys changeability and it pays for it in traceability.",
          "So the goal is not to make everything as loosely coupled as possible. It is to put the seams where change is likely and keep direct calls everywhere else.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "EventEmitter behaviour is documented in the Node.js events API reference. The delegation and loose coupling framing follows Head First OOA&D Ch 4. The trade-off discussion is my interpretation, not a claim from either source.",
      },
    ],
  },
  {
    slug: "open-for-extension",
    trackId: "object-design",
    title: "Open for extension",
    blurb: "Adding a fourth shipping method should not mean editing checkout. Rearrange until it does not.",
    syllabusRef: "Head First OOA&D, Ch 8 Design Principles (OCP, SRP, DRY)",
    minutes: 12,
    prerequisites: ["blast-radius"],
    phases: [
      {
        kind: "predict",
        prompt:
          "Checkout holds the rate logic for bike and van. Freight holds the rate for air. You add drone delivery. What has to be edited?",
        options: [
          "Just a new drone class",
          "Checkout only",
          "Checkout and Freight",
          "Checkout, Freight, and whatever depends on them",
        ],
        correctIndex: 3,
        afterword:
          "Rate logic living in two classes means a new rate touches both, and both have dependants that come along for the ride.",
      },
      {
        kind: "play",
        brief:
          "The shipping rates are scattered across Checkout and Freight. Gather them so adding a rate touches one blueprint, keep billing in a blueprint nothing depends on, and leave nothing empty.",
        puzzleId: "open-closed-shipping",
      },
      {
        kind: "reveal",
        heading: "Open for extension, closed for modification",
        body: [
          "The Open-Closed Principle says you should be able to add behaviour by adding code, not by editing code that already works.",
          "The reason is risk, not tidiness. Code that has been running in production for a year is code you have evidence about. Editing it puts that evidence at risk. Adding a new file next to it does not.",
          "The mechanism is almost always the same. Find the thing that varies, name it as an interface, and let each variation be its own small class. Then the code that uses it depends on the interface and never learns about the new variation.",
          "Notice this puzzle also asked you to keep billing out of the rate blueprint. That is the Single Responsibility Principle doing its job. A class should have one reason to change. Mixing rates and invoicing means a tax rule change and a courier change both land in the same file, and neither of those changes has anything to do with the other.",
          "One warning. Applying this everywhere produces a codebase of forty tiny interfaces, each with one implementation, and that is worse than the problem. Reach for it when you already know a thing varies, not when you suspect it might.",
        ],
      },
      {
        kind: "implement",
        heading: "Adding a rate without touching checkout",
        language: "typescript",
        code: `export interface ShippingRate {
  readonly method: string;
  quote(distanceKm: number, weightKg: number): number;
}

export class RateBook {
  private readonly rates = new Map<string, ShippingRate>();

  register(rate: ShippingRate): void {
    this.rates.set(rate.method, rate);
  }

  quote(method: string, distanceKm: number, weightKg: number): number {
    const rate = this.rates.get(method);
    if (!rate) {
      throw new Error(\`No shipping rate registered for "\${method}".\`);
    }
    return rate.quote(distanceKm, weightKg);
  }
}

export class DroneRate implements ShippingRate {
  readonly method = "drone";

  quote(distanceKm: number, weightKg: number): number {
    if (weightKg > 5) {
      throw new RangeError("Drone delivery is limited to 5kg.");
    }
    return 12000 + distanceKm * 1500;
  }
}`,
        notes: [
          "Adding drone delivery is a new file and one register call at startup. RateBook and every caller stay untouched.",
          "The weight limit lives inside DroneRate. Checkout does not need a special case for drones, which is the point.",
          "A missing method throws rather than returning zero. A silent zero would ship free parcels, and a loud failure at the boundary is much easier to find.",
        ],
      },
      {
        kind: "case",
        heading: "Array.prototype.sort was designed this way",
        body: [
          "You have used this principle without calling it that. JavaScript's sort takes a comparison function. So does Java's Collections.sort with a Comparator, and Python's sorted with a key.",
          "The sorting algorithm itself is closed. Nobody edits the engine's sort implementation to teach it about your Invoice type. You extend it by passing in the one piece that varies, which is how two items compare.",
          "That is a good test for your own designs. If a caller can get new behaviour by handing you an object rather than by asking you to edit your class, you have got the seam in the right place.",
          "It also shows the limit. Sort exposes exactly one extension point, not ten. The design works because whoever built it knew which single thing would vary.",
        ],
        confidence: "verified",
        sourceNote:
          "Comparator-based sorting APIs are specified in ECMA-262 for Array.prototype.sort, in the Java SE API docs for Collections.sort, and in the Python standard library docs for sorted. The OCP framing follows Head First OOA&D Ch 8.",
      },
    ],
  },
];
