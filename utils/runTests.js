const {exec} = require('child_process'),
      {join} = require('path'),
      {CODEDIR, MAIN_CLASS} = require('../resources/constants'),
    { promisify } = require('util'),
    { compileCode, execute } = require('./runner'),
      {unlink, stat, writeFile} = require('fs');

/**
 * Compile the answer code & runs the test cases.
 * Populates the output object. 
 * @param {[{'inputs': String, 'outputs': String, 'title': String, 'description': String}]} testCases - Array of testcases for question
 * @param {{
    * 'answer': String,
    * 'testResults': [],
    * 'compilerResult': {'status': Number, 'stdout': String, 'stderr': String},
    * 'failedTest': {},
    * passed: Boolean}} output - Output object to be populated
 * @param {String} userId - userId of the user
 */
const runTestCases = async (testCases, output, userId) => {
    // generate unique filename for each compilation
    const className = `Class${userId}${Date.now()}`;
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
        // const compilerResult = await execPromise(`javac -d ${CODEDIR} ${filePath}`, {encoding: 'utf-8'});
        const compilerResult = await compileCode(compileProcessArgs);
        output.compilerResult.stdout = compilerResult.stdout;

        // create promises array for testcases
        const testcasePromises = [];
        const runProcessArgs = ['-cp', `${CODEDIR}`, `${className}`];

        testCases.forEach(test => {
            const runProcessStdin = `${test.inputs.trim()} `.replace(new RegExp(/\s/, 'g'), '\n');;
            testcasePromises.push(
                // execPromise(`java -cp ${CODEDIR} ${className} ${test.inputs}`, {encoding: 'utf-8'})
                execute(runProcessArgs, runProcessStdin)
            );
        });

        // try & run test cases
        try {
            // run all the tests async
            const testResults = await Promise.all(testcasePromises);

            // check each test result
            testResults.forEach((results, index) => {
                const stdOut = results.stdout.replace(new RegExp('\\r', 'g'), '');
                testCases[index].outputs = testCases[index].outputs.replace(new RegExp('\\r', 'g'), '');

                const testCaseResult = {
                    testCase: testCases[index],
                    status: 0,
                    stdout: stdOut,
                    stderr: (results.stderr === '')? null : results.stderr,
                    expected: testCases[index].outputs
                };

                // set the testcase passed status
                if (!(testCases[index].outputs === stdOut))
                    testCaseResult.status = -1;

                // push the testResult obj to main output
                output.testResults.push(testCaseResult);
            });

            // check if all the tests are passed
            // update passed status
            if (output.testResults.every(result => result.status === 0))
                output.passed = true;

        } catch (err) {
            console.log('Error while running testcase', err);
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

module.exports = runTestCases;