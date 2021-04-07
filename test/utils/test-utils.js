/* eslint-disable node/no-unpublished-require */

'use strict';

const stripAnsi = require('strip-ansi');
const path = require('path');
const fs = require('fs');
const execa = require('execa');
const internalIp = require('internal-ip');
const { exec } = require('child_process');
const { node: execaNode } = execa;
const { Writable } = require('readable-stream');
const concat = require('concat-stream');
const { version } = require('webpack');
const isWebpack5 = version.startsWith('5');

let devServerVersion;

try {
    devServerVersion = require('webpack-dev-server/package.json').version;
} catch (error) {
    // Nothing
}

const isDevServer4 = devServerVersion && devServerVersion.startsWith('4');

const WEBPACK_PATH = path.resolve(__dirname, '../../packages/webpack-cli/bin/cli.js');
const ENABLE_LOG_COMPILATION = process.env.ENABLE_PIPE || false;
const isWindows = process.platform === 'win32';

const hyphenToUpperCase = (name) => {
    if (!name) {
        return name;
    }
    return name.replace(/-([a-z])/g, function (g) {
        return g[1].toUpperCase();
    });
};

/**
 * Run the webpack CLI for a test case.
 *
 * @param {String} testCase The path to folder that contains the webpack.config.js
 * @param {Array} args Array of arguments to pass to webpack
 * @param {Object<string, any>} options Boolean that decides if a default output path will be set or not
 * @returns {Promise}
 */
const run = async (testCase, args = [], options = {}) => {
    const cwd = path.resolve(testCase);
    const { nodeOptions = [] } = options;
    const processExecutor = nodeOptions.length ? execaNode : execa;

    return processExecutor(WEBPACK_PATH, args, {
        cwd,
        reject: false,
        stdio: ENABLE_LOG_COMPILATION ? 'inherit' : 'pipe',
        maxBuffer: Infinity,
        ...options,
    });
};

/**
 * Run the webpack CLI in watch mode for a test case.
 *
 * @param {String} testCase The path to folder that contains the webpack.config.js
 * @param {Array} args Array of arguments to pass to webpack
 * @param {Object<string, any>} options Boolean that decides if a default output path will be set or not
 * @param {string} outputKillStr String to kill
 * @returns {Object} The webpack output or Promise when nodeOptions are present
 */
const runWatch = (testCase, args = [], options, outputKillStr = /webpack \d+\.\d+\.\d/) => {
    const cwd = path.resolve(testCase);

    return new Promise((resolve, reject) => {
        const proc = execa(WEBPACK_PATH, args, {
            cwd,
            reject: false,
            stdio: 'pipe',
            ...options,
        });

        proc.stdout.pipe(
            new Writable({
                write(chunk, encoding, callback) {
                    const output = chunk.toString('utf8');

                    if (outputKillStr.test(output)) {
                        if (isWindows) {
                            exec('taskkill /pid ' + proc.pid + ' /T /F');
                        } else {
                            proc.kill();
                        }
                    }

                    callback();
                },
            }),
        );

        proc.then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        });
    });
};

const runAndGetWatchProc = (testCase, args = [], setOutput = true, input = '', forcePipe = false) => {
    const cwd = path.resolve(testCase);

    const outputPath = path.resolve(testCase, 'bin');
    const argsWithOutput = setOutput ? args.concat('--output-path', outputPath) : args;

    const options = {
        cwd,
        reject: false,
        stdio: ENABLE_LOG_COMPILATION && !forcePipe ? 'inherit' : 'pipe',
    };

    // some tests don't work if the input option is an empty string
    if (input) {
        options.input = input;
    }

    const webpackProc = execa(WEBPACK_PATH, argsWithOutput, options);

    return webpackProc;
};
/**
 * runPromptWithAnswers
 * @param {string} location location of current working directory
 * @param {string[]} args CLI args to pass in
 * @param {string[]} answers answers to be passed to stdout for inquirer question
 * @param {boolean} waitForOutput whether to wait for stdout before writing the next answer
 */
const runPromptWithAnswers = (location, args, answers, waitForOutput = true) => {
    const runner = runAndGetWatchProc(location, args, false, '', true);

    runner.stdin.setDefaultEncoding('utf-8');

    const delay = 2000;
    let outputTimeout;

    if (waitForOutput) {
        let currentAnswer = 0;
        const writeAnswer = (output) => {
            if (!answers) {
                runner.stdin.write(output);
                runner.kill();
                return;
            }

            if (currentAnswer < answers.length) {
                runner.stdin.write(answers[currentAnswer]);
                currentAnswer++;
            }
        };

        runner.stdout.pipe(
            new Writable({
                write(chunk, encoding, callback) {
                    const output = chunk.toString('utf8');
                    if (output) {
                        if (outputTimeout) {
                            clearTimeout(outputTimeout);
                        }
                        // we must receive new stdout, then have 2 seconds
                        // without any stdout before writing the next answer
                        outputTimeout = setTimeout(() => {
                            writeAnswer(output);
                        }, delay);
                    }

                    callback();
                },
            }),
        );
    } else {
        // Simulate answers by sending the answers every 2s
        answers.reduce((prevAnswer, answer) => {
            return prevAnswer.then(() => {
                return new Promise((resolvePromise) => {
                    setTimeout(() => {
                        runner.stdin.write(answer);
                        resolvePromise();
                    }, delay);
                });
            });
        }, Promise.resolve());
    }

    return new Promise((resolve) => {
        const obj = {};
        let stdoutDone = false;
        let stderrDone = false;
        const complete = () => {
            if (outputTimeout) {
                clearTimeout(outputTimeout);
            }
            if (stdoutDone && stderrDone) {
                runner.kill('SIGKILL');
                resolve(obj);
            }
        };

        runner.stdout.pipe(
            concat((result) => {
                stdoutDone = true;
                obj.stdout = result.toString();
                complete();
            }),
        );

        runner.stderr.pipe(
            concat((result) => {
                stderrDone = true;
                obj.stderr = result.toString();
                complete();
            }),
        );
    });
};

