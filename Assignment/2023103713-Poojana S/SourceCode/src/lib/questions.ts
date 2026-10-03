export type Difficulty = "Easy" | "Medium" | "Hard";
export interface MCQ {
  id: string;
  q: string;
  options: string[];
  answer: number;
  difficulty: Difficulty;
  explain?: string;
}

export const APTITUDE: Record<string, MCQ[]> = {
  Quantitative: [
    { id: "q1", q: "A train 120 m long passes a pole in 6 s. Its speed in km/h is?", options: ["60", "72", "80", "90"], answer: 1, difficulty: "Easy", explain: "120/6 = 20 m/s = 72 km/h." },
    { id: "q2", q: "If 20% of x is 50, x is?", options: ["200", "250", "300", "100"], answer: 1, difficulty: "Easy" },
    { id: "q3", q: "A can finish a job in 10 days, B in 15. Together they take?", options: ["5", "6", "7.5", "8"], answer: 1, difficulty: "Medium", explain: "1/10+1/15 = 1/6." },
    { id: "q4", q: "Simple interest on ₹5000 at 8% for 3 years?", options: ["₹1000", "₹1200", "₹1500", "₹1800"], answer: 1, difficulty: "Easy" },
    { id: "q5", q: "Probability of getting a sum of 7 with two dice?", options: ["1/6", "1/12", "5/36", "7/36"], answer: 0, difficulty: "Medium" },
    { id: "q6", q: "Compound interest on ₹10000 at 10% p.a. for 2 years?", options: ["₹2000", "₹2100", "₹2200", "₹1900"], answer: 1, difficulty: "Hard" },
  ],
  Logical: [
    { id: "l1", q: "Next in series: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], answer: 1, difficulty: "Easy", explain: "n(n+1): 6×7 = 42." },
    { id: "l2", q: "If CAT = 24, DOG = ?", options: ["26", "24", "30", "28"], answer: 0, difficulty: "Medium", explain: "Sum of letter positions: 4+15+7 = 26." },
    { id: "l3", q: "All roses are flowers. Some flowers fade. Conclusion: Some roses fade?", options: ["Definitely true", "Definitely false", "Cannot be determined", "None"], answer: 2, difficulty: "Medium" },
    { id: "l4", q: "Pointing to a man, Riya says 'His mother is my mother's only daughter.' He is Riya's?", options: ["Brother", "Son", "Nephew", "Father"], answer: 1, difficulty: "Hard" },
    { id: "l5", q: "Odd one out: 3, 5, 11, 14, 17", options: ["3", "11", "14", "17"], answer: 2, difficulty: "Easy" },
  ],
  Verbal: [
    { id: "v1", q: "Synonym of 'Candid'", options: ["Frank", "Shy", "Rude", "Clever"], answer: 0, difficulty: "Easy" },
    { id: "v2", q: "Antonym of 'Benevolent'", options: ["Kind", "Malevolent", "Generous", "Lazy"], answer: 1, difficulty: "Easy" },
    { id: "v3", q: "Choose correct: Neither of the students ___ present.", options: ["were", "are", "was", "have been"], answer: 2, difficulty: "Medium" },
    { id: "v4", q: "Meaning of idiom 'Bite the bullet'", options: ["Get hurt", "Face difficulty bravely", "Eat fast", "Give up"], answer: 1, difficulty: "Medium" },
    { id: "v5", q: "Spot the correctly spelled word", options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"], answer: 2, difficulty: "Hard" },
  ],
};

export const TECHNICAL: Record<string, MCQ[]> = {
  "Programming Fundamentals": [
    { id: "pf1", q: "Which is not a loop construct?", options: ["for", "while", "if", "do-while"], answer: 2, difficulty: "Easy" },
    { id: "pf2", q: "Recursion requires a…", options: ["Loop", "Base case", "Pointer", "Class"], answer: 1, difficulty: "Easy" },
    { id: "pf3", q: "Time complexity of accessing an array element by index?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: 0, difficulty: "Medium" },
  ],
  C: [
    { id: "c1", q: "Size of char in C?", options: ["1 byte", "2 bytes", "4 bytes", "Depends"], answer: 0, difficulty: "Easy" },
    { id: "c2", q: "Which function allocates memory dynamically?", options: ["alloc()", "malloc()", "new", "create()"], answer: 1, difficulty: "Easy" },
    { id: "c3", q: "Output of printf(\"%d\", 5/2);", options: ["2.5", "2", "3", "Error"], answer: 1, difficulty: "Medium" },
  ],
  "C++": [
    { id: "cp1", q: "Which supports runtime polymorphism?", options: ["Overloading", "Virtual functions", "Templates", "Macros"], answer: 1, difficulty: "Medium" },
    { id: "cp2", q: "Default access of class members?", options: ["public", "private", "protected", "none"], answer: 1, difficulty: "Easy" },
    { id: "cp3", q: "RAII primarily manages…", options: ["Threads", "Resources", "Syntax", "Exceptions only"], answer: 1, difficulty: "Hard" },
  ],
  Java: [
    { id: "j1", q: "Java is compiled to…", options: ["Machine code", "Bytecode", "Assembly", "C"], answer: 1, difficulty: "Easy" },
    { id: "j2", q: "Which collection disallows duplicates?", options: ["List", "Set", "ArrayList", "Vector"], answer: 1, difficulty: "Easy" },
    { id: "j3", q: "String in Java is…", options: ["Mutable", "Immutable", "Primitive", "Thread-unsafe"], answer: 1, difficulty: "Medium" },
  ],
  Python: [
    { id: "p1", q: "Output of len([1,[2,3]])?", options: ["3", "2", "1", "Error"], answer: 1, difficulty: "Easy" },
    { id: "p2", q: "Which is immutable?", options: ["list", "dict", "tuple", "set"], answer: 2, difficulty: "Easy" },
    { id: "p3", q: "What does the GIL limit?", options: ["Memory", "Parallel CPU threads", "I/O", "Imports"], answer: 1, difficulty: "Hard" },
  ],
  "Data Structures": [
    { id: "ds1", q: "LIFO structure?", options: ["Queue", "Stack", "Heap", "Graph"], answer: 1, difficulty: "Easy" },
    { id: "ds2", q: "Search in balanced BST?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 1, difficulty: "Medium" },
    { id: "ds3", q: "Best for implementing a priority queue?", options: ["Array", "Linked list", "Heap", "Stack"], answer: 2, difficulty: "Medium" },
  ],
  Algorithms: [
    { id: "a1", q: "Worst case of quicksort?", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], answer: 1, difficulty: "Medium" },
    { id: "a2", q: "Dijkstra fails with…", options: ["Cycles", "Negative edges", "Dense graphs", "Trees"], answer: 1, difficulty: "Hard" },
    { id: "a3", q: "Binary search needs data to be…", options: ["Sorted", "Unique", "Linked", "Hashed"], answer: 0, difficulty: "Easy" },
  ],
  DBMS: [
    { id: "db1", q: "Which normal form removes transitive dependency?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 2, difficulty: "Medium" },
    { id: "db2", q: "ACID 'I' stands for…", options: ["Integrity", "Isolation", "Index", "Identity"], answer: 1, difficulty: "Easy" },
    { id: "db3", q: "Command to remove a table entirely?", options: ["DELETE", "TRUNCATE", "DROP", "REMOVE"], answer: 2, difficulty: "Easy" },
  ],
  "Operating Systems": [
    { id: "os1", q: "Deadlock needs how many Coffman conditions?", options: ["2", "3", "4", "5"], answer: 2, difficulty: "Medium" },
    { id: "os2", q: "Thrashing relates to…", options: ["CPU", "Paging", "Disk", "Network"], answer: 1, difficulty: "Medium" },
    { id: "os3", q: "Round robin is…", options: ["Preemptive", "Non-preemptive", "Priority only", "Batch"], answer: 0, difficulty: "Easy" },
  ],
  "Computer Networks": [
    { id: "cn1", q: "HTTP default port?", options: ["21", "25", "80", "443"], answer: 2, difficulty: "Easy" },
    { id: "cn2", q: "TCP is…", options: ["Connectionless", "Connection-oriented", "Layer 2", "Broadcast"], answer: 1, difficulty: "Easy" },
    { id: "cn3", q: "Which layer does routing?", options: ["Data link", "Network", "Transport", "Session"], answer: 1, difficulty: "Medium" },
  ],
};

export const INTERVIEW: Record<string, string[]> = {
  Technical: [
    "Explain the difference between a process and a thread.",
    "How would you design a URL shortener?",
    "What happens when you type a URL into the browser?",
    "Explain normalization with an example.",
    "How does a hash map handle collisions?",
  ],
  HR: [
    "Tell me about yourself.",
    "Why should we hire you?",
    "Where do you see yourself in five years?",
    "What are your strengths and weaknesses?",
    "Why do you want to join our company?",
  ],
  Behavioral: [
    "Describe a time you handled a conflict in a team.",
    "Tell me about a failure and what you learned.",
    "Describe a situation where you showed leadership.",
    "Tell me about a time you worked under a tight deadline.",
    "Describe a time you had to learn something quickly.",
  ],
};
