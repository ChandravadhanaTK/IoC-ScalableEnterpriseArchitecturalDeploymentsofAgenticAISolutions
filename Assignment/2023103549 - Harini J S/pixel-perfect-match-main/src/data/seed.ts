import type { Category, Collection, Concept, KDocument, Relation } from "@/types/knowledge";

type RawSection = [id: string, title: string, paragraphs: string[]];

function doc(
  id: string,
  title: string,
  category: Category,
  collectionId: string,
  meta: { author: string; added: string; status?: KDocument["status"]; tags: string[] },
  sections: RawSection[],
): KDocument {
  return {
    id,
    title,
    category,
    collectionId,
    author: meta.author,
    addedAt: meta.added,
    status: meta.status ?? "ready",
    tags: meta.tags,
    sections: sections.map(([sid, stitle, paras]) => ({
      id: sid,
      title: stitle,
      chunks: paras.map((text, i) => ({ id: `${id}:${sid}:${i}`, docId: id, sectionId: sid, text })),
    })),
  };
}

export const documents: KDocument[] = [
  doc("raft", "Raft Consensus", "research", "distributed", { author: "Ongaro & Ousterhout", added: "2026-09-12", tags: ["consensus", "replication"] }, [
    ["overview", "Overview", [
      "Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to multi-Paxos and is as efficient, but its structure is different and was designed explicitly for understandability.",
      "Raft decomposes consensus into three relatively independent subproblems: leader election, log replication, and safety. It also includes a mechanism for changing cluster membership.",
    ]],
    ["terms-roles", "Terms & Roles", [
      "At any given time each server is in one of three states: leader, follower, or candidate. In normal operation there is exactly one leader and all of the other servers are followers.",
      "Followers are passive: they issue no requests on their own but simply respond to requests from leaders and candidates. The leader handles all client requests; if a client contacts a follower, the follower redirects it to the leader.",
      "Raft divides time into terms of arbitrary length, numbered with consecutive integers. Each term begins with an election. Terms act as a logical clock and allow servers to detect obsolete information such as stale leaders.",
    ]],
    ["leader-election", "Leader Election", [
      "Raft uses a heartbeat mechanism to trigger leader election. The leader sends periodic heartbeats (AppendEntries RPCs that carry no log entries) to all followers in order to maintain its authority.",
      "If a follower receives no communication over a period called the election timeout, it assumes there is no viable leader, increments its current term, transitions to candidate state, and requests votes from the other servers.",
      "A candidate wins an election if it receives votes from a majority of the servers in the full cluster for the same term. Each server votes for at most one candidate per term, which guarantees at most one leader per term. Randomized election timeouts make split votes rare.",
    ]],
    ["log-replication", "Log Replication", [
      "Once a leader has been elected, it begins servicing client requests. Each request contains a command to be executed by the replicated state machines. The leader appends the command to its log as a new entry.",
      "The leader then issues AppendEntries RPCs in parallel to each of the other servers to replicate the entry. When the entry has been safely replicated on a majority of servers, the leader applies it to its state machine and considers it committed.",
      "The leader retries AppendEntries indefinitely until all followers eventually store all log entries. The Log Matching Property guarantees that if two logs contain an entry with the same index and term, the logs are identical in all preceding entries.",
    ]],
    ["safety", "Safety", [
      "Raft restricts which servers may be elected leader: a candidate cannot win unless its log contains all committed entries. A voter denies its vote if its own log is more up-to-date than the candidate's.",
      "This election restriction ensures the Leader Completeness Property: if a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.",
    ]],
    ["membership", "Membership Changes", [
      "Raft changes cluster configuration using joint consensus, a transitional configuration that combines old and new configurations. Agreement during the transition requires separate majorities from both configurations.",
      "Joint consensus allows the cluster to continue servicing client requests throughout the configuration change without any window where two leaders could be elected.",
    ]],
  ]),
  doc("paxos", "Paxos Made Simple", "research", "distributed", { author: "Leslie Lamport", added: "2026-09-10", tags: ["consensus"] }, [
    ["problem", "The Consensus Problem", [
      "Assume a collection of processes that can propose values. A consensus algorithm ensures that a single one among the proposed values is chosen. If no value is proposed, no value should be chosen.",
      "Safety requires that only a value that has been proposed may be chosen, only a single value is chosen, and a process never learns that a value has been chosen unless it actually has been.",
    ]],
    ["roles", "Proposers, Acceptors, Learners", [
      "Paxos describes three roles: proposers propose values, acceptors vote on proposals, and learners learn which value has been chosen. A single process may play more than one role.",
      "A value is chosen when a proposal with that value has been accepted by a majority of acceptors. Any two majorities intersect in at least one acceptor, which is the foundation of safety.",
    ]],
    ["phases", "Prepare and Accept Phases", [
      "Phase 1 (prepare): a proposer selects a proposal number n and sends a prepare request to a majority of acceptors. An acceptor that receives a prepare with n greater than any it has seen promises not to accept lower-numbered proposals and returns the highest-numbered proposal it has accepted.",
      "Phase 2 (accept): if the proposer receives promises from a majority, it sends an accept request with number n and a value v, where v is the value of the highest-numbered proposal among the responses, or any value if none was reported.",
    ]],
    ["multi-paxos", "Multi-Paxos and the Distinguished Proposer", [
      "To guarantee progress, a distinguished proposer, effectively a leader, must be selected as the only one to try issuing proposals. Paxos itself does not specify how this leader is elected.",
      "In multi-Paxos the leader runs phase 1 once for many instances and then only phase 2 for each new log slot. Unlike Raft, Paxos allows a log with holes, and leader election is left to the implementer.",
    ]],
    ["vs-raft", "Comparison with Raft", [
      "Raft and multi-Paxos provide equivalent safety guarantees, but Raft enforces a stronger form of leadership: log entries only flow from the leader to followers, and leaders must have all committed entries.",
      "Paxos is widely considered difficult to understand and to implement correctly because its single-decree formulation must be extended into a full replicated log by the practitioner.",
    ]],
  ]),
  doc("cap", "CAP Theorem", "academics", "distributed", { author: "Brewer; Gilbert & Lynch", added: "2026-09-05", tags: ["consistency", "partitions"] }, [
    ["statement", "Statement", [
      "The CAP theorem states that a distributed data store cannot simultaneously provide more than two of consistency, availability, and partition tolerance.",
      "Here consistency means linearizability: every read receives the most recent write or an error. Availability means every request to a non-failing node receives a non-error response.",
    ]],
    ["partitions", "Partition Tolerance", [
      "Network partitions are unavoidable in practice, so the real choice is between consistency and availability when a partition occurs. CP systems refuse some requests; AP systems answer with possibly stale data.",
      "Consensus systems such as Raft are CP: a minority partition cannot elect a leader and therefore cannot accept writes, preserving consistency at the cost of availability.",
    ]],
    ["pacelc", "PACELC Extension", [
      "PACELC extends CAP: if there is a partition (P), choose availability (A) or consistency (C); else (E), choose latency (L) or consistency (C). It captures the trade-off present even in normal operation.",
    ]],
  ]),
  doc("eventual", "Eventual Consistency", "academics", "distributed", { author: "Werner Vogels", added: "2026-09-03", tags: ["consistency", "replication"] }, [
    ["definition", "Definition", [
      "Eventual consistency guarantees that if no new updates are made to a data item, eventually all accesses will return the last updated value. It is a liveness guarantee rather than a safety guarantee.",
      "Some authors use the term 'consistency' in eventual consistency to mean replica convergence, which differs from the linearizability meaning of 'consistency' in the CAP theorem.",
    ]],
    ["conflicts", "Conflict Resolution", [
      "Because replicas accept writes independently, concurrent updates may conflict. Strategies include last-writer-wins timestamps, vector clocks, and conflict-free replicated data types (CRDTs).",
    ]],
    ["quorums", "Quorum Tuning", [
      "Dynamo-style systems configure N replicas, a write quorum W, and a read quorum R. When R + W > N, read and write quorums overlap so that reads observe the latest acknowledged write.",
    ]],
  ]),
  doc("rag", "Retrieval-Augmented Generation", "aiml", "aiml", { author: "Lewis et al.", added: "2026-09-18", tags: ["llm", "retrieval"] }, [
    ["overview", "Overview", [
      "Retrieval-augmented generation (RAG) combines a retriever that finds relevant passages from a corpus with a generator that conditions on those passages to produce an answer.",
      "RAG grounds model outputs in external knowledge, reducing hallucination and allowing answers to cite their sources.",
    ]],
    ["chunking", "Chunking", [
      "Documents are split into chunks before embedding. Chunk size trades off precision against context: small chunks retrieve precise passages, while large chunks keep surrounding context. Overlap between chunks preserves meaning across boundaries.",
    ]],
    ["retrieval", "Hybrid Retrieval", [
      "Hybrid retrieval combines keyword scoring such as BM25 with dense vector similarity. Keyword search excels at exact terms and identifiers; semantic search captures paraphrases.",
      "Retrieved candidates are often re-ranked, and the top-k chunks are assembled into a context window for the generator, along with citation identifiers.",
    ]],
    ["citations", "Citation Verification", [
      "A citation verifier checks that every claim in the generated answer is supported by at least one retrieved chunk, and drops or flags citations that do not match.",
    ]],
  ]),
  doc("vectordb", "Vector Databases", "aiml", "aiml", { author: "KnowFlow Notes", added: "2026-09-20", tags: ["embeddings", "ann"] }, [
    ["embeddings", "Embeddings", [
      "An embedding maps text into a dense vector so that semantically similar texts are close together. Similarity is usually measured with cosine similarity or dot product.",
    ]],
    ["ann", "Approximate Nearest Neighbor Search", [
      "Exact nearest-neighbor search is too slow for millions of vectors, so vector databases use approximate nearest neighbor (ANN) indexes that trade a small loss in recall for large speedups.",
      "HNSW (Hierarchical Navigable Small World) builds a multi-layer proximity graph. Search starts at the top sparse layer and greedily descends to denser layers, giving logarithmic-like query time.",
    ]],
    ["rag-use", "Use in RAG", [
      "In RAG pipelines, vector databases store chunk embeddings with metadata such as document id and section, enabling filtered retrieval restricted to a user-chosen scope.",
    ]],
  ]),
  doc("docker", "Docker Fundamentals", "devops", "devops", { author: "KnowFlow Notes", added: "2026-08-28", tags: ["containers"] }, [
    ["containers", "Containers", [
      "A container is a lightweight, isolated process that packages an application with its dependencies. Containers share the host kernel, using namespaces for isolation and cgroups for resource limits.",
    ]],
    ["images", "Images and Layers", [
      "An image is a read-only template built from a Dockerfile. Each instruction creates a layer; layers are cached and shared between images, which speeds builds and saves storage.",
    ]],
    ["compose", "Docker Compose", [
      "Docker Compose defines multi-container applications in a YAML file and runs them on a single host. It does not provide scheduling across machines or self-healing.",
    ]],
  ]),
  doc("k8s", "Kubernetes Architecture", "devops", "devops", { author: "KnowFlow Notes", added: "2026-08-30", tags: ["orchestration", "containers"] }, [
    ["control-plane", "Control Plane", [
      "The Kubernetes control plane includes the API server, scheduler, controller manager, and etcd. etcd is a key-value store that uses the Raft consensus algorithm to replicate cluster state.",
    ]],
    ["pods", "Pods", [
      "A pod is the smallest deployable unit in Kubernetes: one or more containers sharing network and storage. Pods are ephemeral and are replaced rather than repaired.",
    ]],
    ["reconcile", "Reconciliation", [
      "Controllers continuously reconcile actual state toward the desired state declared in manifests. Unlike Docker Compose, Kubernetes schedules containers across many nodes and restarts failed pods automatically.",
    ]],
  ]),
  doc("java-conc", "Java Concurrency", "programming", "programming", { author: "KnowFlow Notes", added: "2026-08-20", status: "processing", tags: ["threads"] }, [
    ["thread-safety", "Thread Safety", [
      "A class is thread-safe if it behaves correctly when accessed from multiple threads, regardless of scheduling, without additional synchronization by callers.",
    ]],
  ]),
  doc("python-bp", "Python Best Practices", "programming", "programming", { author: "KnowFlow Notes", added: "2026-08-18", status: "failed", tags: ["python"] }, []),
];

