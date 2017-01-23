'use strict';

const Promise = require('bluebird');
const repl = require('repl');
const os = require('os');


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

      return new Promise(function (resolve, reject) {
        // console.log(evt)           // Contains Action Specific data
        // console.log(_this.S)       // Contains Project Specific data
        // console.log(_this.S.state) // Contains tons of useful methods for you to use in your plugin.

        return _this._validate()
          .bind(_this)
          .then(() => {
              const funcName = _this.evt.options.function;
              const stage = _this.evt.options.stage;
              const region = _this.evt.options.region;

              const project = S.getProject();
              const func = project.getFunction(funcName);

              return func
                .getRuntime()
                .getEnvVars(func, stage, region);
          })
          .then(function (envVars) {

            // Add ENV vars (from no stage/region) to environment
            for (var key in envVars) {
              process.env[key] = envVars[key];
            }

            // Run the node REPL process here
            return repl.start({ prompt: 'sls> ' });
          })
          .then(() => {
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

