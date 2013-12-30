/*
Copyright (c) Armand Halbert, 2013
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function BayesNet(vars) {
    this.variables = {};
    this.numVars = Object.keys(this.variables).length;
    for (v in vars) {
           this.variables[v] = new BayesNode(vars[v]);
    }
}

BayesNet.prototype.addVar = function (name, parents, children, obs, cpt) {
    if (typeof cpt == 'undefined')
        cpt = [];
    if (typeof obs == 'undefined')
        obs = 'none';
    if (typeof children == 'undefined')
        children = [];
    if (typeof parents == 'undefined')
        parents = [];
    this.variables[name] = {children : children, parents : parents, observation : obs, blocks : false , CPT : cpt};
    this.numVars++;
};

BayesNet.prototype.rmVar = function (name) {
    for (var v in this.variables) {
        var parentIndex = this.variables[v].parents.indexOf(name);
        var childIndex = this.variables[v].children.indexOf(name);
        if (parentIndex !== -1)
            this.variables[v].parents.splice(parentIndex, 1);
        if (childIndex !== -1)
            this.variables[v].children.splice(childIndex, 1);
    }
    delete this.variables[name];
    this.numVars--;
};

BayesNet.prototype.addRelationship = function (parent, child) {
    this.variables[parent].children.push(child);
    this.variables[child].parents.push(parent);
};

BayesNet.prototype.rmRelationship = function (parent, child) {
    var childIndex = this.variables[child].parents.indexOf(parent);
    this.variables[child].parents.splice(childIndex, 1);
    var parentIndex = this.variables[parent].children.indexOf(child);
    this.variables[parent].children.splice(parentIndex, 1);
};

BayesNet.prototype.getObservedVariables = function () {
    var observedVars = {};
    for (v in this.variables) {
        if (this.variables[v].observation != "none") {
                observedVars[v] = this.variables[v].observation;
        } 
    }
    return observedVars;
};

BayesNet.prototype.getUnobservedVariables = function () {
    var unobservedVars = {};
    for (v in this.variables) {
            if (this.variables[v].observation == "none") {
                unobservedVars[v] = this.variables[v];
        } 
    }
    return unobservedVars;
};

//general utility functions
function sumArray(a) {
    return a.reduce(function(prev,value) {return prev + value;});
}

function normalize(vector) {
    var sum = 0.0;
    for (var i = 0; i < vector.length; i++) {
        sum += vector[i];
    }
    for (i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / sum;
    }
    return vector;
}

function isConsistent(evidence, sample) {
    for (var v in evidence) {
        if (evidence[v] != sample[v])
            return false;
    }
    return true;
}
