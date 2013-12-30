# Bayes.js

A javascript bayesian network simulation library. A demo can be found [here](http://ahalbert.nfshost.com/bayes-js/index.html).

## Installing

Just insert ```bayes.js``` or ```bayes.min.js``` into your project, and you are good to go. 

##Using

Creating a network: 

    var network = new BayesNet ({`
    "r": {children : ["s", "w"], parents : [],    observation : `"none", blocks : false , CPT : [[0.2]] },    
    "s": {children : ["w"], parents : ["r"], observation : "none", blocks : false, CPT :[[ 0.01 ], [0.4]]},
    "w": {children : [], parents : ["r", "s"], observation : "none", blocks : false, CPT : [[0.99], [ 0.8 ], [ 0.9 ], [ 0.0 ]]}
    });

Set evidence: ```network.varible["r"].observation = "T";```
    
Approximate inference: ```network.rejectionSample("s",100);```

## Building from source

uglify-js is required to build a minified version. Otherwise, just clone the repo and run ```make```. 

### Acknowledgements:

Underscore.js is used to build this library. This was inspired by my various AI classes. 

I would like this library to be as useful as possible, so please don't hesitate to send me feedback or a pull request if there are problems.
