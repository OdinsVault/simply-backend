const { spawn } = require('child_process');

const compileCode = async (args) => {
    var compilerProcess = spawn('javac', args, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = "";
    for await (const chunk of compilerProcess.stdout) {
        stdout += chunk;
    }

    let stderr = "";
    for await (const chunk of compilerProcess.stderr) {
        stderr += chunk;
    }

    const status = await new Promise(resolve => {
        compilerProcess.on('close', resolve);
    });

    if (status) {
        throw { stdout: '', stderr, status: -1 };
    }
    compilerProcess.unref();
    return { stdout, stderr, status };
}

const execute = async (args, stdin) => {
    var runnerProcess = spawn('java', args, {
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    runnerProcess.stdin.write(stdin, (err) => {
        if (err) {
            console.log(err)
            return { stdout: '', stderr: `${err}`, status: -1 };
        }
    })

    setTimeout(() => {
        console.log("runnerProcess timed out")
        runnerProcess.stdin.pause();
        runnerProcess.kill();
        return { stdout: '', stderr: 'Timed out', status: -1 };
    }, 5000);

    let stdout = "";
    for await (const chunk of runnerProcess.stdout) {
        stdout += chunk;
    }

    let stderr = "";
    for await (const chunk of runnerProcess.stderr) {
        stderr += chunk;
    }
    const status = await new Promise(resolve => {
        runnerProcess.on('close', resolve);
    });


    runnerProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    if (status) {
        throw { stdout: '', stderr, status: -1 };
    }

    runnerProcess.unref();
    return { stdout, stderr, status };
}

const runCode = async (args, args2) => {
    try {
        const compilerResult = await compileCode(args);
        const testResults = await execute(args2, '0 1 2 3 ');
        return { compilerResult, testResults };
    } catch (err) {
        return err;
    }
}

module.exports = { compileCode, execute }