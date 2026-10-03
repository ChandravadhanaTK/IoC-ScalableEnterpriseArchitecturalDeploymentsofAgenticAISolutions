const resources = {
  SQL: ['Joins', 'GROUP BY and HAVING', 'Window functions'],
  'System Design': ['API design', 'Caching', 'Database scaling'],
  AWS: ['EC2 basics', 'S3 basics', 'IAM basics'],
  React: ['Components and props', 'State and effects', 'Forms and routing'],
  JavaScript: ['Closures', 'Promises and async/await', 'Array methods'],
  DSA: ['Arrays and hashing', 'Binary search', 'Trees and graphs'],
  DBMS: ['Normalization', 'Transactions', 'Indexes'],
  OOPS: ['Inheritance', 'Polymorphism', 'SOLID basics'],
  'Operating Systems': ['Processes and threads', 'Scheduling', 'Virtual memory'],
  'Computer Networks': ['HTTP/HTTPS', 'TCP vs UDP', 'DNS']
};

export function createPlan(missingSkills) {
  return missingSkills.slice(0, 5).map((skill, index) => ({
    week: index + 1,
    skill,
    topics: resources[skill] ?? [`Learn ${skill} fundamentals`, `Practice ${skill} interview questions`, `Build one small ${skill} exercise`],
    tasks: [`Study ${skill} fundamentals`, `Solve 5 interview questions`, `Write short revision notes`]
  }));
}
