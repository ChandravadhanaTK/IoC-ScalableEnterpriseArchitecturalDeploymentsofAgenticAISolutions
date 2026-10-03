import { Question, Difficulty, Subject, QuizConfig, QuestionType } from './types';

interface QTemplate {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
  difficulty: Difficulty;
}

const BANK: Record<Subject, QTemplate[]> = {
  Mathematics: [
    { topic: 'Algebra', difficulty: 'Easy', q: 'Solve for x: 2x + 5 = 13', options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'], correct: 1, explanation: '2x = 13 - 5 = 8, so x = 4.' },
    { topic: 'Algebra', difficulty: 'Medium', q: 'Factor: x² - 9', options: ['(x-3)(x-3)', '(x+3)(x+3)', '(x-3)(x+3)', '(x-9)(x+1)'], correct: 2, explanation: 'This is a difference of squares: a² - b² = (a-b)(a+b).' },
    { topic: 'Algebra', difficulty: 'Hard', q: 'If x² - 5x + 6 = 0, what are the roots?', options: ['1 and 6', '2 and 3', '-2 and -3', '1 and 5'], correct: 1, explanation: 'Factor: (x-2)(x-3) = 0, so x = 2 or x = 3.' },
    { topic: 'Calculus', difficulty: 'Medium', q: 'What is the derivative of f(x) = x³?', options: ['3x²', 'x²', '3x', 'x⁴/4'], correct: 0, explanation: 'Using the power rule: d/dx[xⁿ] = nxⁿ⁻¹, so d/dx[x³] = 3x².' },
    { topic: 'Calculus', difficulty: 'Hard', q: 'Evaluate ∫ 2x dx', options: ['2x² + C', 'x² + C', '2 + C', 'x²/2 + C'], correct: 1, explanation: '∫2x dx = 2·x²/2 + C = x² + C.' },
    { topic: 'Calculus', difficulty: 'Hard', q: 'What is the derivative of sin(x)?', options: ['cos(x)', '-cos(x)', '-sin(x)', 'tan(x)'], correct: 0, explanation: 'The derivative of sin(x) is cos(x).' },
    { topic: 'Geometry', difficulty: 'Easy', q: 'What is the area of a circle with radius 5?', options: ['10π', '25π', '5π', '15π'], correct: 1, explanation: 'Area = πr² = π(5²) = 25π.' },
    { topic: 'Geometry', difficulty: 'Medium', q: 'The angles of a triangle sum to how many degrees?', options: ['90°', '180°', '270°', '360°'], correct: 1, explanation: 'The interior angles of any triangle always sum to 180°.' },
    { topic: 'Trigonometry', difficulty: 'Medium', q: 'What is sin(30°)?', options: ['0', '0.5', '1', '√3/2'], correct: 1, explanation: 'sin(30°) = 1/2 = 0.5.' },
    { topic: 'Statistics', difficulty: 'Easy', q: 'What is the mean of 4, 6, 8, 10?', options: ['6', '7', '8', '28'], correct: 1, explanation: 'Mean = (4+6+8+10)/4 = 28/4 = 7.' },
    { topic: 'Statistics', difficulty: 'Medium', q: 'What is the median of 3, 7, 9, 1, 5?', options: ['3', '5', '7', '9'], correct: 1, explanation: 'Sorted: 1,3,5,7,9. The middle value is 5.' },
    { topic: 'Calculus', difficulty: 'Medium', q: 'The derivative of a constant is:', options: ['The constant itself', '1', '0', 'Undefined'], correct: 2, explanation: 'A constant function does not change, so its rate of change (derivative) is 0.' },
    { topic: 'Algebra', difficulty: 'Medium', q: 'Simplify: (x³)(x²)', options: ['x⁵', 'x⁶', 'x', 'x⁵·²'], correct: 0, explanation: 'When multiplying like bases, add exponents: x³·x² = x⁵.' },
    { topic: 'Integration', difficulty: 'Hard', q: 'Evaluate ∫ 1/x dx', options: ['1/x² + C', 'ln|x| + C', 'x⁻¹ + C', '-1/x² + C'], correct: 1, explanation: '∫(1/x) dx = ln|x| + C.' },
    { topic: 'Integration', difficulty: 'Hard', q: '∫ eˣ dx equals:', options: ['eˣ + C', 'x·eˣ + C', 'eˣ/x + C', 'ln(eˣ) + C'], correct: 0, explanation: 'The integral of eˣ is eˣ itself, plus the constant of integration.' },
    { topic: 'Integration', difficulty: 'Medium', q: 'Integration is the reverse of:', options: ['Differentiation', 'Multiplication', 'Logarithms', 'Limits'], correct: 0, explanation: 'Integration (antiderivative) is the inverse operation of differentiation.' },
    { topic: 'Integration', difficulty: 'Hard', q: '∫ cos(x) dx equals:', options: ['sin(x) + C', '-sin(x) + C', '-cos(x) + C', 'tan(x) + C'], correct: 0, explanation: 'The integral of cos(x) is sin(x) + C.' },
    { topic: 'Integration', difficulty: 'Easy', q: 'What does ∫ represent?', options: ['Summation', 'Differentiation', 'A limit', 'A product'], correct: 0, explanation: 'The integral sign ∫ represents the continuous summation (accumulation) of quantities.' },
    { topic: 'Calculus', difficulty: 'Easy', q: 'What does a derivative measure?', options: ['Area under a curve', 'Rate of change', 'Total value', 'Average'], correct: 1, explanation: 'A derivative measures the instantaneous rate of change of a function.' },
    { topic: 'Limits', difficulty: 'Medium', q: 'lim(x→0) sin(x)/x = ?', options: ['0', '1', '∞', 'Undefined'], correct: 1, explanation: 'This is a fundamental limit: lim(x→0) sin(x)/x = 1.' },
  ],
  Physics: [
    { topic: "Newton's Laws", difficulty: 'Easy', q: "Newton's First Law is also known as the law of:", options: ['Gravity', 'Inertia', 'Acceleration', 'Momentum'], correct: 1, explanation: "Newton's First Law states that an object in motion stays in motion unless acted on by a force — the law of inertia." },
    { topic: "Newton's Laws", difficulty: 'Medium', q: 'F = ma represents which law?', options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'], correct: 1, explanation: "Newton's Second Law: Force equals mass times acceleration." },
    { topic: "Newton's Laws", difficulty: 'Medium', q: "For every action there is an equal and opposite reaction' is which law?", options: ['First Law', 'Second Law', 'Third Law', 'Zeroth Law'], correct: 2, explanation: "This is Newton's Third Law of Motion." },
    { topic: "Newton's Laws", difficulty: 'Hard', q: 'A 5 kg object accelerates at 3 m/s². What net force acts on it?', options: ['8 N', '15 N', '1.67 N', '2 N'], correct: 1, explanation: 'F = ma = 5 × 3 = 15 N.' },
    { topic: 'Kinematics', difficulty: 'Easy', q: 'What is the SI unit of velocity?', options: ['m', 'm/s', 'm/s²', 'kg'], correct: 1, explanation: 'Velocity is displacement per unit time, measured in meters per second (m/s).' },
    { topic: 'Kinematics', difficulty: 'Medium', q: 'A car starts from rest and reaches 20 m/s in 5 s. Its acceleration is:', options: ['4 m/s²', '5 m/s²', '100 m/s²', '15 m/s²'], correct: 0, explanation: 'a = Δv/Δt = 20/5 = 4 m/s².' },
    { topic: 'Energy', difficulty: 'Medium', q: 'Kinetic energy is given by:', options: ['mgh', '½mv²', 'mc²', 'Fd'], correct: 1, explanation: 'Kinetic energy = ½mv², where m is mass and v is velocity.' },
    { topic: 'Energy', difficulty: 'Easy', q: 'What is the SI unit of energy?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 1, explanation: 'Energy is measured in Joules (J).' },
    { topic: 'Gravitation', difficulty: 'Medium', q: "The gravitational constant G has the value approximately:", options: ['6.67×10⁻¹¹ N·m²/kg²', '9.8 m/s²', '3×10⁸ m/s', '1.6×10⁻¹⁹ C'], correct: 0, explanation: 'G ≈ 6.674×10⁻¹¹ N·m²/kg², the universal gravitational constant.' },
    { topic: 'Gravitation', difficulty: 'Hard', q: 'The acceleration due to gravity on Earth is approximately:', options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.2 m/s²'], correct: 1, explanation: 'g ≈ 9.8 m/s² near Earth\'s surface.' },
    { topic: 'Thermodynamics', difficulty: 'Medium', q: 'The First Law of Thermodynamics is essentially conservation of:', options: ['Momentum', 'Energy', 'Mass', 'Charge'], correct: 1, explanation: 'The First Law states energy cannot be created or destroyed, only transformed.' },
    { topic: 'Waves', difficulty: 'Easy', q: 'The relationship between wave speed, frequency, and wavelength is:', options: ['v = fλ', 'v = f/λ', 'v = λ/f', 'v = f²λ'], correct: 0, explanation: 'Wave speed = frequency × wavelength (v = fλ).' },
    { topic: 'Optics', difficulty: 'Medium', q: 'The speed of light in vacuum is approximately:', options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s', '3×10⁵ m/s'], correct: 0, explanation: 'c ≈ 3×10⁸ m/s.' },
    { topic: 'Electricity', difficulty: 'Easy', q: "Ohm's Law states:", options: ['V = IR', 'V = I/R', 'V = R/I', 'I = VR'], correct: 0, explanation: "Ohm's Law: Voltage = Current × Resistance." },
    { topic: 'Electricity', difficulty: 'Medium', q: 'A 10Ω resistor carries 2A of current. The voltage across it is:', options: ['5 V', '12 V', '20 V', '8 V'], correct: 2, explanation: 'V = IR = 2 × 10 = 20 V.' },
    { topic: 'Momentum', difficulty: 'Hard', q: 'A 2 kg ball moving at 10 m/s has momentum of:', options: ['5 kg·m/s', '12 kg·m/s', '20 kg·m/s', '200 kg·m/s'], correct: 2, explanation: 'p = mv = 2 × 10 = 20 kg·m/s.' },
    { topic: "Newton's Laws", difficulty: 'Hard', q: 'If the net force on an object is zero, the object is:', options: ['At rest only', 'Moving at constant velocity or at rest', 'Accelerating', 'Decelerating'], correct: 1, explanation: "Newton's First Law: zero net force means no acceleration — constant velocity (including zero)." },
    { topic: 'Energy', difficulty: 'Hard', q: 'A 2 kg object is lifted to 10 m. Its potential energy is (g=10):', options: ['20 J', '100 J', '200 J', '500 J'], correct: 2, explanation: 'PE = mgh = 2 × 10 × 10 = 200 J.' },
    { topic: 'Circular Motion', difficulty: 'Hard', q: 'Centripetal force is directed:', options: ['Tangent to the circle', 'Away from center', 'Toward the center', 'Perpendicular to the plane'], correct: 2, explanation: 'Centripetal force always points toward the center of the circular path.' },
    { topic: 'Kinematics', difficulty: 'Hard', q: 'An object dropped from rest falls for 3 s (g=10). Distance fallen:', options: ['30 m', '45 m', '90 m', '15 m'], correct: 1, explanation: 'd = ½gt² = ½(10)(9) = 45 m.' },
  ],
  Chemistry: [
    { topic: 'Atomic Structure', difficulty: 'Easy', q: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correct: 1, explanation: 'Carbon has 6 protons, so its atomic number is 6.' },
    { topic: 'Periodic Table', difficulty: 'Easy', q: 'Which element has the symbol "Na"?', options: ['Nitrogen', 'Sodium', 'Neon', 'Nickel'], correct: 1, explanation: 'Na comes from the Latin "Natrium," which is Sodium.' },
    { topic: 'Periodic Table', difficulty: 'Medium', q: 'Which group do noble gases belong to?', options: ['Group 1', 'Group 2', 'Group 17', 'Group 18'], correct: 3, explanation: 'Noble gases (He, Ne, Ar, etc.) are in Group 18.' },
    { topic: 'Chemical Bonds', difficulty: 'Medium', q: 'What type of bond involves sharing of electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correct: 1, explanation: 'Covalent bonds form when atoms share electron pairs.' },
    { topic: 'Chemical Bonds', difficulty: 'Easy', q: 'NaCl (table salt) is an example of a ___ bond.', options: ['Covalent', 'Ionic', 'Metallic', 'Van der Waals'], correct: 1, explanation: 'NaCl forms by transfer of an electron from Na to Cl — an ionic bond.' },
    { topic: 'Acids and Bases', difficulty: 'Easy', q: 'What is the pH of a neutral solution?', options: ['0', '7', '14', '1'], correct: 1, explanation: 'A neutral solution like pure water has pH 7 at 25°C.' },
    { topic: 'Acids and Bases', difficulty: 'Medium', q: 'A solution with pH 3 is:', options: ['Neutral', 'Basic', 'Acidic', 'Slightly basic'], correct: 2, explanation: 'pH < 7 is acidic. pH 3 is strongly acidic.' },
    { topic: 'Stoichiometry', difficulty: 'Medium', q: 'How many moles are in 36 g of water (H₂O)?', options: ['1', '2', '3', '4'], correct: 1, explanation: 'Molar mass of H₂O = 18 g/mol. 36/18 = 2 moles.' },
    { topic: 'Stoichiometry', difficulty: 'Hard', q: 'Balance: H₂ + O₂ → H₂O. The coefficient of O₂ is:', options: ['1', '2', '½', '3'], correct: 2, explanation: '2H₂ + O₂ → 2H₂O, so O₂ has coefficient 1. (Or 2H₂ + 1O₂ → 2H₂O; coefficient 1.)' },
    { topic: 'Organic Chemistry', difficulty: 'Medium', q: 'Methane has the chemical formula:', options: ['CH₄', 'C₂H₆', 'CH₃', 'C₂H₄'], correct: 0, explanation: 'Methane is CH₄, the simplest alkane.' },
    { topic: 'Organic Chemistry', difficulty: 'Hard', q: 'Which functional group is -OH?', options: ['Aldehyde', 'Hydroxyl', 'Carboxyl', 'Ketone'], correct: 1, explanation: 'The -OH group is the hydroxyl group, found in alcohols.' },
    { topic: 'States of Matter', difficulty: 'Easy', q: 'Which state of matter has a definite volume but no definite shape?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], correct: 1, explanation: 'Liquids have fixed volume but take the shape of their container.' },
    { topic: 'Reactions', difficulty: 'Medium', q: 'What type of reaction is: A + BC → AC + B?', options: ['Synthesis', 'Decomposition', 'Single displacement', 'Double displacement'], correct: 2, explanation: 'One element replaces another in a compound — single displacement.' },
    { topic: 'Thermodynamics', difficulty: 'Hard', q: 'An exothermic reaction:', options: ['Absorbs heat', 'Releases heat', 'Has no heat change', 'Requires a catalyst'], correct: 1, explanation: 'Exothermic reactions release energy (heat) to the surroundings.' },
    { topic: 'Periodic Table', difficulty: 'Hard', q: 'Which of these is a transition metal?', options: ['Sodium', 'Calcium', 'Iron', 'Aluminum'], correct: 2, explanation: 'Iron (Fe) is in the d-block, making it a transition metal.' },
    { topic: 'Atomic Structure', difficulty: 'Hard', q: 'The maximum number of electrons in the second shell is:', options: ['2', '8', '18', '32'], correct: 1, explanation: 'The nth shell holds up to 2n² electrons; shell 2 holds 2(4) = 8.' },
    { topic: 'Acids and Bases', difficulty: 'Medium', q: 'Which acid is found in the human stomach?', options: ['Sulfuric acid', 'Hydrochloric acid', 'Nitric acid', 'Acetic acid'], correct: 1, explanation: 'The stomach produces hydrochloric acid (HCl) for digestion.' },
    { topic: 'Chemical Bonds', difficulty: 'Hard', q: 'How many covalent bonds can carbon form?', options: ['2', '3', '4', '6'], correct: 2, explanation: 'Carbon has 4 valence electrons, so it forms 4 covalent bonds.' },
    { topic: 'Organic Chemistry', difficulty: 'Medium', q: 'Which compound is an alkene?', options: ['CH₄', 'C₂H₆', 'C₂H₄', 'C₃H₈'], correct: 2, explanation: 'Alkenes have a C=C double bond. C₂H₄ (ethene) is an alkene.' },
    { topic: 'Gas Laws', difficulty: 'Hard', q: "Boyle's Law relates:", options: ['Pressure and temperature', 'Volume and temperature', 'Pressure and volume', 'Temperature and moles'], correct: 2, explanation: "Boyle's Law: P₁V₁ = P₂V₂ at constant temperature — pressure and volume are inversely related." },
  ],
  'Computer Science': [
    { topic: 'Data Structures', difficulty: 'Easy', q: 'Which data structure operates on a FIFO principle?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correct: 1, explanation: 'A queue is First-In-First-Out (FIFO).' },
    { topic: 'Data Structures', difficulty: 'Easy', q: 'Which data structure operates on a LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'A stack is Last-In-First-Out (LIFO).' },
    { topic: 'Algorithms', difficulty: 'Medium', q: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], correct: 2, explanation: 'Binary search halves the search space each step: O(log n).' },
    { topic: 'Algorithms', difficulty: 'Medium', q: 'What is the time complexity of bubble sort?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(log n)'], correct: 1, explanation: 'Bubble sort uses nested loops over the array: O(n²).' },
    { topic: 'Programming', difficulty: 'Easy', q: 'What does "HTML" stand for?', options: ['HyperText Markup Language', 'High Text Machine Language', 'Hyperlink Text Management Language', 'Home Tool Markup Language'], correct: 0, explanation: 'HTML = HyperText Markup Language.' },
    { topic: 'Programming', difficulty: 'Medium', q: 'Which of these is NOT a programming paradigm?', options: ['Object-Oriented', 'Functional', 'Procedural', 'Circular'], correct: 3, explanation: 'OOP, Functional, and Procedural are real paradigms; Circular is not.' },
    { topic: 'Programming', difficulty: 'Medium', q: 'In Python, what does len([1,2,3]) return?', options: ['2', '3', '4', 'Error'], correct: 1, explanation: 'len() returns the number of elements: 3.' },
    { topic: 'Databases', difficulty: 'Medium', q: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'], correct: 0, explanation: 'SQL = Structured Query Language.' },
    { topic: 'Databases', difficulty: 'Hard', q: 'Which SQL keyword is used to combine rows from two tables?', options: ['GROUP BY', 'JOIN', 'UNION', 'MERGE'], correct: 1, explanation: 'JOIN combines rows from two or more tables based on a related column.' },
    { topic: 'OOP', difficulty: 'Medium', q: 'Which OOP concept allows a class to inherit from another?', options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'], correct: 1, explanation: 'Inheritance allows a subclass to acquire properties and methods of a parent class.' },
    { topic: 'OOP', difficulty: 'Hard', q: 'Polymorphism means:', options: ['Many forms', 'Single form', 'No form', 'Data hiding'], correct: 0, explanation: 'Polymorphism = "many forms" — the same interface can represent different underlying forms.' },
    { topic: 'Data Structures', difficulty: 'Hard', q: 'In a binary search tree, the left child is ___ the parent.', options: ['Greater than', 'Less than', 'Equal to', 'Unrelated to'], correct: 1, explanation: 'In a BST, left child < parent < right child.' },
    { topic: 'Algorithms', difficulty: 'Hard', q: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], correct: 2, explanation: 'Merge Sort has O(n log n) average and worst-case complexity.' },
    { topic: 'Networks', difficulty: 'Easy', q: 'What does "HTTP" stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transmission Process', 'Host Transfer Text Protocol'], correct: 0, explanation: 'HTTP = HyperText Transfer Protocol.' },
    { topic: 'Networks', difficulty: 'Medium', q: 'Which protocol is used for secure web communication?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correct: 2, explanation: 'HTTPS = HTTP Secure, using TLS/SSL encryption.' },
    { topic: 'Programming', difficulty: 'Hard', q: 'What is a recursive function?', options: ['A function that calls itself', 'A function with no return', 'A function with loops only', 'A function that is inline'], correct: 0, explanation: 'A recursive function is one that calls itself to solve smaller sub-problems.' },
    { topic: 'Data Structures', difficulty: 'Medium', q: 'A hash table provides average-case lookup of:', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 2, explanation: 'Hash tables provide O(1) average-case lookup via hashing.' },
    { topic: 'Programming', difficulty: 'Medium', q: 'Which is NOT a primitive data type?', options: ['int', 'float', 'boolean', 'array'], correct: 3, explanation: 'Array is a composite (non-primitive) data type; int, float, boolean are primitive.' },
    { topic: 'Algorithms', difficulty: 'Easy', q: 'An algorithm with O(1) complexity means:', options: ['It runs in constant time', 'It runs in linear time', 'It runs in no time', 'It never terminates'], correct: 0, explanation: 'O(1) means the operation takes constant time regardless of input size.' },
    { topic: 'OOP', difficulty: 'Medium', q: 'Encapsulation is the principle of:', options: ['Hiding internal state', 'Creating multiple instances', 'Inheriting methods', 'Overloading operators'], correct: 0, explanation: 'Encapsulation bundles data and methods, hiding internal state from outside access.' },
  ],
  'General Knowledge': [
    { topic: 'Geography', difficulty: 'Easy', q: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], correct: 2, explanation: 'Paris is the capital and largest city of France.' },
    { topic: 'Geography', difficulty: 'Easy', q: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3, explanation: 'The Pacific Ocean is the largest, covering about 63 million square miles.' },
    { topic: 'History', difficulty: 'Medium', q: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2, explanation: 'World War II ended in 1945 with the surrender of Germany and Japan.' },
    { topic: 'History', difficulty: 'Easy', q: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'], correct: 2, explanation: 'George Washington served as the first U.S. President from 1789 to 1797.' },
    { topic: 'Science', difficulty: 'Easy', q: 'What is the chemical symbol for water?', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], correct: 1, explanation: 'Water is H₂O — two hydrogen atoms and one oxygen atom.' },
    { topic: 'Science', difficulty: 'Medium', q: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correct: 1, explanation: 'There are 8 planets after Pluto was reclassified as a dwarf planet in 2006.' },
    { topic: 'Science', difficulty: 'Medium', q: 'What gas do plants absorb from the atmosphere for photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2, explanation: 'Plants absorb CO₂ and release O₂ during photosynthesis.' },
    { topic: 'Geography', difficulty: 'Medium', q: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correct: 1, explanation: 'The Nile is traditionally considered the longest river at ~6,650 km.' },
    { topic: 'Geography', difficulty: 'Hard', q: 'Which country has the largest population?', options: ['India', 'China', 'USA', 'Indonesia'], correct: 0, explanation: 'As of 2023, India surpassed China as the most populous country.' },
    { topic: 'History', difficulty: 'Medium', q: 'Who painted the Mona Lisa?', options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'], correct: 2, explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.' },
    { topic: 'Literature', difficulty: 'Easy', q: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correct: 1, explanation: 'William Shakespeare wrote Romeo and Juliet around 1594-1596.' },
    { topic: 'Literature', difficulty: 'Medium', q: 'Which novel begins with "Call me Ishmael"?', options: ['Moby Dick', 'Great Expectations', 'The Great Gatsby', '1984'], correct: 0, explanation: '"Call me Ishmael" is the famous opening line of Moby Dick by Herman Melville.' },
    { topic: 'Science', difficulty: 'Hard', q: 'What is the speed of light in vacuum (approx)?', options: ['3×10⁵ km/s', '3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s'], correct: 1, explanation: 'The speed of light c ≈ 3×10⁸ m/s.' },
    { topic: 'Geography', difficulty: 'Hard', q: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'Maldives', 'San Marino'], correct: 1, explanation: 'Vatican City is the smallest country by both area and population.' },
    { topic: 'History', difficulty: 'Hard', q: 'The Great Wall of China was primarily built to defend against which group?', options: ['Mongols/Northern nomads', 'Japanese', 'Europeans', 'Koreans'], correct: 0, explanation: 'The Great Wall was built to defend against northern nomadic tribes, particularly the Mongols.' },
    { topic: 'Science', difficulty: 'Easy', q: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1, explanation: 'Mars is called the Red Planet due to iron oxide (rust) on its surface.' },
    { topic: 'Science', difficulty: 'Medium', q: 'What is the hardest known natural material?', options: ['Gold', 'Iron', 'Diamond', 'Quartz'], correct: 2, explanation: 'Diamond is the hardest known natural material, rated 10 on the Mohs scale.' },
    { topic: 'Literature', difficulty: 'Hard', q: 'Who wrote "To Kill a Mockingbird"?', options: ['Harper Lee', 'Ernest Hemingway', 'F. Scott Fitzgerald', 'John Steinbeck'], correct: 0, explanation: 'Harper Lee published To Kill a Mockingbird in 1960.' },
    { topic: 'Geography', difficulty: 'Easy', q: 'Which continent is the Sahara Desert located on?', options: ['Asia', 'Australia', 'Africa', 'South America'], correct: 2, explanation: 'The Sahara is the largest hot desert, located in North Africa.' },
    { topic: 'History', difficulty: 'Easy', q: 'Who invented the telephone?', options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Guglielmo Marconi'], correct: 1, explanation: 'Alexander Graham Bell was granted the first patent for the telephone in 1876.' },
  ],
};

// True/False versions derived from MCQ templates
function toTrueFalse(t: QTemplate): QTemplate {
  const isTrue = t.correct === 0 || t.correct === 1;
  const tfCorrect = Math.random() > 0.5 ? (isTrue ? 0 : 1) : (isTrue ? 1 : 0);
  const statement = t.q.replace(/^[^:]*:\s*/, '');
  return {
    ...t,
    q: `True or False: ${statement}`,
    options: ['True', 'False'],
    correct: tfCorrect,
    explanation: `${tfCorrect === 0 ? 'True' : 'False'}. ${t.explanation}`,
  };
}

export function generateQuiz(config: QuizConfig): Question[] {
  let pool = BANK[config.subject] || [];

  if (config.topic && config.topic.trim()) {
    const topicLower = config.topic.toLowerCase().trim();
    const filtered = pool.filter(q => q.topic.toLowerCase().includes(topicLower));
    if (filtered.length > 0) pool = filtered;
  }

  if (config.difficulty !== 'Mixed' as any) {
    const diffFiltered = pool.filter(q => q.difficulty === config.difficulty);
    if (diffFiltered.length >= 3) pool = diffFiltered;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, config.numQuestions);

  let questions: Question[] = selected.map((t, i) => ({
    id: `q-${Date.now()}-${i}`,
    type: 'MCQ' as const,
    question: t.q,
    options: [...t.options].sort(() => Math.random() - 0.5).map((opt, _, arr) => {
      const origIndex = t.options.indexOf(opt);
      if (origIndex === t.correct) t.correct = arr.indexOf(opt);
      return opt;
    }),
    correct: t.correct,
    explanation: t.explanation,
    topic: t.topic,
    difficulty: t.difficulty,
  }));

  if (config.type === 'True-False') {
    questions = questions.map((q, i) => {
      const t = selected[i];
      const tf = toTrueFalse(t);
      return {
        ...q,
        type: 'True-False' as const,
        question: tf.q,
        options: ['True', 'False'],
        correct: tf.correct,
        explanation: tf.explanation,
      };
    });
  } else if (config.type === 'Mixed') {
    questions = questions.map((q, i) => {
      if (i % 2 === 1) {
        const t = selected[i];
        const tf = toTrueFalse(t);
        return {
          ...q,
          type: 'True-False' as const,
          question: tf.q,
          options: ['True', 'False'],
          correct: tf.correct,
          explanation: tf.explanation,
        };
      }
      return q;
    });
  }

  return questions;
}

export function getAvailableTopics(subject: Subject): string[] {
  const topics = new Set((BANK[subject] || []).map(q => q.topic));
  return Array.from(topics);
}
