import type {PythonTestCase} from '../../types/api';

export type PythonChallenge={
  id:string;
  levelId:number;
  title:string;
  description:string;
  starterCode:string;
  hints:string[];
  solution:string;
  explanation:string;
  tests:PythonTestCase[];
};

export const levelOneChallenge:PythonChallenge={
  id:'python-core-sum',
  levelId:1,
  title:'Charge the arc reactor',
  description:'Set answer to the sum of numbers. Keep the solution in Python; the hidden tests will try empty, positive, negative, and mixed values.',
  starterCode:'# numbers is provided by the test runner\n# Set answer to the sum of numbers\nanswer = 0\n',
  hints:[
    'The list is already stored in numbers.',
    'Python has a built-in function that adds every item in a list.',
    'Assign the result of sum(numbers) to answer.',
  ],
  solution:'answer = sum(numbers)\n',
  explanation:'sum walks through the list and returns one total. The same expression works for empty, positive, negative, and mixed values.',
  tests:[
    {name:'Positive values',numbers:[2,4,6,8],expected:20},
    {name:'Empty input',numbers:[],expected:0},
    {name:'Negative values',numbers:[-3,-2,-1],expected:-6},
    {name:'Mixed values',numbers:[10,-4,7,-2],expected:11},
  ],
};