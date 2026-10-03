import type {Level,MatchPair} from '../../types/api';

const defs=[
  ['Python Core','Arc Reactor','Python basics','Variables, control flow, functions, lists and dictionaries.'],
  ['Vector Engine','Gauntlets','NumPy + Pandas','Arrays, vectorization, DataFrames and cleaning.'],
  ['Probability Lab','Repulsor Boots','Statistics + Viz','Probability, descriptive statistics, Matplotlib and Seaborn.'],
  ['Model Foundry','Chest Plate','Machine Learning','Supervised learning, clustering, scikit-learn and train/test split.'],
  ['Evaluation HUD','Helmet + HUD','Model Evaluation','Precision, recall, F1, overfitting and cross-validation.'],
  ['Neural Core','Palm Repulsors','Neural Networks','Neurons, activation, loss, backprop and gradient descent.'],
  ['Deep Vision','Flight Thrusters','Deep Learning','CNNs, regularization, optimizers and batch size.'],
  ['Language Engine','JARVIS Voice','NLP + Transformers','Tokenization, embeddings, RNNs, attention and transformers.'],
  ['Vision Targeting','Targeting System','Computer Vision','Image processing, detection and segmentation.'],
  ['Reward Matrix','Unibeam','Reinforcement Learning','Agents, environments, rewards and Q-learning.'],
  ['Nanotech Retrieval','Nanotech Layer','LLMs + RAG','Prompting, fine-tuning, RAG and vector databases.'],
  ['Agentic Core','Mark LXXXV','AI Agents + MLOps','Agents, tools, deployment, observability, ethics and safety.'],
];

export const levels:Level[]=defs.map((definition,index)=>({id:index+1,name:definition[0],piece:definition[1],topic:definition[2],description:definition[3],xp:500+index*100,accent:['#00E5FF','#00B8C8','#35E0A1','#FFB020','#00E5FF','#35E0A1','#00B8C8','#00E5FF','#FFB020','#35E0A1','#00B8C8','#00E5FF'][index],status:index===0?'current':'locked'}));

const pairBank=[
  ['Variable','A named reference to a value.'],['List','An ordered, mutable collection.'],['Dictionary','A key-value mapping.'],['Loop','Repeats a block of instructions.'],['Function','A reusable block of behavior.'],['Array','A structured collection optimized for numerical work.'],['Vectorization','Applying operations to whole arrays instead of Python loops.'],['DataFrame','A labeled two-dimensional table.'],['Mean','Arithmetic average of observations.'],['Recall','Fraction of actual positives identified.'],['Overfitting','Model learns training noise and fails to generalize.'],['Gradient Descent','Iterative optimization using the negative gradient.'],['Embedding','Dense vector representation of meaning.'],['Transformer','Architecture based on attention for sequence modeling.'],['Q-learning','Value-based reinforcement learning algorithm.'],['RAG','Retrieval augmented generation using external context.'],['Agent','System that observes, reasons and acts toward a goal.'],['Guardrail','Rule or check that constrains risky behavior.'],
];

export const matchSets:Record<number,MatchPair[]>=Object.fromEntries(levels.map(level=>[level.id,Array.from({length:6},(_,index)=>{const pair=pairBank[(level.id*3+index)%pairBank.length];return{id:`${level.id}-${index}`,term:pair[0],definition:pair[1]}})]));
const glossaryPairs=pairBank.concat([['Activation Function','Transforms a neuron’s weighted sum before passing it onward.'],['Cross Validation','Repeated train-validation splits used to estimate generalization.'],['Precision','Fraction of predicted positives that are actually positive.'],['F1','Harmonic mean of precision and recall.'],['CNN','Neural architecture specialized for grid-like data such as images.'],['Regularization','Technique that discourages overly complex models.'],['Tokenization','Breaking text into units processed by a language model.'],['Attention','Mechanism that weights relevant elements of a sequence.'],['Segmentation','Assigning a class label to pixels or regions.'],['Environment','World in which a reinforcement-learning agent acts.'],['Reward','Scalar feedback signal for an RL action.'],['Vector Database','Database optimized for similarity search over embeddings.'],['Fine-tuning','Updating model parameters on task-specific data.'],['Tool Use','An agent invoking an external capability to act.'],['MLOps','Practices for deploying, monitoring and maintaining ML systems.'],['Observability','Tracing, metrics and logs used to understand system behavior.']]);