export const collections: Collection[] = [
  { id: "distributed", name: "Distributed Systems", description: "Consensus, replication and consistency models.", category: "research" },
  { id: "aiml", name: "AI / ML", description: "Retrieval, embeddings and language models.", category: "aiml" },
  { id: "devops", name: "DevOps", description: "Containers, orchestration and delivery.", category: "devops" },
  { id: "programming", name: "Programming", description: "Language practices and concurrency.", category: "programming" },
];

export const concepts: Concept[] = [
  { id: "consensus", name: "Consensus", aliases: ["agreement"], definition: "Getting a group of servers to agree on a single value or sequence of values despite failures.", docs: ["raft", "paxos"] },
  { id: "leader-election", name: "Leader Election", aliases: ["election"], definition: "Choosing one server to coordinate the cluster, typically by majority vote.", docs: ["raft", "paxos"] },
  { id: "log-replication", name: "Log Replication", aliases: ["appendentries"], definition: "Copying ordered log entries from a leader to followers so state machines stay identical.", docs: ["raft"] },
  { id: "quorum", name: "Quorum", aliases: ["majority"], definition: "A subset of nodes, usually a majority, whose agreement is sufficient for a decision.", docs: ["raft", "paxos", "eventual"] },
  { id: "partition", name: "Partition Tolerance", aliases: ["partition"], definition: "Continuing to operate despite messages being lost between parts of the network.", docs: ["cap"] },
  { id: "consistency", name: "Consistency", aliases: ["linearizability"], definition: "Guarantees about which values reads may observe relative to writes.", docs: ["cap", "eventual"] },
  { id: "replication", name: "Replication", aliases: ["replica"], definition: "Keeping copies of data on multiple machines for fault tolerance and performance.", docs: ["raft", "eventual"] },
  { id: "embedding", name: "Embedding", aliases: ["vector"], definition: "A dense vector representation of text where similar meaning maps to nearby points.", docs: ["vectordb", "rag"] },
  { id: "chunking", name: "Chunking", aliases: ["chunk"], definition: "Splitting documents into retrievable passages before indexing.", docs: ["rag"] },
  { id: "hnsw", name: "HNSW", aliases: ["ann"], definition: "A layered proximity-graph index for approximate nearest-neighbor search.", docs: ["vectordb"] },
  { id: "container", name: "Container", aliases: ["docker"], definition: "An isolated process bundling an app with its dependencies, sharing the host kernel.", docs: ["docker", "k8s"] },
  { id: "pod", name: "Pod", aliases: [], definition: "The smallest deployable Kubernetes unit: one or more co-located containers.", docs: ["k8s"] },
  { id: "thread-safety", name: "Thread Safety", aliases: ["thread"], definition: "Correct behavior under concurrent access from multiple threads.", docs: ["java-conc"] },
];

