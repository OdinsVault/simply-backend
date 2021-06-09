const assert = require('assert');
const runAnswer = require('../utils/runAnswer')
var chaiAsPromised = require("chai-as-promised");

describe('Code Execution', () => {
 it('test result', async () => {

    const output = {
        answer: "class Main { public static void main(String[] args){System.out.println(\"hello\");}}",
        testResults: null,
        compilerResult: {
            status: 0,
            stdout: null,
            stderr: null
        },
        passed: false
    };
    const question = {
        _id: "604499c1f7c198351c81cb83",
        title: "Hello World",
        description: "Print Hello World to console",
        inputs: "Hello",
        outputs: "Hello World",
        difficulty: "Easy",
        category: "1",
        pointsAllocated: "10",
        testcases: [{
          inputs: "Hello World",
          outputs: "Hello World",
          title: "Print Hello World",
          description: "Print Hello World - desc",
        }],
        level: "1"
    }

    var runAnswerRes = runAnswer({
        inputs: "Hello",
        outputs: "Hello World",
        output,
        userId:1234,
        lang: "ENG"

    })
    });
});