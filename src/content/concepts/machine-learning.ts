import type { Concept } from "@/types/content";

export const machineLearningConcepts: Concept[] = [
  {
    slug: "drawing-the-line",
    trackId: "machine-learning",
    title: "Drawing the line",
    blurb: "Separate two classes by hand, then let a model train on the same points and see who did better.",
    syllabusRef: "Understanding ML, Ch 2 A Gentle Start and Ch 9.1 Halfspaces",
    minutes: 12,
    prerequisites: [],
    phases: [
      {
        kind: "predict",
        prompt:
          "You draw a line that separates every training point correctly. What is your accuracy on points you have never seen?",
        options: [
          "Also perfect, since the line is correct",
          "Usually a bit lower",
          "Impossible to say from the training points alone",
          "Usually higher",
        ],
        correctIndex: 2,
        afterword:
          "Training accuracy tells you how well you fit what you already saw. It is not evidence about new data on its own, which is exactly the problem learning theory exists to handle.",
      },
      {
        kind: "play",
        brief:
          "Drag the two handles to place a dividing line. Filled points are the training set. Press check to score your line on a held-out test set you cannot see while drawing.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "What you just did has a formal name",
        body: [
          "You picked a line, which means you restricted yourself to straight boundaries. That restriction is a hypothesis class. In the book's terms it is the class of halfspaces, and choosing it before you look at the data is called inductive bias.",
          "Then you moved the line to fit the training points as well as you could. That is Empirical Risk Minimisation: pick the hypothesis in your class that makes the fewest mistakes on the sample you have.",
          "The interesting question is why this should work at all on new data. Nothing about fitting the sample logically guarantees anything about the rest of the world.",
          "The answer runs through the restriction. Because you were only allowed straight lines, there were not many genuinely different boundaries available. A class with few options cannot memorise a large sample, so if it fits the sample well, that fit is unlikely to be an accident.",
          "That is the intuition behind PAC learning and the VC dimension. Restricting what you can express is what buys you the right to generalise. Full freedom would let you fit anything and promise nothing.",
        ],
      },
      {
        kind: "implement",
        heading: "Fitting the line instead of dragging it",
        language: "python",
        code: `import numpy as np


def train_logistic_regression(features, labels, learning_rate=0.35, epochs=400):
    weights = np.zeros(features.shape[1])
    bias = 0.0
    sample_count = features.shape[0]

    for _ in range(epochs):
        scores = features @ weights + bias
        predictions = 1.0 / (1.0 + np.exp(-scores))
        errors = predictions - labels

        weights -= learning_rate * (features.T @ errors) / sample_count
        bias -= learning_rate * errors.mean()

    return weights, bias


def predict(features, weights, bias):
    return (features @ weights + bias >= 0).astype(int)`,
        notes: [
          "The sigmoid turns the raw score into something between zero and one, so the error term is a smooth quantity you can take a gradient of.",
          "Dividing by sample_count keeps the step size stable whether you train on twelve points or twelve thousand.",
          "This is the same shape as gradient descent in Ch 14. The loss is different, the loop is not.",
        ],
      },
      {
        kind: "case",
        heading: "Why the test set has to stay untouched",
        body: [
          "The split you saw in the puzzle is standard practice and it exists for one reason. Accuracy on data used to choose the model is a biased estimate of accuracy on new data.",
          "The subtle failure is not cheating. It is tuning. Every time you check the test set and then adjust something, a little information about that set leaks into your choice. Do it fifty times and your test score has quietly turned into a training score.",
          "The usual defence is three splits. Train on the first, tune against a validation set, and touch the test set once at the end. Cross-validation does the same job when data is scarce, by rotating which slice plays the validation role.",
          "Ch 11 of the book is built around this and its last section is titled 'What to Do If Learning Fails', which is worth reading precisely because it treats a bad result as diagnosable rather than as bad luck.",
        ],
        confidence: "verified",
        sourceNote:
          "Chapter and section titles come from the Cambridge frontmatter for Understanding Machine Learning (ISBN 978-1-107-05713-5): Ch 2 Empirical Risk Minimization, Ch 9.1 Halfspaces, Ch 11.2 Validation, Ch 11.3 What to Do If Learning Fails. The explanations here are written fresh, not quoted.",
      },
    ],
  },
  {
    slug: "memorising-versus-learning",
    trackId: "machine-learning",
    title: "Memorising versus learning",
    blurb: "One setting takes training accuracy to a perfect score and test accuracy down with it.",
    syllabusRef: "Understanding ML, Ch 5 Bias-Complexity Trade-off and Ch 19 Nearest Neighbor",
    minutes: 12,
    prerequisites: ["drawing-the-line"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A nearest neighbour model with k set to 1 labels each point by its single closest training point. What is its training accuracy?",
        options: ["About 50%", "About 80%", "Exactly 100%", "It depends on the data"],
        correctIndex: 2,
        afterword:
          "Every training point is its own nearest neighbour, so it always gets its own label back. A perfect training score here means nothing at all.",
      },
      {
        kind: "play",
        brief:
          "The inner cluster is one class, the outer ring is the other, and two training points are mislabelled noise. Move the k slider and find the setting that clears the target. Watch what happens at both ends of the range.",
        puzzleId: "overfitting-neighbours",
      },
      {
        kind: "reveal",
        heading: "The gap is the whole story",
        body: [
          "At k equal to 1, training accuracy is 100% and test accuracy is not. That gap between the two scores is overfitting, and this is the cleanest demonstration of it there is, because the perfect training score is a mathematical certainty rather than a lucky result.",
          "Raising k makes the model consult more neighbours, so a single odd point can no longer carve out its own territory. The boundary gets smoother. Training accuracy falls and test accuracy usually rises.",
          "Push k too high and it collapses. At the top of this slider, training accuracy drops below 40%, because every point in the small inner cluster is now outvoted by the larger outer ring. The model has stopped responding to real structure entirely. That is underfitting, and it is worse than the overfitting you started with.",
          "Ch 5 calls this the bias-complexity trade-off and decomposes the error into two parts. Approximation error is what you lose by restricting the model. Estimation error is what you lose because you have a finite sample. Making the model simpler cuts the second and grows the first.",
          "There is no setting of k that is right in general. Ch 5 opens with the No-Free-Lunch theorem, which says exactly that: no learner is better than all others across all possible problems. Which is why you validate rather than pick a default and hope.",
        ],
      },
      {
        kind: "implement",
        heading: "Choosing k by validation, not by taste",
        language: "python",
        code: `import numpy as np
from collections import Counter


def classify(point, training_points, training_labels, neighbour_count):
    distances = np.linalg.norm(training_points - point, axis=1)
    nearest = np.argsort(distances)[:neighbour_count]
    return Counter(training_labels[nearest]).most_common(1)[0][0]


def score(candidates, labels, training_points, training_labels, neighbour_count):
    predictions = [
        classify(point, training_points, training_labels, neighbour_count)
        for point in candidates
    ]
    return float(np.mean(np.array(predictions) == labels))


def choose_neighbour_count(training_points, training_labels,
                           validation_points, validation_labels, options):
    return max(
        options,
        key=lambda k: score(validation_points, validation_labels,
                            training_points, training_labels, k),
    )`,
        notes: [
          "choose_neighbour_count never looks at the test set. It picks k against validation data, which keeps the final test score honest.",
          "Odd values of k avoid ties on two-class problems. With an even k you need a tie-breaking rule and the results get harder to reason about.",
          "This implementation compares against every training point on every prediction. That is fine for a teaching example and far too slow for real data, where you would reach for a spatial index.",
        ],
      },
      {
        kind: "case",
        heading: "Why nearest neighbours struggles in high dimensions",
        body: [
          "Nearest neighbours is easy to reason about in two dimensions because 'close' means what your eyes think it means. That intuition breaks down as you add features.",
          "In high-dimensional space, distances between random points concentrate. The nearest point and the farthest point end up at similar distances, so 'nearest' stops carrying much information. Ch 19's analysis covers this and it is the standard argument for why kNN needs a lot of data as dimensions grow.",
          "The practical responses are in the book too. Ch 23 covers dimensionality reduction through PCA and random projections, and Ch 25 covers feature selection. Both are ways of getting the dimension count back down so distance means something again.",
          "The wider point is that a model's failure mode is usually a property of its assumption. kNN assumes nearby points share labels. Anything that damages the meaning of 'nearby' damages the model.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "Ch 19 Nearest Neighbor, Ch 23 Dimensionality Reduction, and Ch 25 Feature Selection and Generation are confirmed chapter titles from the Cambridge frontmatter. Distance concentration in high dimensions is a standard result in the literature. I have not re-derived the specific bounds in Ch 19.2, so treat the analysis reference as a pointer rather than a summary of its exact statement.",
      },
    ],
  },
];