export const relations: Relation[] = [
  { from: "raft", to: "paxos", type: "contrasts_with" },
  { from: "rag", to: "vectordb", type: "depends_on" },
  { from: "k8s", to: "docker", type: "depends_on" },
  { from: "k8s", to: "raft", type: "references" },
  { from: "cap", to: "eventual", type: "related_to" },
  { from: "pod", to: "container", type: "depends_on" },
  { from: "leader-election", to: "consensus", type: "belongs_to" },
  { from: "log-replication", to: "replication", type: "belongs_to" },
  { from: "quorum", to: "consensus", type: "related_to" },
  { from: "embedding", to: "hnsw", type: "related_to" },
  { from: "chunking", to: "embedding", type: "related_to" },
  { from: "partition", to: "consistency", type: "contrasts_with" },
  ...concepts.flatMap((c) => c.docs.map((d) => ({ from: d, to: c.id, type: "discusses" as const }))),
];

export const categoryLabel: Record<Category, string> = {
  research: "Research", academics: "Academics", programming: "Programming", devops: "DevOps", aiml: "AI/ML", projects: "Projects", personal: "Personal",
};

export const getDoc = (id: string) => documents.find((d) => d.id === id);
export const allChunks = () => documents.flatMap((d) => d.sections.flatMap((s) => s.chunks));

/** Swap the signed-in user's uploaded documents into the shared corpus (keeps seed docs untouched). */
export function setUserDocs(list: KDocument[]) {
  for (let i = documents.length - 1; i >= 0; i--) if (documents[i]!.owned) documents.splice(i, 1);
  documents.push(...list);
}
