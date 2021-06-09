const {exec} = require('child_process'),
      {join} = require('path'),
      {CODEDIR, MAIN_CLASS} = require('../resources/constants'),
    { promisify } = require('util'),
    { compileCode, execute } = require('./runner'),
      {unlink, stat, writeFile} = require('fs');
/**
 * Compile the answer code & runs the base test case.
 * Populates the output object. 
 * @param {{
    * 'inputs': String,
    * 'outputs': String,
    * 'output': Object,
    * userId: String}} params - Input parameters object
 */
const runAnswer = async (params) => {
    let {output, outputs} = params;
    
    // generate unique filename for each compilation
    const className = `Class${params.userId}${Date.now()}`;
    const filePath = join(CODEDIR, `${className}.java`);

    // create promisified functions
    // const execPromise = promisify(exec);
    const writeFilePromise = promisify(writeFile);

    try {
        // Replace the class name within the code &
        // create temp file with code
        await writeFilePromise(filePath, output.answer.replace(new RegExp(MAIN_CLASS, 'g'), className));

        const compileProcessArgs = ['-d', `${CODEDIR}`, `${filePath}`];
        // compile
        // const compilerResult = await execPromise(`javac -d ${CODEDIR} ${filePath}`, {encoding: 'utf8'});
        const compilerResult = await compileCode(compileProcessArgs);
        output.compilerResult.stdout = compilerResult.stdout;

        // try & run test cases
        try {
            const runProcessArgs = ['-cp', `${CODEDIR}`, `${className}`];
            const runProcessStdin = `${params.inputs.trim()} `.replace(new RegExp(/\s/, 'g'), '\n');

            // run base test async
            // const testResults = await execPromise(`java -cp ${CODEDIR} ${className} ${params.inputs}`, {encoding: 'utf8'})
            const testResults = await execute(runProcessArgs, runProcessStdin);

            // check each test result
            const stdOut = testResults.stdout.replace(new RegExp('\\r', 'g'), '');
            outputs = outputs.replace(new RegExp('\\r', 'g'), '');

            const testCaseResult = {
                testCase: {
                    inputs: params.inputs,
                    outputs
                },
                status: -1,
                stdout: stdOut,
                stderr: (testResults.stderr === '')? null : testResults.stderr,
                expected: outputs
            };

            // set the testcase passed status
            if (outputs === stdOut) {
                testCaseResult.status = 0;
                output.passed = true;
            }

            // set the testResult obj to main output
            output.testResults = testCaseResult;

        } catch (err) {
            console.log('Error while running testcase', err);
            output.testResults = {
                testCase: {
                    inputs: params.inputs,
                    outputs
                },
                status: -1,
                stdout: err.stdout,
                stderr: err.stderr,
                expected: outputs
            };
        }

    } catch (err) { 
        // set compiler results
        output.compilerResult.status = err.status || -1;
        output.compilerResult.stdout = err.stdout || '';
        output.compilerResult.stderr = err.stderr || `${err}`;

        console.log('Error while compiling answer', err);
    } finally {
         // remove the temp files async
         stat(filePath, (err, _) => {
            if (!err) unlink(filePath, () => {}); 
         });
         stat(filePath.replace('.java', '.class'), (err, _) => {
            if (!err) unlink(filePath.replace('.java', '.class'), () => {}); 
         });
    }
}

module.exports = runAnswer;