const path = require('path');

const webpack = require('webpack');
//eslint-disable-next-line node/no-unpublished-require
const [devServerVersion] = require('webpack-dev-server/package.json').version;
const [webpackVersion] = webpack.version;

const snapshotExtension = `.snap.webpack${webpackVersion}`;
const snapshotExtensionForServe = `.snap.devServer${devServerVersion}.webpack${webpackVersion}`;

module.exports = {
    resolveSnapshotPath: (testPath) => {
        if (testPath.includes('serve')) {
            return path.join(path.dirname(testPath), '__snapshots__', `${path.basename(testPath)}${snapshotExtensionForServe}`);
        } else {
            return path.join(path.dirname(testPath), '__snapshots__', `${path.basename(testPath)}${snapshotExtension}`);
        }
    },
    resolveTestPath: (snapshotPath) => snapshotPath.replace(`${path.sep}__snapshots__`, '').slice(0, -snapshotExtension.length),
    testPathForConsistencyCheck: path.join('consistency_check', '__tests__', 'example.test.js'),
};
