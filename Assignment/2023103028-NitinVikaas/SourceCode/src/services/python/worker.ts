import type {PythonTestCase,PythonTestResult} from '../../types/api';

export type PythonRunResult={stdout:string;stderr:string;traceback?:string;timedOut:boolean;durationMs:number;tests?:PythonTestResult[]};

let worker:Worker|null=null;

function makeWorker(){
  const src=`let py=null;self.onmessage=async e=>{const {code,tests=[],numbers}=e.data;let started=performance.now();let out='';let err='';try{if(!py){importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'});self.postMessage({ready:true});started=performance.now();}py.setStdout({batched:(s)=>out+=s+'\\n'});py.setStderr({batched:(s)=>err+=s+'\\n'});let testResults=[];if(tests.length){const testSource=JSON.stringify(code);for(const test of tests){try{await py.runPythonAsync('numbers = '+JSON.stringify(test.numbers)+'\\nanswer = None\\nexec('+testSource+', globals())');const actual=py.globals.get('answer');const value=actual?.toJs?actual.toJs():actual;actual?.destroy?.();if(value!==test.expected)throw new Error('Expected '+test.expected+' but received '+String(value));testResults.push({name:test.name,passed:true,message:'Passed'});}catch(ex){testResults.push({name:test.name,passed:false,message:String(ex)});}}}else{const inputSource=numbers?('numbers = '+JSON.stringify(numbers)+'\\nanswer = None\\n'):'';await py.runPythonAsync(inputSource+code);}self.postMessage({stdout:out,stderr:err,timedOut:false,durationMs:Math.round(performance.now()-started),tests:testResults});}catch(ex){self.postMessage({stdout:out||'',stderr:String(ex),traceback:String(ex),timedOut:false,durationMs:Math.round(performance.now()-started),tests:[]});}}`;
  return new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
}

export function runPython(code:string,tests:PythonTestCase[]=[],timeoutMs=5000,numbers?:number[]):Promise<PythonRunResult>{
  worker?.terminate();
  worker=makeWorker();
  return new Promise(resolve=>{
    let executionTimer:number|undefined;
    const loadTimer=window.setTimeout(()=>{
      worker?.terminate();
      worker=null;
      resolve({stdout:'',stderr:'Pyodide could not start. Check the network connection and try again.',timedOut:true,durationMs:30000,tests:[]});
    },30000);
    worker!.onmessage=e=>{
      if(e.data.ready){
        window.clearTimeout(loadTimer);
        executionTimer=window.setTimeout(()=>{
          worker?.terminate();
          worker=null;
          resolve({stdout:'',stderr:'Execution timed out. Python exceeded the 5 second execution limit. Runtime restarted safely.',timedOut:true,durationMs:timeoutMs,tests:[]});
        },timeoutMs);
        return;
      }
      window.clearTimeout(loadTimer);
      if(executionTimer)window.clearTimeout(executionTimer);
      worker=null;
      resolve(e.data);
    };
    worker!.postMessage({code,tests,numbers});
  });
}
