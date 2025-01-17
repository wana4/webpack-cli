<div align="center">
    <a href="https://github.com/webpack/webpack-cli">
        <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
    </a>
</div>

# webpack CLI

The official CLI of webpack

## About

webpack CLI provides a flexible set of commands for developers to increase speed when setting up a custom webpack project. As of webpack v4, webpack is not expecting a configuration file, but often developers want to create a more custom webpack configuration based on their use-cases and needs. webpack CLI addresses these needs by providing a set of tools to improve the setup of custom webpack configuration.

## How to install

When you have followed the [Getting Started](https://webpack.js.org/guides/getting-started/) guide of webpack then webpack CLI is already installed!

Otherwise

```bash
npm install --save-dev webpack-cli
```

or

```bash
yarn add webpack-cli --dev
```

## Supported arguments and commands

### Usage

All interactions with webpack-cli are of the form

```bash
npx webpack-cli [command] [options]
```

If no command is specified then `bundle` command is used by default

### Help Usage

To display basic commands and arguments -

```bash
npx webpack-cli --help
```

To display all supported commands and arguments -

```bash
npx webpack-cli --help=verbose
```

or

```bash
npx webpack-cli --help verbose
```

### Available Commands

```
  build|bundle|b [entries...] [options]                 Run webpack (default command, can be omitted).
  configtest|t [config-path]                            Validate a webpack configuration.
  help|h [command] [option]                             Display help for commands and options.
  info|i [options]                                      Outputs information about your system.
  init|create|new|c|n [generation-path] [options]       Initialize a new webpack project.
  loader|l [output-path] [options]                      Scaffold a loader.
  migrate|m <config-path> [new-config-path]             Migrate a configuration to a new version.
  plugin|p [output-path] [options]                      Scaffold a plugin.
  serve|server|s [entries...] [options]                 Run the webpack dev server.
  version|v [commands...]                               Output the version number of 'webpack', 'webpack-cli' and 'webpack-dev-server' and commands.
  watch|w [entries...] [options]                        Run webpack and watch for files changes.
```

### webpack 4

```
  Options:
  --analyze                     It invokes webpack-bundle-analyzer plugin to get bundle information
  -c, --config <value...>       Provide path to a webpack configuration file e.g. ./webpack.config.js.
  --config-name <value...>      Name of the configuration to use.
  -m, --merge                   Merge two or more configurations using 'webpack-merge'.
  --env <value...>              Environment passed to the configuration when it is a function.
  --node-env <value>            Sets process.env.NODE_ENV to the specified value.
  --progress [value]            Print compilation progress during build.
  -j, --json [value]            Prints result as JSON or store it in a file.
  -d, --devtool <value>         Determine source maps to use.
  --no-devtool                  Do not generate source maps.
  --entry <value...>            The entry point(s) of your application e.g. ./src/main.js.
  -h, --hot [value]             Enables Hot Module Replacement
  --no-hot                      Disables Hot Module Replacement
  --mode <value>                Defines the mode to pass to webpack.
  --name <value>                Name of the configuration. Used when loading multiple configurations.
  -o, --output-path <value>     Output location of the file generated by webpack e.g. ./dist/.
  --prefetch <value>            Prefetch this request
  --stats [value]               It instructs webpack on how to treat the stats e.g. verbose.
  --no-stats                    Disable stats output.
  -t, --target <value...>       Sets the build target e.g. node.
  -w, --watch                   Watch for files changes.
  --no-watch                    Do not watch for file changes.
  --watch-options-stdin         Stop watching when stdin stream has ended.
  --no-watch-options-stdin      Do not stop watching when stdin stream has ended.

Global options:
  --color                       Enable colors on console.
  --no-color                    Disable colors on console.
  -v, --version                 Output the version number of 'webpack', 'webpack-cli' and 'webpack-dev-server' and commands.
  -h, --help [verbose]          Display help for commands and options.
```

### webpack 5

Checkout [`OPTIONS.md`](../../OPTIONS.md) to see list of all available options.
