'use strict';

const Promise = require('bluebird');
const fs = require('fs');
const os = require('os');
const repl = require('repl');

const HISTORY_FILE_NAME = '.node_repl_history';


module.exports = function getPlugin(S) {
  const SCli = require(S.getServerlessPath('utils/cli'));
  const SError = require(S.getServerlessPath('Error'));

  class ServerlessRepl extends S.classes.Plugin {
    static getName() {
      return `com.serverless.${ServerlessRepl.name}`;
    }

    registerActions() {
      S.addAction(this._replAction.bind(this), {
        handler:       'replAction',
        description:   'Drop into a node.js REPL with the full serverless environment',
        context:       'repl',
        contextAction: 'run',
        options:       [
          {
            option:      'function',
            shortcut:    'f',
            description: 'the function whose environment you want to run under'
          },
          {
            option:      'region',
            shortcut:    'r',
            description: 'region you want to run your function in'
          },
          {
            option:      'stage',
            shortcut:    's',
            description: 'serverless stage'
          }
        ],
        parameters: []
      });

      return Promise.resolve();
    }

    _replAction(evt) {
      this.evt = evt;
      let _this = this;

      const stage = _this.evt.options.stage;
      const region = _this.evt.options.region;
      const funcName = _this.evt.options.function;

      return new Promise(function (resolve, reject) {
        // console.log(evt)           // Contains Action Specific data
        // console.log(_this.S)       // Contains Project Specific data
        // console.log(_this.S.state) // Contains tons of useful methods for you to use in your plugin.

        return _this._validate()
          .bind(_this)
          .then(() => {
            const project = S.getProject();
            const func = project.getFunction(funcName);

            return func
              .getRuntime()
              .getEnvVars(func, stage, region);
          })
          .then(envVars => {

            // Add ENV vars (from no stage/region) to environment
            for (var key in envVars) {
              process.env[key] = envVars[key];
            }

            // Run the node REPL process here
            return repl.start({ terminal: true, useColors: true, prompt: `sls [${region}][${stage}]> ` });
          })
          .then(server => {
            try {
              // load command history from a file in the current directory
              fs.readFileSync(HISTORY_FILE_NAME, { encoding: 'utf-8' })
                .split('\n')
                .reverse()
                .filter(line => line.trim())
                .map(line => server.history.push(line));
            }
            catch(err) { /* swallow */ }

            // On exit, save the history
            server.on('exit', function() {
              fs.appendFileSync(HISTORY_FILE_NAME, server.lines.filter(s => s !== '').join('\n') + '\n');
            });

            return resolve(evt);
          });
      });
    }

    _validate() {
      //[TODO: Interactively select the stage anmd region?]

      if (!this.evt.options.stage) {
        return Promise.reject(new SError('No stage specified, aborting'));
      }
      if (!this.evt.options.region) {
        return Promise.reject(new SError('No region specified, aborting'));
      }
      if (!this.evt.options.function) {
        return Promise.reject(new SError('No function specified, aborting'));
      }

      return Promise.resolve();
    }

  }

  return ServerlessRepl;
};

