import type { Concept } from "@/types/content";

export const machineLearningConcepts: Concept[] = [
  // ──────────────────────────────────────────────
  // CONCEPT 1
  // ──────────────────────────────────────────────
  {
    slug: "drawing-the-line",
    trackId: "machine-learning",
    title: "Drawing the line",
    blurb:
      "Separate two classes by hand, then let a model train on the same points and see who did better.",
    syllabusRef: "Burkov Ch 1.3 (SVM intro) and Ch 3.4 (SVM detail)",
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
          "This is the same shape as gradient descent in Ch 4. The loss is different, the loop is not.",
        ],
      },
      {
        kind: "case",
        heading: "Why the test set has to stay untouched",
        body: [
          "The split you saw in the puzzle is standard practice and it exists for one reason. Accuracy on data used to choose the model is a biased estimate of accuracy on new data.",
          "If you tune hyperparameters against a validation set, the validation accuracy is still optimistic, because you chose the hyperparameters that happened to do well on that specific fold. That is why there is a separate test set you never touch until the final evaluation.",
          "Burkov lays this out in Ch 5.3 as the three-set split: training, validation, and test. In practice the exact ratios vary. The principle does not.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 1.3 introduces SVM and the decision boundary concept. Ch 3.4 details hard-margin and soft-margin SVM, the kernel trick, and RBF kernels. The three-set split is in Ch 5.3.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 2
  // ──────────────────────────────────────────────
  {
    slug: "when-neighbours-vote",
    trackId: "machine-learning",
    title: "When neighbours vote",
    blurb:
      "Pick a value of k, watch the boundary reshape itself, and find the setting where it stops memorising noise.",
    syllabusRef: "Burkov Ch 3.5 (k-Nearest Neighbors)",
    minutes: 10,
    prerequisites: ["drawing-the-line"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A kNN model with k = 1 perfectly classifies its own training data. Is that a good sign?",
        options: [
          "Yes, it means the model learned perfectly",
          "It depends on how big the training set is",
          "No, it is overfitting by definition",
          "Only if the data is noiseless",
        ],
        correctIndex: 2,
        afterword:
          "At k = 1 each point is its own nearest neighbour, so training accuracy is trivially 100%. That tells you nothing about what the boundary does between the points, which is where new data will land.",
      },
      {
        kind: "play",
        brief:
          "The inner cluster is one class, the outer ring is the other, and two training points are mislabelled noise. Move the k slider and find the setting that clears the target. Watch what happens at both ends of the range.",
        puzzleId: "overfitting-neighbours",
      },
      {
        kind: "reveal",
        heading: "The bias-variance knob",
        body: [
          "k controls a tradeoff. Low k means the boundary hugs every training point, including noise. That is high variance. The model is flexible enough to memorise the noise, and it will fail on new data drawn from the same distribution but landing in slightly different positions.",
          "High k means every prediction is an average over a large neighbourhood. The boundary smooths out and eventually ignores real structure. That is high bias. The model is too stiff to capture the pattern in the data.",
          "Somewhere in between is a k where the boundary is flexible enough to follow the real clusters but stiff enough to shrug off a couple of mislabelled points. That is the setting you are looking for.",
          "Push k too high and it collapses. At the top of this slider, training accuracy drops below 40%, because every point in the small inner cluster is now outvoted by the larger outer ring. The model has stopped responding to real structure entirely. That is underfitting, and it is worse than the overfitting you started with.",
        ],
      },
      {
        kind: "implement",
        heading: "A kNN classifier from scratch",
        language: "python",
        code: `import numpy as np
from collections import Counter


def euclidean_distances(query, training_features):
    differences = training_features - query
    return np.sqrt((differences ** 2).sum(axis=1))


def knn_predict(query, training_features, training_labels, k):
    distances = euclidean_distances(query, training_features)
    nearest_indices = distances.argsort()[:k]
    nearest_labels = training_labels[nearest_indices]
    vote_counts = Counter(nearest_labels)
    return vote_counts.most_common(1)[0][0]


def evaluate(test_features, test_labels, training_features, training_labels, k):
    predictions = [
        knn_predict(point, training_features, training_labels, k)
        for point in test_features
    ]
    correct = sum(p == t for p, t in zip(predictions, test_labels))
    return correct / len(test_labels)


def find_best_k(validation_features, validation_labels, training_features, training_labels, k_values):
    best_k = k_values[0]
    best_accuracy = 0.0
    for k in k_values:
        accuracy = evaluate(validation_features, validation_labels, training_features, training_labels, k)
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_k = k
    return best_k, best_accuracy`,
        notes: [
          "There is no training step. The entire training set is the model. That is what makes kNN a non-parametric algorithm.",
          "It picks k against validation data, which keeps the final test score honest.",
          "Odd values of k avoid ties on two-class problems. With an even k you need a tie-breaking rule and the results get harder to reason about.",
          "This implementation compares against every training point on every prediction. That is fine for a teaching example and far too slow for real data, where you would reach for a spatial index.",
        ],
      },
      {
        kind: "case",
        heading: "Why nearest neighbours struggles in high dimensions",
        body: [
          "Nearest neighbours is easy to reason about in two dimensions because 'close' means what your eyes think it means. That intuition breaks down as you add features.",
          "In high-dimensional space, distances between random points concentrate. The nearest point and the farthest point end up at similar distances, so 'nearest' stops carrying much information.",
          "The practical responses are dimensionality reduction (PCA, UMAP) and feature selection. Both are ways of getting the dimension count back down so distance means something again.",
          "The wider point is that a model's failure mode is usually a property of its assumption. kNN assumes nearby points share labels. Anything that damages the meaning of 'nearby' damages the model.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "Burkov Ch 3.5 covers kNN, cosine similarity, Euclidean distance, and the cost function analysis from Li and Yang 2003. Distance concentration in high dimensions is a standard result in the literature.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 3 - Ch 1: Introduction
  // ──────────────────────────────────────────────
  {
    slug: "what-machines-actually-learn",
    trackId: "machine-learning",
    title: "What machines actually learn",
    blurb:
      "Before any algorithm, understand what 'learning' means in this field and the four families it splits into.",
    syllabusRef:
      "Burkov Ch 1.1–1.4 (What is ML, Types of Learning, How Supervised Learning Works, Why the Model Works on New Data)",
    minutes: 10,
    prerequisites: [],
    phases: [
      {
        kind: "predict",
        prompt:
          "A model is trained on 10,000 labelled emails and achieves 99% accuracy on that same data. A new batch of 1,000 emails arrives. What can you say about the model's accuracy on the new batch?",
        options: [
          "It will be exactly 99%",
          "It will be close to 99% if the new emails come from a similar distribution",
          "It will be higher because the model has already seen patterns",
          "Nothing at all, because the new emails were not in the training set",
        ],
        correctIndex: 1,
        afterword:
          "The key assumption is distribution. If the new data comes from the same or a similar statistical distribution as the training data, the model's accuracy should be close to what it achieved during training. But 'close' is not 'identical', and 'similar distribution' is doing all the heavy lifting in that sentence.",
      },
      {
        kind: "play",
        brief:
          "Drag the two handles to place a dividing line on the training set. Press check to see how your boundary performs on previously unseen test points. Notice that training accuracy and test accuracy are different numbers.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Four families of learning",
        body: [
          "Supervised learning gets labelled examples, pairs of (input, output). The goal is to find a function that maps new inputs to correct outputs. Spam detection is a textbook example: inputs are email feature vectors, outputs are 'spam' or 'not spam'.",
          "Unsupervised learning gets inputs with no labels at all. The goal is to find structure. Clustering groups similar examples together. Dimensionality reduction compresses features while keeping structure. Outlier detection spots points that do not fit the pattern.",
          "Semi-supervised learning sits between the two. You have a small number of labelled examples and a large pile of unlabelled ones. The hope is that the unlabelled data helps the algorithm find a better model, because a larger sample better reflects the underlying distribution.",
          "Reinforcement learning is sequential decision-making. An agent acts in an environment, gets rewards, and learns a policy that maximises long-term reward. Game playing and robotics are the standard examples. Burkov leaves this out of scope for the rest of the book, and so does this track.",
        ],
      },
      {
        kind: "implement",
        heading: "Turning text into feature vectors",
        language: "python",
        code: `def bag_of_words(documents, vocabulary):
    feature_vectors = []
    for document in documents:
        words_in_document = set(document.lower().split())
        vector = [1 if word in words_in_document else 0 for word in vocabulary]
        feature_vectors.append(vector)
    return feature_vectors


vocabulary = ["buy", "free", "meeting", "report", "winner"]

emails = [
    "Buy now free winner free",
    "Quarterly report meeting notes",
    "Free winner buy today",
]

vectors = bag_of_words(emails, vocabulary)
for email, vector in zip(emails, vectors):
    print(f"{email:40s} -> {vector}")`,
        notes: [
          "This is the bag-of-words representation from Ch 1.3. Each feature is binary: does the word appear or not.",
          "The vocabulary is fixed before you look at any email. That is what makes it a feature vector with a consistent structure across all examples.",
          "Real systems would use much larger vocabularies, word frequencies instead of binary presence, and probably some form of TF-IDF weighting. But the principle is the same: turn raw data into a fixed-length numeric vector.",
        ],
      },
      {
        kind: "case",
        heading: "Why the model works on data it has never seen",
        body: [
          "The short answer is: because it is constrained. A model with full freedom can memorise any dataset, but memorisation tells you nothing about new data.",
          "The longer answer has two parts. First, if the training examples were drawn randomly and independently from some distribution, new examples from the same distribution will statistically land near the training ones. Second, the model is restricted to a particular form, like a hyperplane. That restriction means the model cannot memorise arbitrary data, so when it does fit well, the fit carries information about the real pattern.",
          "Burkov points to PAC learning theory here. PAC stands for 'probably approximately correct'. It formalises the relationship between model complexity, training set size, and the probability of error on new data. The bigger your training set and the simpler your model, the smaller the gap between training and real-world performance.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 1.1 defines ML. Ch 1.2 covers the four types. Ch 1.3 walks through supervised learning end to end using the SVM spam example. Ch 1.4 explains why generalisation works via distribution assumptions and PAC learning.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 4 - Ch 2: Notation and Definitions
  // ──────────────────────────────────────────────
  {
    slug: "notation-and-the-math-you-need",
    trackId: "machine-learning",
    title: "Notation and the math you need",
    blurb:
      "Derivatives, gradients, and the chain rule. Just enough calculus to follow how a model learns.",
    syllabusRef:
      "Burkov Ch 2 (Notation and Definitions: derivatives, gradient, chain rule, random variables, Bayes' theorem)",
    minutes: 14,
    prerequisites: ["what-machines-actually-learn"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A function f(x) = x^2 has its derivative equal to zero at x = 0. What does that tell you?",
        options: [
          "f is zero at that point",
          "f has a minimum or maximum at that point",
          "f is increasing at that point",
          "Nothing useful",
        ],
        correctIndex: 1,
        afterword:
          "When the derivative is zero, the function is flat. That flatness means you are sitting at an extremum, either a minimum or a maximum. In ML, we use this to find parameter values that minimise the cost function.",
      },
      {
        kind: "play",
        brief:
          "Drag the two handles to place a dividing line. Think of the line's position as a parameter you are tuning. When the line is in the worst spot, the error (number of misclassified points) is at its peak. Sliding toward the best spot brings error to its minimum.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "The gradient shows you which way is downhill",
        body: [
          "A derivative tells you how fast a function changes when you nudge its input. If the derivative of the cost with respect to a parameter is positive, increasing that parameter makes things worse. If it is negative, increasing it helps.",
          "The gradient is just the vector of all partial derivatives. Each dimension tells you how to adjust one parameter. Point yourself opposite to the gradient and you are walking downhill on the cost surface.",
          "The chain rule is what makes this practical for complex models. If your model is f(g(x)), you do not need to figure out the derivative of the whole thing at once. You take the derivative of f with respect to g, multiply by the derivative of g with respect to x, and you are done. This is exactly what backpropagation does in neural networks.",
          "Bayes' theorem shows up whenever you want to flip a conditional probability. If you know the probability of seeing certain features given a label, Bayes lets you compute the probability of the label given the features. Naive Bayes classifiers use this directly.",
        ],
      },
      {
        kind: "implement",
        heading: "Computing the gradient for mean squared error",
        language: "python",
        code: `import numpy as np


def compute_mse_gradient(features, labels, weights, bias):
    sample_count = len(labels)
    predictions = features @ weights + bias
    errors = predictions - labels

    gradient_weights = (2 / sample_count) * (features.T @ errors)
    gradient_bias = (2 / sample_count) * errors.sum()

    return gradient_weights, gradient_bias


features = np.array([[1.0], [2.0], [3.0]])
labels = np.array([2.0, 4.0, 6.0])
weights = np.array([1.0])
bias = 0.0

grad_w, grad_b = compute_mse_gradient(features, labels, weights, bias)
print(f"Gradient w.r.t weights: {grad_w}")
print(f"Gradient w.r.t bias:    {grad_b}")`,
        notes: [
          "The gradient of (prediction - label)^2 with respect to weights is 2 * features * error. That comes from applying the chain rule once.",
          "The factor of 2 is a constant. Some implementations drop it because it just scales the learning rate. The math does not care.",
          "This is the exact same partial derivative calculation Burkov shows in Ch 4, eq. 1. The only difference is that here we compute it for the whole batch in one vectorised step.",
        ],
      },
      {
        kind: "case",
        heading:
          "Why you need the chain rule for anything deeper than linear regression",
        body: [
          "Linear regression has one layer of computation: multiply features by weights, add bias, done. You can take the derivative of the cost directly.",
          "The moment you nest two operations, for instance putting the linear output through a sigmoid, you have a composition: f(g(x)). The derivative of the outer function times the derivative of the inner function gives you the gradient. That is the chain rule.",
          "Neural networks are chains of dozens of such compositions. Without the chain rule, computing gradients for the early layers would be intractable. Backpropagation is just the chain rule applied systematically from the output back to the input, which is why Burkov covers the chain rule before covering gradient descent.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 2 covers sigma and pi notation, derivatives, the chain rule with worked examples, and the gradient. The connection to backpropagation is made explicit in Ch 6.2.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 5 - Ch 3.1: Linear Regression
  // ──────────────────────────────────────────────
  {
    slug: "fitting-the-straight-line",
    trackId: "machine-learning",
    title: "Fitting the straight line",
    blurb:
      "Predict a number instead of a class. See why squared error is the standard loss and what overfitting looks like in regression.",
    syllabusRef:
      "Burkov Ch 3.1 (Linear Regression: problem statement, squared error loss, closed-form solution, overfitting)",
    minutes: 12,
    prerequisites: ["notation-and-the-math-you-need"],
    phases: [
      {
        kind: "predict",
        prompt:
          "You fit a degree-10 polynomial to 15 data points and it passes through every single point. Is this a good regression model?",
        options: [
          "Yes, zero error on training data means high quality",
          "Probably not, it is likely overfitting",
          "Only if the data was generated by a polynomial",
          "It depends on the learning rate",
        ],
        correctIndex: 1,
        afterword:
          "A complex polynomial has enough freedom to pass through every point, but the wiggles between points can be wild. A new point that falls between two training points is likely to get a terrible prediction. That is overfitting.",
      },
      {
        kind: "play",
        brief:
          "Place a dividing line on the training points. In regression the goal is the same shape of problem: find the line (or plane) closest to all the data, not separating classes but minimising distance to the points.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Why squared error and why linear",
        body: [
          "The model is f(x) = wx + b. We want wand b such that f(x) is close to the true target y for every training example.",
          "The cost function is the average of (f(x_i) - y_i)^2 across all examples. That is the mean squared error. Why squared? Because the square is smooth and differentiable everywhere, which means you can use calculus to find the optimal parameters directly. Absolute value is not smooth at zero, so it causes headaches for closed-form solutions.",
          "Squaring also penalises big errors more than small ones. If your prediction is off by 10, the squared penalty is 100. If it is off by 1, the penalty is just 1. That forces the model to care more about outliers, which can be a strength or a weakness depending on your data.",
          "Linear models rarely overfit because they have so few parameters. A line in 2D has just two numbers (slope and intercept). Compare that with a degree-10 polynomial that has 11 parameters for the same input. More parameters, more freedom to memorise noise.",
        ],
      },
      {
        kind: "implement",
        heading: "Linear regression the hard way",
        language: "python",
        code: `import numpy as np


def train_linear_regression(features, targets, learning_rate=0.001, epochs=3000):
    weights = np.zeros(features.shape[1])
    bias = 0.0
    sample_count = features.shape[0]

    for epoch in range(epochs):
        predictions = features @ weights + bias
        errors = predictions - targets

        weights -= learning_rate * (2 / sample_count) * (features.T @ errors)
        bias -= learning_rate * (2 / sample_count) * errors.sum()

        if epoch % 1000 == 0:
            mse = (errors ** 2).mean()
            print(f"epoch {epoch:4d}  mse: {mse:.4f}")

    return weights, bias


np.random.seed(42)
x = np.random.uniform(0, 50, size=(200, 1))
y = 0.05 * x.squeeze() + 14 + np.random.normal(0, 2, size=200)

w, b = train_linear_regression(x, y)
print(f"Learned: y = {w[0]:.4f} * x + {b:.4f}")`,
        notes: [
          "This is the exact gradient descent loop Burkov implements in Ch 4 with the radio ad sales dataset.",
          "Linear regression actually has a closed-form solution, so you do not need gradient descent for it. But it is the cleanest possible illustration of how gradient descent works, which is why Burkov uses it here.",
          "The learning rate of 0.001 is small. Too large and the parameters overshoot. Too small and training takes forever. There is no formula for the right value. You try a few and pick what converges.",
        ],
      },
      {
        kind: "case",
        heading: "The real reason we use linear regression",
        body: [
          "It is not the most accurate model. In fact, on most real datasets, tree-based methods or neural networks will beat it. But linear regression has two things going for it that more powerful models do not.",
          "First, it is interpretable. Each weight tells you exactly how much a one-unit change in that feature shifts the prediction. When a product manager asks 'why did the model predict this', you can point at the weights.",
          "Second, it rarely overfits. With few parameters, there is not enough freedom to memorise noise. That makes it a safe baseline. You build a linear model first, measure its performance, and then try something more complex. If the complex model does not beat the linear one by a meaningful margin, the linear model wins because it is simpler.",
          "Burkov makes this point explicitly: people invent new algorithms either because they solve a practical problem better or because they have better theoretical guarantees. Using a complex model when a simple one suffices satisfies neither criterion.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 3.1 covers the problem statement, cost function, closed-form solution, and overfitting via polynomial regression. The point about why linear models remain useful despite limited accuracy is woven through Ch 3.1 and Ch 5.2.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 6 - Ch 3.2: Logistic Regression
  // ──────────────────────────────────────────────
  {
    slug: "predicting-yes-or-no",
    trackId: "machine-learning",
    title: "Predicting yes or no",
    blurb:
      "Turn a linear score into a probability using the sigmoid function. That small twist is what separates regression from classification.",
    syllabusRef:
      "Burkov Ch 3.2 (Logistic Regression: sigmoid, maximum likelihood, log-likelihood)",
    minutes: 11,
    prerequisites: ["fitting-the-straight-line"],
    phases: [
      {
        kind: "predict",
        prompt:
          "Logistic regression outputs a number between 0 and 1. What is that number?",
        options: [
          "The distance from the decision boundary",
          "The probability that the example belongs to the positive class",
          "The confidence of the algorithm",
          "The error rate",
        ],
        correctIndex: 1,
        afterword:
          "The sigmoid squashes the raw score into (0, 1). We interpret the output as the probability that the input belongs to the positive class. Above a threshold (typically 0.5), we predict positive. Below it, negative.",
      },
      {
        kind: "play",
        brief:
          "Place a dividing line between the two classes. In logistic regression, the line is positioned to maximise the likelihood that each point ends up on its correct side, which is slightly different from minimising the distance used in linear regression.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "From linear score to probability",
        body: [
          "Logistic regression starts exactly like linear regression: compute wx + b. But instead of using that number as the prediction, you pass it through the sigmoid function: 1 / (1 + e^(-(wx+b))). When wx + b is very positive, the sigmoid is close to 1. When it is very negative, close to 0.",
          "The training objective is different too. In linear regression, you minimise mean squared error. In logistic regression, you maximise the likelihood of the training labels. If the model says an example has probability 0.9 of being positive and the label is positive, that is a high likelihood. If the label is negative, that is a low likelihood.",
          "In practice, we maximise the log-likelihood instead of the likelihood itself, because multiplying many small probabilities together produces extremely tiny numbers that cause numerical problems. Taking the log turns products into sums, which are much easier for computers to handle.",
          "There is no closed-form solution to this optimisation. You need gradient descent or another iterative solver to find the best w and b.",
        ],
      },
      {
        kind: "implement",
        heading: "Maximum likelihood in code",
        language: "python",
        code: `import numpy as np


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def log_likelihood(features, labels, weights, bias):
    scores = features @ weights + bias
    probabilities = sigmoid(scores)
    log_probs = labels * np.log(probabilities + 1e-15) + \
                (1 - labels) * np.log(1 - probabilities + 1e-15)
    return log_probs.sum()


def train_logistic(features, labels, learning_rate=0.1, epochs=500):
    weights = np.zeros(features.shape[1])
    bias = 0.0
    sample_count = features.shape[0]

    for epoch in range(epochs):
        probabilities = sigmoid(features @ weights + bias)
        errors = probabilities - labels

        weights -= learning_rate * (features.T @ errors) / sample_count
        bias -= learning_rate * errors.mean()

    return weights, bias`,
        notes: [
          "The 1e-15 added inside log() prevents log(0), which would blow up to negative infinity. It is a standard numerical safety trick.",
          "The gradient of log-likelihood with respect to the weights turns out to have the same shape as the MSE gradient: features transposed times errors. The sigmoid is what makes the error term different.",
          "Logistic regression is, mathematically, a single neuron with a sigmoid activation function. That is not a metaphor. It is literally the same computation.",
        ],
      },
      {
        kind: "case",
        heading: "Choosing the decision threshold",
        body: [
          "The default threshold of 0.5 is not always right. In spam detection, you want high precision: do not flag legitimate emails as spam. So you raise the threshold to 0.8 or 0.9. Only if the model is very confident does it mark the email as spam.",
          "In medical screening, you want high recall: do not miss a sick patient. So you lower the threshold. You accept more false positives (healthy people flagged for a follow-up test) to avoid false negatives (sick people sent home).",
          "The threshold is not a parameter of the model. The model is fully determined by w and b. The threshold is a decision you make after training, based on the costs of different kinds of mistakes in your specific application.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 3.2 covers the sigmoid, maximum likelihood, and log-likelihood. The threshold discussion maps to Ch 5.6 (precision, recall, and cost-sensitive accuracy).",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 7 - Ch 3.3: Decision Tree Learning
  // ──────────────────────────────────────────────
  {
    slug: "splitting-by-questions",
    trackId: "machine-learning",
    title: "Splitting by questions",
    blurb:
      "Build a classifier that asks yes-or-no questions about features. Each split reduces uncertainty, and entropy measures how much.",
    syllabusRef:
      "Burkov Ch 3.3 (Decision Tree Learning: ID3 algorithm, entropy, stopping criteria)",
    minutes: 12,
    prerequisites: ["predicting-yes-or-no"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A decision tree splits on the feature that best separates the classes at each step. What happens if you let it keep splitting until every leaf has only one example?",
        options: [
          "You get a perfect, generalisable model",
          "The tree overfits the training data",
          "The tree becomes equivalent to logistic regression",
          "It will not converge",
        ],
        correctIndex: 1,
        afterword:
          "A fully grown tree memorises the training data. Each leaf is one example. Training accuracy is 100%, but the tree has learned the noise along with the signal. It will not generalise.",
      },
      {
        kind: "play",
        brief:
          "Place a dividing line on the training set. A decision tree does something similar but with axis-aligned splits: it picks a feature, picks a threshold, and separates points left and right. Multiple splits in sequence carve out regions.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Entropy measures surprise",
        body: [
          "Entropy is highest when the split is useless: half the examples are positive, half are negative. In that state, looking at the label of a random example gives you no information because either outcome is equally likely.",
          "Entropy is zero when all examples share the same label. There is no surprise because you already know the answer.",
          "The ID3 algorithm picks the split (which feature, which threshold) that produces the biggest drop in entropy. Each split takes you from a mixed bag toward purer groups.",
          "Stopping conditions matter. You stop when all examples in a leaf are the same class, when no split improves entropy by at least some threshold epsilon, or when the tree hits a maximum depth d. Both epsilon and d are hyperparameters you tune experimentally.",
          "Because each split decision is local (it does not look ahead at future splits), ID3 does not guarantee a globally optimal tree. It is a greedy algorithm. But in practice, greedy trees are fast and work well enough that they became building blocks for much more powerful methods like random forests and gradient boosting.",
        ],
      },
      {
        kind: "implement",
        heading: "Entropy and information gain",
        language: "python",
        code: `import numpy as np


def entropy(labels):
    if len(labels) == 0:
        return 0.0
    positive_fraction = labels.mean()
    if positive_fraction == 0 or positive_fraction == 1:
        return 0.0
    return -(positive_fraction * np.log2(positive_fraction) +
             (1 - positive_fraction) * np.log2(1 - positive_fraction))


def information_gain(labels, left_labels, right_labels):
    total = len(labels)
    parent_entropy = entropy(labels)
    weighted_child_entropy = (
        (len(left_labels) / total) * entropy(left_labels) +
        (len(right_labels) / total) * entropy(right_labels)
    )
    return parent_entropy - weighted_child_entropy


labels = np.array([1, 1, 0, 0, 1, 0])
left = np.array([1, 1, 1])
right = np.array([0, 0, 0])

print(f"Parent entropy:     {entropy(labels):.4f}")
print(f"Information gain:   {information_gain(labels, left, right):.4f}")`,
        notes: [
          "A perfect split has information gain equal to the parent entropy, because both children have zero entropy.",
          "A useless split (random partition) has information gain close to zero.",
          "Burkov uses natural log (ln) for entropy in the ID3 formulation. Using log base 2 gives entropy in bits, which is more intuitive. The maths is identical up to a constant factor.",
        ],
      },
      {
        kind: "case",
        heading: "Trees as building blocks",
        body: [
          "On their own, decision trees are okay. They handle categorical features natively, they are easy to interpret, and they are fast.",
          "But their real power shows up when you combine many of them. Random forest trains hundreds of trees on random subsets of the data and averages their predictions. Gradient boosting trains trees sequentially, where each new tree corrects the mistakes of the ensemble so far.",
          "Both methods are covered later in this track. The point for now is that understanding how a single tree works is prerequisite knowledge for understanding the most powerful classical ML algorithms in practice.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 3.3 covers ID3, entropy, information gain, and stopping criteria. The connection to ensemble methods is made in Ch 7.5.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 8 - Ch 4: Anatomy of a Learning Algorithm
  // ──────────────────────────────────────────────
  {
    slug: "the-learning-machine",
    trackId: "machine-learning",
    title: "The learning machine",
    blurb:
      "Every learning algorithm has three parts: a loss function, an optimisation criterion, and a solver. See the pattern.",
    syllabusRef:
      "Burkov Ch 4 (Anatomy of a Learning Algorithm, Gradient Descent, SGD, Adam)",
    minutes: 13,
    prerequisites: ["notation-and-the-math-you-need"],
    phases: [
      {
        kind: "predict",
        prompt:
          "Gradient descent updates parameters by moving in the direction of the negative gradient. What happens if the learning rate is too large?",
        options: [
          "The model converges faster",
          "The model overshoots the minimum and may diverge",
          "The gradient becomes zero",
          "The model underfits",
        ],
        correctIndex: 1,
        afterword:
          "A big step can jump past the minimum entirely. On the next step, the gradient points back, so the parameters bounce back and forth, sometimes getting worse with each iteration. The standard fix is to start with a smaller learning rate.",
      },
      {
        kind: "play",
        brief:
          "Place the dividing line. As you drag it, notice how misclassifications change. Gradient descent does the same thing, but instead of dragging, it computes the direction that reduces errors and takes a small step. Repeat for many steps and the line converges to a good position.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "The three building blocks",
        body: [
          "Part one: the loss function. It measures how wrong a single prediction is. Squared error for regression. Log-likelihood for classification. There are others, but they all answer the same question: how bad is this prediction?",
          "Part two: the optimisation criterion. This is usually the average loss across all training examples, sometimes with a regularisation penalty added. It is the single number you are trying to minimise.",
          "Part three: the solver. Gradient descent is the most common. At each step, compute the gradient of the cost with respect to every parameter, then move each parameter a little in the direction that reduces the cost.",
          "Stochastic gradient descent (SGD) speeds things up by computing the gradient on a random subset (a mini-batch) of the training data instead of the whole thing. The gradient is noisier, but each step is much cheaper. With enough steps, the noise averages out.",
          "Fancier solvers like Adagrad, RMSprop, and Adam adapt the learning rate per parameter. Adam is the default choice for neural network training today. Burkov mentions all of these in Ch 4.",
        ],
      },
      {
        kind: "implement",
        heading: "Gradient descent for linear regression, step by step",
        language: "python",
        code: `import numpy as np


def gradient_descent(features, targets, learning_rate=0.001, epochs=5000):
    sample_count = features.shape[0]
    weight = 0.0
    bias = 0.0

    for epoch in range(epochs):
        predictions = features * weight + bias
        errors = predictions - targets

        weight_gradient = (-2 / sample_count) * (features * errors).sum()
        bias_gradient = (-2 / sample_count) * errors.sum()

        weight = weight - learning_rate * weight_gradient
        bias = bias - learning_rate * bias_gradient

        if epoch % 1000 == 0:
            loss = (errors ** 2).mean()
            print(f"epoch {epoch:5d}  loss: {loss:.2f}")

    return weight, bias


spendings = np.array([37.8, 39.3, 45.9, 41.3, 36.9, 43.2, 38.5, 44.1, 40.0, 42.7])
sales = np.array([22.1, 10.4, 9.3, 18.5, 12.8, 15.7, 20.1, 11.3, 14.9, 16.2])

w, b = gradient_descent(spendings, sales)
print(f"Model: sales = {w:.4f} * spendings + {b:.4f}")`,
        notes: [
          "This is the same structure as Burkov's Python example in Ch 4.2, simplified to one feature.",
          "The loss decreases with each epoch. If it does not, your learning rate is too high or there is a bug in the gradient calculation.",
          "One full pass through the training data is one epoch. Burkov notes that typically you need multiple epochs before parameters settle.",
        ],
      },
      {
        kind: "case",
        heading: "You almost never implement this yourself",
        body: [
          "Burkov is very direct about this in Ch 4.3. Unless you are a researcher, you use libraries. scikit-learn for classical ML. PyTorch or TensorFlow for neural networks.",
          "The value of understanding gradient descent is not in reimplementing it. It is in debugging. When your model does not converge, you need to know whether the learning rate is wrong, the features are on wildly different scales, or the cost surface has a bad shape.",
          "Understanding the machinery also helps you read documentation. When a library says 'optimizer: Adam, lr: 3e-4', you know what that means and roughly what to try if results are poor.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 4.1 identifies the three building blocks. Ch 4.2 implements gradient descent in Python. Ch 4.3 shows the scikit-learn equivalent. Ch 4.4 discusses particularities like categorical features and class weighting.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 9 - Ch 5.1–5.4: Feature Engineering and Data Splits
  // ──────────────────────────────────────────────
  {
    slug: "preparing-your-data",
    trackId: "machine-learning",
    title: "Preparing your data",
    blurb:
      "Feature engineering, normalisation, handling missing values, and the three-set split. The unsexy work that determines whether your model actually works.",
    syllabusRef:
      "Burkov Ch 5.1–5.4 (Feature Engineering, One-Hot Encoding, Binning, Normalization, Standardization, Missing Features, Three Sets, Underfitting, Overfitting)",
    minutes: 14,
    prerequisites: ["the-learning-machine"],
    phases: [
      {
        kind: "predict",
        prompt:
          "Feature A ranges from 0 to 1000. Feature B ranges from 0 to 0.001. You train a linear model without normalising. Which feature will dominate the gradient updates?",
        options: [
          "Feature B, because small values are more sensitive",
          "Feature A, because its larger values produce larger gradients",
          "Neither, the algorithm compensates automatically",
          "It depends on the number of training examples",
        ],
        correctIndex: 1,
        afterword:
          "The partial derivative with respect to a feature is proportional to the feature's value. A feature with values in the thousands will produce gradients thousands of times larger than a feature with values near zero. That makes the parameter for the smaller feature update very slowly.",
      },
      {
        kind: "play",
        brief:
          "Place the line. If the two axes of the training data had very different scales, you would need to drag much more carefully in one direction than the other. Normalisation puts both axes on the same footing.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Getting the data into shape",
        body: [
          "One-hot encoding converts categorical features into binary vectors. If colour has three values (red, yellow, green), you create three binary features: [1,0,0] for red, [0,1,0] for yellow, [0,0,1] for green. You do not assign numbers like 1, 2, 3 because that implies an ordering that does not exist.",
          "Normalisation squashes values into [0, 1] using min-max scaling: (x - min) / (max - min). Standardisation rescales to mean 0 and standard deviation 1 using z-scores: (x - mean) / std. Both prevent large-valued features from dominating gradient updates.",
          "Rule of thumb from Burkov: use standardisation when features are roughly normally distributed or when there are outliers (normalisation would squeeze everything else into a tiny range). Use normalisation in other cases.",
          "Missing values need a strategy. Replace with the feature mean. Replace with a value outside the normal range so the model can learn to handle it. Or use the missing feature as a regression target: train a model on the other features to predict the missing one.",
          "The three-set split: training (build the model), validation (choose hyperparameters and compare models), test (final evaluation, touched exactly once). If you peek at the test set during development, your reported performance is no longer trustworthy.",
        ],
      },
      {
        kind: "implement",
        heading: "Normalisation and standardisation",
        language: "python",
        code: `import numpy as np


def normalise(values):
    minimum = values.min()
    maximum = values.max()
    return (values - minimum) / (maximum - minimum)


def standardise(values):
    mean = values.mean()
    std = values.std()
    return (values - mean) / std


raw = np.array([350, 700, 1100, 1450, 900])

print(f"Original:      {raw}")
print(f"Normalised:    {normalise(raw)}")
print(f"Standardised:  {standardise(raw)}")`,
        notes: [
          "Normalisation maps to [0, 1]. Standardisation maps to mean 0, std 1. Neither changes the order or relative spacing of the values.",
          "Compute the min, max, mean, and std from the training set only. Apply the same values to validation and test data. If you compute stats on the test set, you are leaking information about the test distribution into your preprocessing.",
        ],
      },
      {
        kind: "case",
        heading: "Underfitting versus overfitting",
        body: [
          "Underfitting: the model cannot even fit the training data well. It has high bias. The fix is usually a more complex model or better features.",
          "Overfitting: the model fits training data perfectly but fails on new data. It has high variance. The fix is a simpler model, more training data, or regularisation.",
          "Burkov illustrates this in Ch 5.4 with three regression fits: a line (underfitting), a quadratic (good fit), and a degree-15 polynomial (overfitting). The visual is intuitive. The quadratic captures the trend without chasing every data point.",
          "Most real-world ML work is spent navigating between these two failure modes. The next concept covers the tools for that navigation: regularisation and hyperparameter tuning.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 5.1 covers feature engineering including one-hot, binning, normalisation, standardisation, and missing values. Ch 5.3 covers the three-set split. Ch 5.4 defines underfitting and overfitting with the polynomial illustration.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 10 - Ch 5.5–5.7: Regularisation and Assessment
  // ──────────────────────────────────────────────
  {
    slug: "keeping-the-model-honest",
    trackId: "machine-learning",
    title: "Keeping the model honest",
    blurb:
      "Regularisation prevents overfitting. Precision, recall, and AUC measure what accuracy cannot. Cross-validation stretches small datasets.",
    syllabusRef:
      "Burkov Ch 5.5–5.7 (Regularization L1/L2, Model Performance Assessment, Confusion Matrix, Precision/Recall, AUC, Hyperparameter Tuning, Cross-Validation)",
    minutes: 15,
    prerequisites: ["preparing-your-data"],
    phases: [
      {
        kind: "predict",
        prompt:
          "Your spam detector has 99% accuracy. But 1% of emails are spam and it marks everything as 'not spam'. Is 99% accuracy meaningful here?",
        options: [
          "Yes, 99% is excellent",
          "No, the model has not learned anything about spam",
          "It depends on the dataset size",
          "Accuracy is always the best metric",
        ],
        correctIndex: 1,
        afterword:
          "When classes are imbalanced, accuracy is misleading. A model that always predicts the majority class gets high accuracy by default. Precision and recall tell you whether the model actually learned to identify the minority class.",
      },
      {
        kind: "play",
        brief:
          "Place the line. After checking, look at how many false positives and false negatives your boundary produces. That trade-off is what precision and recall capture.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Regularisation, assessment, and tuning",
        body: [
          "L1 regularisation adds |w| (sum of absolute values of weights) to the cost. It pushes unimportant weights to exactly zero, which means it does feature selection. L2 regularisation adds ||w||^2 (sum of squared weights). It keeps weights small but rarely zero. L2 usually gives better prediction accuracy. L1 gives simpler, more interpretable models.",
          "The confusion matrix shows true positives, true negatives, false positives, and false negatives. Precision = TP / (TP + FP). Recall = TP / (TP + FN). You almost never get both high. Raising the classification threshold increases precision (fewer false alarms) at the cost of recall (more missed positives).",
          "The ROC curve plots true positive rate against false positive rate at different thresholds. AUC (area under this curve) summarises classifier quality in a single number. Random guessing gives AUC = 0.5. Perfect classification gives AUC = 1.",
          "Hyperparameters (C in SVM, learning rate, tree depth) are not learned by the algorithm. You find good values by grid search or random search over a validation set. Cross-validation helps when you do not have enough data for a separate validation set: split training data into k folds, train on k-1 and validate on the remaining fold, rotate, and average the results.",
        ],
      },
      {
        kind: "implement",
        heading: "Precision, recall, and the confusion matrix",
        language: "python",
        code: `import numpy as np


def confusion_matrix(actual, predicted):
    true_positives = ((actual == 1) & (predicted == 1)).sum()
    false_positives = ((actual == 0) & (predicted == 1)).sum()
    false_negatives = ((actual == 1) & (predicted == 0)).sum()
    true_negatives = ((actual == 0) & (predicted == 0)).sum()
    return true_positives, false_positives, false_negatives, true_negatives


def precision(tp, fp):
    return tp / (tp + fp) if (tp + fp) > 0 else 0.0


def recall(tp, fn):
    return tp / (tp + fn) if (tp + fn) > 0 else 0.0


actual = np.array([1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
predicted = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 1])

tp, fp, fn, tn = confusion_matrix(actual, predicted)
print(f"TP={tp}  FP={fp}  FN={fn}  TN={tn}")
print(f"Precision: {precision(tp, fp):.2f}")
print(f"Recall:    {recall(tp, fn):.2f}")`,
        notes: [
          "Precision answers: of the things I flagged as positive, how many were actually positive?",
          "Recall answers: of the things that were actually positive, how many did I catch?",
          "In spam detection, you want high precision (do not flag real emails). In medical screening, you want high recall (do not miss sick patients).",
        ],
      },
      {
        kind: "case",
        heading: "The bias-variance tradeoff, formalised",
        body: [
          "Regularisation is the main tool for navigating the bias-variance tradeoff. The regularisation hyperparameter C controls how much weight the penalty gets relative to the loss.",
          "Set C = 0 and you have no regularisation. The model can overfit freely. Set C very high and the model is so constrained it underfits. Somewhere in between is the sweet spot.",
          "You find that sweet spot by trying different values of C, evaluating each on the validation set, and picking the one that gives the best metric. That is hyperparameter tuning. It is boring, it is necessary, and it is where a lot of the actual improvement in model quality comes from.",
          "Burkov calls this out plainly: the process of machine learning in practice is largely about choosing the right model complexity, the right regularisation strength, and the right features. The algorithm itself is often a secondary concern.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 5.5 covers L1 and L2 regularisation with the explicit cost function formulas. Ch 5.6 covers the confusion matrix, precision, recall, accuracy, cost-sensitive accuracy, and AUC. Ch 5.7 covers grid search, random search, and cross-validation.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 11 - Ch 6.1: Neural Networks
  // ──────────────────────────────────────────────
  {
    slug: "layers-that-learn",
    trackId: "machine-learning",
    title: "Layers that learn",
    blurb:
      "A neural network is nested functions. Each layer applies weights, adds bias, and passes through an activation. Stack enough layers and you can model almost anything.",
    syllabusRef:
      "Burkov Ch 6.1 (Neural Networks: MLP, activation functions, fully-connected layers) and Ch 6.2 intro (deep learning, vanishing gradient, backpropagation)",
    minutes: 14,
    prerequisites: ["predicting-yes-or-no", "the-learning-machine"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A neural network with only linear activation functions (no sigmoid, no ReLU) in every layer. How does it compare to logistic regression?",
        options: [
          "It is much more powerful because it has more layers",
          "It is equivalent to a single linear model, no matter how many layers",
          "It can model non-linear relationships but more slowly",
          "It cannot be trained with gradient descent",
        ],
        correctIndex: 1,
        afterword:
          "A linear function of a linear function is still linear. Without non-linear activation functions, adding layers does nothing. The entire multi-layer network collapses to a single linear transformation. Non-linearity is the whole point of stacking layers.",
      },
      {
        kind: "play",
        brief:
          "Place the line. Logistic regression is a neural network with one layer and a sigmoid activation. The puzzle's dividing line is that single layer. To model curved boundaries you would need more layers, which is what deep learning provides.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "How a neural network is built",
        body: [
          "Each layer takes an input vector, multiplies it by a weight matrix W, adds a bias vector b, and passes the result through an activation function g. The output of one layer becomes the input to the next.",
          "For a three-layer network: y = f3(f2(f1(x))), where each f_l(z) = g_l(W_l * z + b_l). Compare this with logistic regression: y = sigmoid(w * x + b). Logistic regression is literally a one-layer neural network with sigmoid activation.",
          "Activation functions introduce non-linearity. The sigmoid squashes to (0,1). TanH squashes to (-1,1). ReLU outputs zero for negative inputs and the input itself for positive inputs. ReLU is the default choice today because it does not suffer as badly from the vanishing gradient problem.",
          "The vanishing gradient problem: in deep networks trained with backpropagation, gradients get multiplied through many layers. If each multiplication shrinks the gradient (which happens with sigmoid and tanh), the earlier layers barely update. ReLU helps because its gradient is either 0 or 1, so there is no shrinkage for positive inputs.",
          "The fully-connected (or dense) layer is the simplest: every output of the previous layer connects to every input of the next. CNNs and RNNs use different connectivity patterns, which we cover in the next two concepts.",
        ],
      },
      {
        kind: "implement",
        heading: "A two-layer neural network from scratch",
        language: "python",
        code: `import numpy as np


def relu(z):
    return np.maximum(0, z)


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def forward(x, w1, b1, w2, b2):
    hidden = relu(x @ w1 + b1)
    output = sigmoid(hidden @ w2 + b2)
    return hidden, output


np.random.seed(42)
input_dim = 2
hidden_dim = 4
output_dim = 1

w1 = np.random.randn(input_dim, hidden_dim) * 0.5
b1 = np.zeros(hidden_dim)
w2 = np.random.randn(hidden_dim, output_dim) * 0.5
b2 = np.zeros(output_dim)

x = np.array([[1.0, 2.0], [-1.0, -2.0], [3.0, -1.0]])
hidden, output = forward(x, w1, b1, w2, b2)
print(f"Output probabilities: {output.squeeze()}")`,
        notes: [
          "Layer 1 uses ReLU. Layer 2 uses sigmoid for binary classification. This is the standard architecture for a two-layer classifier.",
          "Weights are initialised randomly. Zero-initialising all weights would mean every neuron computes the same thing and the network cannot learn. Random initialisation breaks this symmetry.",
          "Training this network requires backpropagation: compute the loss, then propagate gradients backward through both layers using the chain rule. Libraries handle this automatically.",
        ],
      },
      {
        kind: "case",
        heading: "When do you need more than one layer?",
        body: [
          "If your data is linearly separable, a single layer (logistic regression) is enough. There is no benefit to making the model more complex.",
          "If the decision boundary is curved, smooth, and reasonably simple, two or three hidden layers typically suffice. Most business classification problems fall here.",
          "If the input is images, audio, or text, you often need specialised architectures (CNNs, RNNs, transformers) with many layers. These are covered in the next two concepts.",
          "Burkov's rule of thumb: start with a simple model, increase complexity until training loss is low, then regularise until validation performance is good. Do not start deep.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 6.1 covers the MLP architecture, activation functions, and fully-connected layers. Ch 6.2 introduces deep learning, the vanishing gradient problem, and ReLU as a mitigation.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 12 - Ch 6.2.1: CNNs
  // ──────────────────────────────────────────────
  {
    slug: "seeing-with-filters",
    trackId: "machine-learning",
    title: "Seeing with filters",
    blurb:
      "Convolutional neural networks slide small filters across images to detect local patterns. They reduce parameters dramatically compared to fully-connected layers.",
    syllabusRef:
      "Burkov Ch 6.2.1 (CNN: convolution operation, filters, volumes, moving window)",
    minutes: 12,
    prerequisites: ["layers-that-learn"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A 100x100 grayscale image is fed to a fully-connected layer with 1000 units. How many weight parameters does that layer have?",
        options: ["100,000", "1,000,000", "10,000,000", "10,000"],
        correctIndex: 2,
        afterword:
          "The input has 100 * 100 = 10,000 pixels. Each of the 1000 units connects to every pixel, so you get 10,000 * 1000 = 10,000,000 weights. That is just one layer. This is why fully-connected networks are impractical for image input. CNNs fix this by sharing weights across spatial positions.",
      },
      {
        kind: "play",
        brief:
          "Place the line. CNNs are a different approach to the same problem: instead of working on raw pixel values directly, they first extract features (edges, textures, shapes) through convolution, then classify based on those features.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "How convolution works",
        body: [
          "A filter is a small matrix, say 3x3. You slide it across the image one position at a time. At each position, you compute the dot product of the filter with the patch of pixels underneath it, then sum the values. The result is a single number. Repeat for every position and you get a new, smaller matrix called the feature map.",
          "Different filters detect different patterns. A filter with high values in a cross pattern responds strongly to cross-shaped patches. A filter with a horizontal gradient detects horizontal edges. The key insight: you do not design these filters by hand. The network learns them through backpropagation.",
          "Because the same filter is applied at every position, the number of parameters is just the size of the filter (9 numbers for 3x3) plus a bias. Compare that with 10 million for a fully-connected layer. This weight sharing is what makes CNNs practical.",
          "Multiple filters in one layer each produce a different feature map. The collection of feature maps is called a volume. The next convolutional layer slides its filters across this volume, not the original image, so it detects combinations of the features found by the previous layer.",
          "Burkov notes that strides (how far the filter moves between positions), padding (handling edges), and pooling (downsampling the feature maps) are essential features he leaves for further reading.",
        ],
      },
      {
        kind: "implement",
        heading: "Manual 2D convolution",
        language: "python",
        code: `import numpy as np


def convolve_2d(image, kernel):
    image_height, image_width = image.shape
    kernel_height, kernel_width = kernel.shape
    output_height = image_height - kernel_height + 1
    output_width = image_width - kernel_width + 1
    output = np.zeros((output_height, output_width))

    for row in range(output_height):
        for col in range(output_width):
            patch = image[row:row + kernel_height, col:col + kernel_width]
            output[row, col] = (patch * kernel).sum()

    return output


image = np.array([
    [0, 1, 0, 1, 0],
    [1, 1, 1, 0, 0],
    [0, 1, 0, 0, 1],
    [1, 0, 0, 1, 1],
    [0, 0, 1, 1, 0],
], dtype=float)

edge_filter = np.array([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1],
], dtype=float)

feature_map = convolve_2d(image, edge_filter)
print("Feature map:")
print(feature_map)`,
        notes: [
          "This edge detection filter has a positive center surrounded by negative values. It responds strongly to pixels that differ from their neighbours.",
          "In a real CNN, you would not write this loop. GPU-accelerated libraries (PyTorch, TensorFlow) handle convolution orders of magnitude faster.",
          "The output is smaller than the input because the filter cannot slide beyond the edges. Padding (adding zeros around the border) keeps the output the same size.",
        ],
      },
      {
        kind: "case",
        heading: "Why CNNs work for images",
        body: [
          "Two properties of images make CNNs the right architecture. First, locality: nearby pixels are more related than distant ones. A 3x3 filter captures this local structure without wasting parameters on distant relationships.",
          "Second, translation invariance: a cat in the top-left corner of an image and a cat in the bottom-right look the same. Because the same filter slides across the entire image, the network detects the pattern regardless of where it appears.",
          "These same properties make CNNs useful for text classification too. A 1D convolutional filter can slide across a sequence of word embeddings to detect local n-gram patterns.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 6.2.1 covers the convolution operation, filters, volumes, the moving window, and the parameter reduction compared to fully-connected layers.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 13 - Ch 6.2.2: RNNs
  // ──────────────────────────────────────────────
  {
    slug: "remembering-sequences",
    trackId: "machine-learning",
    title: "Remembering sequences",
    blurb:
      "Recurrent networks process inputs one step at a time and carry a memory state forward. Gated units solve the problem of forgetting.",
    syllabusRef:
      "Burkov Ch 6.2.2 (RNN: recurrent layers, LSTM, GRU, vanishing gradient in sequences) and Ch 7.7 (Seq2Seq, encoder-decoder, attention)",
    minutes: 13,
    prerequisites: ["layers-that-learn"],
    phases: [
      {
        kind: "predict",
        prompt:
          "A vanilla RNN reads a 500-word sentence. By the time it reaches word 500, how much does it remember about word 1?",
        options: [
          "Everything, because the state carries all information",
          "Very little, because the state gets overwritten at each step",
          "Exactly the same as word 499",
          "It depends on the vocabulary size",
        ],
        correctIndex: 1,
        afterword:
          "In a vanilla RNN, the state is updated at every timestep by combining the new input with the old state. After hundreds of steps, early information has been washed out by all the subsequent updates. This is the long-term dependency problem, and it is why gated units (LSTM, GRU) were invented.",
      },
      {
        kind: "play",
        brief:
          "Place the line. RNNs solve a different shape of problem - sequential data rather than fixed-length feature vectors - but the core idea of learning parameters via gradient descent is the same.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Recurrence, gates, and sequences",
        body: [
          "An RNN unit has a state vector h. At each timestep t, it reads input x_t, combines it with the previous state h_{t-1}, applies an activation function, and produces a new state h_t. The same weights are shared across all timesteps, so the number of parameters does not grow with sequence length.",
          "The vanishing gradient problem hits hard here. Backpropagation through time unfolds the network across all timesteps. If each step shrinks the gradient slightly, by the time you reach the first timestep the gradient is near zero and the early parameters barely update.",
          "Gated Recurrent Units (GRU) fix this with a gate mechanism. A gate is a sigmoid that controls how much of the old state to keep versus how much to overwrite with new information. When the gate is close to 0, the state is preserved. When close to 1, it is updated. The network learns when to remember and when to forget.",
          "LSTM (Long Short-Term Memory) is similar but with more gates. It has an input gate, a forget gate, and an output gate. More parameters, more control over memory. In practice, GRU and LSTM perform similarly on most tasks.",
          "Sequence-to-sequence models use an encoder RNN to read the input sequence and produce an embedding vector, and a decoder RNN to generate the output sequence from that embedding. Machine translation is the classic application. The attention mechanism improves this by allowing the decoder to look back at different parts of the encoder's output at each step, rather than relying on a single fixed-length embedding.",
        ],
      },
      {
        kind: "implement",
        heading: "A minimal GRU cell",
        language: "python",
        code: `import numpy as np


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def gru_step(input_vector, previous_state, weight_input, weight_state,
             bias, gate_weight_input, gate_weight_state, gate_bias):
    candidate = np.tanh(weight_input @ input_vector +
                        weight_state @ previous_state + bias)

    gate = sigmoid(gate_weight_input @ input_vector +
                   gate_weight_state @ previous_state + gate_bias)

    new_state = gate * candidate + (1 - gate) * previous_state

    return new_state


state_dim = 3
input_dim = 2
np.random.seed(42)

w_input = np.random.randn(state_dim, input_dim) * 0.1
w_state = np.random.randn(state_dim, state_dim) * 0.1
b = np.zeros(state_dim)
gw_input = np.random.randn(state_dim, input_dim) * 0.1
gw_state = np.random.randn(state_dim, state_dim) * 0.1
gb = np.zeros(state_dim)

state = np.zeros(state_dim)
sequence = [np.array([1.0, 0.0]), np.array([0.0, 1.0]), np.array([1.0, 1.0])]

for step, x in enumerate(sequence):
    state = gru_step(x, state, w_input, w_state, b, gw_input, gw_state, gb)
    print(f"Step {step}: state = {state}")`,
        notes: [
          "This is the minimal gated GRU from Burkov Ch 6.2.2. The gate decides how much of the old state to keep.",
          "When the gate is near 0, the state carries forward unchanged, which is how the network remembers things from earlier in the sequence.",
          "In practice you use library implementations (PyTorch's nn.GRU or nn.LSTM), not hand-rolled cells. But understanding the gate mechanism helps you debug sequence models.",
        ],
      },
      {
        kind: "case",
        heading: "RNNs versus transformers",
        body: [
          "Burkov's book predates the dominance of transformer architectures. Since its publication, transformers (the architecture behind GPT, BERT, and modern language models) have largely replaced RNNs for text tasks.",
          "The key innovation in transformers is self-attention: instead of processing the sequence step by step, every position attends to every other position in parallel. This eliminates the vanishing gradient problem entirely and enables much faster training on GPUs.",
          "RNNs remain useful for real-time sequential processing (streaming data, online learning) and in resource-constrained environments. But for most NLP tasks today, transformers are the default.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "Burkov Ch 6.2.2 covers RNN, LSTM, GRU, and backpropagation through time. Ch 7.7 covers seq2seq and attention. The transformer comparison reflects post-publication developments that are now standard in the field.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 14 - Ch 7.5: Ensemble Learning
  // ──────────────────────────────────────────────
  {
    slug: "strength-in-numbers",
    trackId: "machine-learning",
    title: "Strength in numbers",
    blurb:
      "Random forest and gradient boosting combine many weak models into one strong one. They are the workhorses of applied ML.",
    syllabusRef:
      "Burkov Ch 7.5 (Ensemble Learning: bagging, random forest, gradient boosting)",
    minutes: 14,
    prerequisites: ["splitting-by-questions"],
    phases: [
      {
        kind: "predict",
        prompt:
          "You train 100 decision trees, each on a random subset of the training data. You average their predictions. Compared to a single deep tree, what changes?",
        options: [
          "Bias goes down, variance stays the same",
          "Variance goes down, bias stays roughly the same",
          "Both bias and variance go down",
          "Accuracy decreases because the trees are weaker",
        ],
        correctIndex: 1,
        afterword:
          "Each individual tree is noisy (high variance). But because they are trained on different subsets, their errors are different. Averaging many uncorrelated noisy predictions reduces variance without increasing bias. That is the core idea behind bagging and random forest.",
      },
      {
        kind: "play",
        brief:
          "Place the dividing line. Ensemble methods do not try to find one perfect boundary. They combine many rough boundaries, each slightly different, into a consensus that is more robust than any single one.",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Bagging versus boosting",
        body: [
          "Bagging (bootstrap aggregating) trains each model on a random sample of the training data, drawn with replacement. Predictions are averaged (regression) or voted on (classification). Random forest is bagging with decision trees, plus one extra trick: at each split, only a random subset of features is considered. This decorrelates the trees, which is critical. Correlated trees make the same mistakes and averaging does not help.",
          "Boosting trains models sequentially. Each new model focuses on the examples the previous models got wrong. Gradient boosting does this by computing the residuals (the gap between predictions and true labels) and training the next tree to predict those residuals. Each tree partially fixes the mistakes of the ensemble so far.",
          "Random forest reduces variance (overfitting). Gradient boosting reduces bias (underfitting). In practice, gradient boosting usually produces slightly more accurate models, but it is easier to overfit and slower to train because it is sequential rather than parallel.",
          "Three hyperparameters matter most for gradient boosting: the number of trees, the learning rate (how much each tree contributes), and the depth of each tree. Shallow trees (depth 3–6) work best. Deep trees overfit quickly.",
          "Implementations like XGBoost, LightGBM, and CatBoost are heavily optimised and handle millions of examples with hundreds of features. On structured/tabular data, gradient boosting still beats neural networks more often than not.",
        ],
      },
      {
        kind: "implement",
        heading: "Gradient boosting from scratch (regression)",
        language: "python",
        code: `import numpy as np
from sklearn.tree import DecisionTreeRegressor


def gradient_boosting(features, targets, n_trees=50, learning_rate=0.1, max_depth=3):
    initial_prediction = targets.mean()
    predictions = np.full(len(targets), initial_prediction)
    trees = []

    for _ in range(n_trees):
        residuals = targets - predictions
        tree = DecisionTreeRegressor(max_depth=max_depth)
        tree.fit(features, residuals)
        update = tree.predict(features)
        predictions += learning_rate * update
        trees.append(tree)

    return initial_prediction, trees, learning_rate


def predict_boosted(features, initial_prediction, trees, learning_rate):
    predictions = np.full(features.shape[0], initial_prediction)
    for tree in trees:
        predictions += learning_rate * tree.predict(features)
    return predictions


np.random.seed(42)
x = np.random.uniform(0, 10, (100, 1))
y = np.sin(x.squeeze()) + np.random.normal(0, 0.2, 100)

init, trees, lr = gradient_boosting(x, y)
y_hat = predict_boosted(x, init, trees, lr)
mse = ((y - y_hat) ** 2).mean()
print(f"Training MSE: {mse:.4f}")`,
        notes: [
          "Each tree predicts the residuals of the current ensemble. The learning rate controls how much each tree's correction counts.",
          "This is the exact procedure from Burkov Ch 7.5.2. The residuals play the role of the gradient, which is why it is called gradient boosting.",
          "Using scikit-learn's DecisionTreeRegressor for each tree is pragmatic. Building a tree from scratch would obscure the boosting logic.",
        ],
      },
      {
        kind: "case",
        heading: "When to use ensembles versus neural networks",
        body: [
          "For tabular data (rows and columns, the kind you see in databases and spreadsheets), gradient boosting is usually the best choice. It handles mixed feature types, requires less preprocessing, and trains faster.",
          "For images, audio, and text, neural networks (CNNs, RNNs, transformers) win because they can learn spatial and sequential structure that tree-based methods cannot capture.",
          "For medium-sized datasets with structured features, try gradient boosting first. If you have a huge dataset and unstructured input, go straight to neural networks.",
          "Burkov notes that gradient boosting 'usually outperforms random forest in accuracy' but is slower because it is sequential. Random forest is embarrassingly parallel: you can train each tree on a different CPU core.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 7.5.1 covers random forest and bagging. Ch 7.5.2 covers gradient boosting for regression and classification with the residual-based algorithm and the connection to gradient descent.",
      },
    ],
  },

  // ──────────────────────────────────────────────
  // CONCEPT 15 - Ch 9: Unsupervised Learning
  // ──────────────────────────────────────────────
  {
    slug: "learning-without-labels",
    trackId: "machine-learning",
    title: "Learning without labels",
    blurb:
      "Clustering, density estimation, and dimensionality reduction. Find structure in data when nobody tells you what to look for.",
    syllabusRef:
      "Burkov Ch 9 (Unsupervised Learning: density estimation, k-means, DBSCAN, HDBSCAN, GMM, PCA, UMAP, outlier detection)",
    minutes: 15,
    prerequisites: ["preparing-your-data"],
    phases: [
      {
        kind: "predict",
        prompt:
          "You run k-means with k=5 on a dataset that actually has 3 natural clusters. What happens?",
        options: [
          "The algorithm fails to converge",
          "Two of the real clusters get split into smaller pieces",
          "The algorithm automatically detects that k is wrong",
          "The extra centroids end up at the same position",
        ],
        correctIndex: 1,
        afterword:
          "k-means will always find exactly k clusters, regardless of whether that is the right number. With k=5 and 3 real clusters, two of the clusters get arbitrarily split to fill the quota. The algorithm has no way to know it is wrong. Choosing k is your job.",
      },
      {
        kind: "play",
        brief:
          "Place the line. Unsupervised learning does not have labels to guide a boundary. Instead, it looks for natural groupings in the feature space. Imagine the training points had no colours - could you still see two groups?",
        puzzleId: "linear-separator",
      },
      {
        kind: "reveal",
        heading: "Three unsupervised tasks",
        body: [
          "Clustering: assign each example to a group. k-means puts k centroids in the feature space, assigns each point to its nearest centroid, then moves centroids to the centre of their assigned points. Repeat until nothing changes. DBSCAN is density-based: it grows clusters from dense regions and labels sparse points as outliers. HDBSCAN is the improved version that handles varying densities and only requires one hyperparameter (minimum cluster size).",
          "Density estimation: model the probability distribution the data came from. Kernel density estimation uses Gaussians centred on each data point, with a bandwidth hyperparameter that controls smoothness. The Gaussian mixture model (GMM) fits k Gaussian distributions to the data using the Expectation-Maximisation algorithm, allowing soft cluster membership.",
          "Dimensionality reduction: compress features while preserving structure. PCA finds the directions of maximum variance and projects data onto them. UMAP preserves local neighbourhood structure in the reduced space. Autoencoders learn a neural network that compresses and reconstructs the input, with the bottleneck layer serving as the low-dimensional representation.",
          "How to choose k for k-means? Burkov describes the prediction strength method: split data into training and test, cluster both with the same k, and check if test examples that share a cluster in the test clustering also share one in the training clustering. The largest k with prediction strength above 0.8 is a reasonable choice.",
        ],
      },
      {
        kind: "implement",
        heading: "k-means clustering",
        language: "python",
        code: `import numpy as np


def kmeans(data, k, max_iterations=100):
    indices = np.random.choice(len(data), k, replace=False)
    centroids = data[indices].copy()

    for _ in range(max_iterations):
        distances = np.linalg.norm(data[:, np.newaxis] - centroids, axis=2)
        assignments = distances.argmin(axis=1)

        new_centroids = np.array([
            data[assignments == cluster].mean(axis=0)
            for cluster in range(k)
        ])

        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids

    return assignments, centroids


np.random.seed(42)
cluster_a = np.random.randn(50, 2) + np.array([0, 0])
cluster_b = np.random.randn(50, 2) + np.array([5, 5])
cluster_c = np.random.randn(50, 2) + np.array([10, 0])
data = np.vstack([cluster_a, cluster_b, cluster_c])

labels, centres = kmeans(data, k=3)
for i in range(3):
    count = (labels == i).sum()
    print(f"Cluster {i}: {count} points, centre at {centres[i]}")`,
        notes: [
          "k-means is sensitive to initialisation. Two runs can produce different clusterings. In practice, run it multiple times and pick the best result.",
          "The algorithm always converges, but not necessarily to the globally optimal clustering. It finds a local minimum.",
          "HDBSCAN is often a better first choice in practice because you do not need to specify k. Burkov recommends trying it first.",
        ],
      },
      {
        kind: "case",
        heading: "The hardest part of unsupervised learning",
        body: [
          "Without labels, there is no clear metric for 'correct'. You can measure within-cluster variance or silhouette scores, but these are proxies. A clustering that looks good by one metric might be meaningless for your application.",
          "This is why Burkov restricts the chapter to methods 'that can be evaluated based on data as opposed to human judgment'. Even so, interpreting the results requires domain knowledge. The algorithm finds patterns. Whether those patterns are useful is your call.",
          "Dimensionality reduction is the most practically useful unsupervised technique because it feeds into supervised learning. Reduce your 500-dimensional data to 50 dimensions with PCA, then train a classifier on the reduced data. Less noise, faster training, and sometimes better accuracy.",
        ],
        confidence: "verified",
        sourceNote:
          "Burkov Ch 9.1 covers kernel density estimation. Ch 9.2 covers k-means, DBSCAN, HDBSCAN, prediction strength, and GMM with the EM algorithm. Ch 9.3 covers PCA and UMAP. Ch 9.4 covers outlier detection.",
      },
    ],
  },
];
