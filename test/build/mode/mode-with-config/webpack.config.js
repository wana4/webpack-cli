const path = require('path');
const dirname = __dirname;

module.exports = () => {
    const config = {
        entry: './index.js',
        output: {
            path: path.join(dirname, 'dist'),
            filename: '[name].js',
        },
    };
    return config;
};