const studyNotes:Record<string,{study:string;example:string}>={
  Variable:{study:'A variable is a name bound to an object, not a box with a permanent type. Track what value enters the name, when it changes, and what downstream system reads it.',example:'reactor_temp = 87\nreactor_temp = reactor_temp + 3'},
  List:{study:'Lists preserve order and can change in place. They are useful when the suit receives a sequence of readings that must be inspected or processed one by one.',example:'readings = [81, 84, 87]\nlatest = readings[-1]'},
  Dictionary:{study:'Dictionaries model labeled state. Use them when a reading needs a stable key so code can be explicit about which subsystem it is updating.',example:'status = {"reactor": "online"}\nstatus["power"] = 92'},
  Loop:{study:'A loop repeats a decision or transformation. Study the stopping condition first: an uncontrolled loop can turn a monitoring system into a runaway process.',example:'for reading in readings:\n    print(reading)'},
  Function:{study:'Functions isolate a reliable operation behind a name. Good functions make the armor easier to test because inputs and outputs are visible at one boundary.',example:'def safe_power(value):\n    return min(value, 100)'},
  Array:{study:'Arrays store numerical values in a compact structure so operations can run across a whole signal. Shape and data type are the first things to inspect.',example:'temperatures = np.array([81, 84, 87])'},
  Vectorization:{study:'Vectorization replaces repeated Python-level loops with operations over an entire numerical structure. It improves throughput when telemetry grows.',example:'corrected = temperatures - temperatures.mean()'},
  DataFrame:{study:'A DataFrame combines labeled rows and columns for inspection and cleaning. Treat column names and missing values as part of the data contract.',example:'telemetry[telemetry["power"] > 80]'},
  Mean:{study:'The mean summarizes a set by balancing all observations. It can hide spikes, so compare it with spread and outliers before using it as a control value.',example:'average = sum(readings) / len(readings)'},
  Recall:{study:'Recall asks how many real positives the system found. In a safety-sensitive detector, low recall means threats can pass unseen.',example:'recall = true_positives / (true_positives + false_negatives)'},
  Overfitting:{study:'Overfitting happens when a model memorizes training noise instead of learning a pattern that survives new data. Compare training and validation behavior.',example:'train_score = 0.99\nvalidation_score = 0.61'},
  'Gradient Descent':{study:'Gradient descent updates parameters in the direction that reduces error. The learning rate controls whether those steps are useful, too slow, or unstable.',example:'weights = weights - learning_rate * gradient'},
  Embedding:{study:'An embedding maps an item into a numerical space where useful relationships can be measured. Similar meanings should be close, but the model and dataset define what close means.',example:'query_vector = encoder.encode("reactor failure")'},
  Transformer:{study:'Transformers use attention to relate tokens across a sequence. They are powerful because each position can use context from the whole input.',example:'context = transformer(tokens, attention_mask=mask)'},
  'Q-learning':{study:'Q-learning estimates the value of taking an action in a state. The agent improves by balancing exploration with actions that already look promising.',example:'q[state, action] += alpha * (reward + gamma * best_next - q[state, action])'},
  RAG:{study:'Retrieval augmented generation gives a model external evidence before it answers. The retrieval step is part of correctness: weak context produces confident nonsense.',example:'sources = index.search("power grid access")'},
  Agent:{study:'An agent observes a state, chooses an action, and checks the result. Reliable agents expose their tools and stop conditions instead of hiding decisions in one prompt.',example:'action = agent.choose(observation)\nresult = tools[action]()'},
  Guardrail:{study:'A guardrail constrains an action or checks an output before it reaches the world. It should fail clearly and leave an audit trail.',example:'if not approved(action):\n    raise PermissionError("blocked")'},
};

export const glossary=glossaryPairs.map(([term,definition])=>({
  term,
  definition,
  ...(studyNotes[term]||{
    study:`${definition} Study the inputs, outputs, and failure modes before connecting this concept to an armor subsystem.`,
    example:`# Trace how ${term.toLowerCase()} changes the system state`,
  }),
}));
