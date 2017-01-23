Serverless REPL Plugin
------------------------------------------------------------------------
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

This goal of this plugin is to provide a `repl` command which drops you into a node.js REPL (Read Evaluate Print Loop) which has the full serverless environment.
You must choose which of your existing serverless functions to use to load the environment.


## Setup
> Not compatible with Serverless 1.0.0 and above


### Usage
Currently you must specify the following arguments:
    - `stage`: Which stage to use
    - `region`: Which region to user
    - `function`: Which function environment to load when launching the REPL

```{bash}
sls repl run -s dev -r eu-west-1 -f root-query
```


### Plugin Installation
* Install the plugin in the root of your Serverless Project:
```{bash}
npm install serverless-repl-plugin --save-dev
```

* Add the plugin to the `plugins` array in your Serverless Project's `s-project.json`, as below.

```{json}
"plugins": [
    "serverless-repl-plugin"
]
```

### Future Work
Possibly add interactive selection of stage and region if they are not explicitly specified.