/**
 *
 * @param {String} testCase - testCase directory
 * @param {String} file - file relative to testCase
 * @param {String} data - data to append
 * @returns {undefined}
 * @throws - throw an Error if file does not exist
 */
const appendDataIfFileExists = (testCase, file, data) => {
    const filePath = path.resolve(testCase, file);
    if (fs.existsSync(filePath)) {
        fs.appendFileSync(filePath, data);
    } else {
        throw new Error(`Oops! ${filePath} does not exist!`);
    }
};

/**
 * fs.copyFileSync was added in Added in: v8.5.0
 * We should refactor the below code once our minimal supported version is v8.5.0
 * @param {String} testCase - testCase directory
 * @param {String} file - file relative to testCase which is going to be copied
 * @returns {String} - absolute file path of new file
 * @throws - throw an Error if file copy fails
 */
const copyFileAsync = async (testCase, file) => {
    const fileToChangePath = path.resolve(testCase, file);
    const fileMetaData = path.parse(file);
    const fileCopyName = fileMetaData.name.concat('_copy').concat(fileMetaData.ext);
    const copyFilePath = path.resolve(testCase, fileCopyName);
    fs.access(fileToChangePath, fs.F_OK, (accessErr) => {
        if (accessErr) throw new Error(`Oops! ${fileToChangePath} does not exist!`);
    });
    const data = fs.readFileSync(fileToChangePath);
    fs.writeFileSync(copyFilePath, data);
    return copyFilePath;
};

const runInstall = async (cwd) => {
    await execa('yarn', {
        cwd,
    });
};

const readFile = (path, options = {}) =>
    new Promise((resolve, reject) => {
        fs.readFile(path, options, (err, stats) => {
            if (err) {
                reject(err);
            }
            resolve(stats);
        });
    });

const readdir = (path) =>
    new Promise((resolve, reject) => {
        fs.readdir(path, (err, stats) => {
            if (err) {
                reject(err);
            }
            resolve(stats);
        });
    });

const mkdir = (path) => {
    if (fs.existsSync(path)) {
        return path;
    }

    new Promise((resolve) => {
        const interval = setInterval(() => {
            if (!fs.existsSync(path)) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
    fs.mkdirSync(path);
};

const uniqueDirectoryForTest = async (assetsPath) => {
    const localDir = Date.now().toString();

    const result = path.resolve(assetsPath, localDir);

    await mkdir(result);

    return result;
};

const normalizeStdout = (stdout) => {
    if (stdout.length === 0) {
        return stdout;
    }

    return stripAnsi(stdout);
};

const normalizeStderr = (stderr) => {
    if (stderr.length === 0) {
        return stderr;
    }

    let normalizedStderr = stderr;

    normalizedStderr = normalizedStderr.replace(/\\/g, '/').replace(new RegExp(process.cwd().replace(/\\/g, '/'), 'g'), '<cwd>');

    const networkIPv4 = internalIp.v4.sync();

    if (networkIPv4) {
        normalizedStderr = normalizedStderr.replace(new RegExp(networkIPv4, 'g'), '<network-ip-v4>');
    }

    const networkIPv6 = internalIp.v6.sync();

    if (networkIPv6) {
        normalizedStderr = normalizedStderr.replace(new RegExp(networkIPv6, 'g'), '<network-ip-v6>');
    }

    normalizedStderr = normalizedStderr.replace(/:[0-9]+\//g, ':<port>/');

    if (!networkIPv6) {
        // Github Actions doesnt' support IPv6 on ubuntu in some cases
        normalizedStderr = normalizedStderr.split('\n');

        const ipv4MessageIndex = normalizedStderr.findIndex((item) => /On Your Network \(IPv4\)/.test(item));

        if (ipv4MessageIndex !== -1) {
            normalizedStderr.splice(
                ipv4MessageIndex + 1,
                0,
                '<i> [webpack-dev-server] On Your Network (IPv6): http://[<network-ip-v6>]:<port>/',
            );
        }

        normalizedStderr = normalizedStderr.join('\n');
    }

    return normalizedStderr;
};

module.exports = {
    run,
    runWatch,
    runAndGetWatchProc,
    runPromptWithAnswers,
    appendDataIfFileExists,
    copyFileAsync,
    runInstall,
    hyphenToUpperCase,
    readFile,
    readdir,
    mkdir,
    uniqueDirectoryForTest,
    normalizeStdout,
    isWebpack5,
    isDevServer4,
    isWindows,
    normalizeStderr,
};
