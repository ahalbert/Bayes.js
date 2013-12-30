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
function BayesNode(variable) {
        this.parents = variable.parents;
        this.children = variable.children;
        if (typeof variable.domain == 'undefined')
            this.domain = ['T','F'];
        else
            this.domain = variable.domain;
        this.observation = variable.observation;
        this.CPT = variable.CPT;
        this.cptOrder = this.generateDomainValueRows(Math.pow(2, variable.parents.length), variable.parents.length).reverse();
        this.sampleDistribution = [];
        for (var i = 0; i < this.CPT.length; i++) {
            var s = [];
            if(this.CPT[i].length == this.domain.length - 1)
                this.CPT[i].push(1 - sumArray(this.CPT[i]));
            s.push(this.CPT[i][0]);
            for (var j = 1; j < this.domain.length - 1; j++) {
               s.push(this.CPT[i][j]+s[j-1]);
            }
            s.push(1.0);
            this.sampleDistribution.push(s);

        }
        //TODO: Check if CPT is valid
}

BayesNode.prototype.sample = function (evidence) {
    var e = "";
    for (var i = 0; i < this.parents.length; i++) {
         e += evidence[this.parents[i]];
    }
    for (var i = 0; i < this.cptOrder.length; i++) {
        if (e == this.cptOrder[i]) {
            var randomVariable = Math.random();
            for (var j = 0; j < this.domain.length; j++) {
                if (randomVariable < this.sampleDistribution[i][j])
                    return this.domain[j]
            }
        }
    }
    return null;
}

BayesNode.prototype.P = function (evidence, value) {
    var valueIndex = this.domain.indexOf(value)
    var e = "";
    for (var i = 0; i < this.parents.length; i++) {
         e += evidence[this.parents[i]];
    }
    for (var i = 0; i < this.cptOrder.length; i++) {
        if (e == this.cptOrder[i]) 
            return this.CPT[i][valueIndex];
    }
    return Number.NaN;
};


BayesNode.prototype.toggleDomainValue = function (value) {
    var index = this.domain.indexOf(value);
    index++;
    if (index == this.domain.length)
        index = 0;
    return this.domain[index];
};

BayesNode.prototype.generateDomainValueRows = function (numRows, varsLeft) {
    var domainValue = this.domain[0];
    var ret = [];
    for (var i = 0; i < numRows; i++) {
        ret[i] = "";
    }
    if (varsLeft === 0)
        return ret;
    var rows  = this.generateDomainValueRows(numRows, varsLeft - 1 );
    for (i = rows.length - 1; i >= 0; i--) {
       ret[i] = domainValue + rows[i];
       if (i % Math.pow(2, varsLeft - 1) === 0 )
        domainValue = this.toggleDomainValue(domainValue);
    }
    return ret;
};
BayesNet.prototype.isdseperated = function (start, target)   {
    isSeperated = true;
    for (v in this.variables) {
        v.blocks = false;
    }
    var paths = this.searchForAllPaths(start, target, [], []);
    for(var i = 0; i < paths.length; i++ ) {
        var blockednodes = this.isPathBlocked(paths[i]);
        if (blockednodes.length === 0)
            isSeperated =  false;
        for (var j = 0; j < blockednodes.length; j++) {
            this.variables[blockednodes[j]].blocks = true;
        }
    }
    return isSeperated;
};

BayesNet.prototype.isDescendentObserved = function (state) {
    var descendents = this.getDescendents(state, []);
    for (var i = 0; i < descendents.length; i++) {
        if (this.variables[descendents[i]].observation != "none")
            return true;
    }
    return false;
};

BayesNet.prototype.isPathBlocked = function (path) {
    var blocks = [];
    for(var j = 1; j < path.length - 1; j++) {
        if ( this.isCollider(path[j-1], path[j], path[j+1])) {
            if (this.variables[path[j]].observation == "none" && !this.isDescendentObserved(path[j])) {
                blocks.push(path[j]);
            }
        }
        else {
            if (this.variables[path[j]].observation != "none") {
                blocks.push(path[j]);
            }
        }
    }
    return blocks;
};

// Finds all paths from a destination to a target. Operates recursively, using visited to
// avoid infinite loops. Current path is the path so far to start.
BayesNet.prototype.searchForAllPaths = function (start, end, currentPath, visited) {
    var newCurrentPath = currentPath.slice(0); //Javascript passes arrays by reference, so I need to copy.
    newCurrentPath.push(start); 
    var newVisited = visited.slice(0);
    newVisited.push(start);

    if (start == end)  
        return [newCurrentPath];

    var links = this.getPathsFrom(start);
    links = links.concat(this.getPathsTo(start));
    var paths = [];
    for (var i = 0; i < links.length; i++) {
        if (visited.indexOf(links[i]) === -1) {
            var ret = this.searchForAllPaths(links[i], end, newCurrentPath, newVisited);
            for (var j = 0; j < ret.length; j++) {
                paths.push(ret[j]);
            }
        }
    }
    return paths;
};

BayesNet.prototype.isCollider = function (start,mid,target) {
    if (this.variables[mid].parents.indexOf(start) !== -1) {
        if (this.variables[mid].parents.indexOf(target) !== -1)
            return true;
    }
    return false;
};

BayesNet.prototype.getDescendents = function (state, descendents) {
    var links = this.getPathsFrom(state);
    for (var i = 0; i < links.length; i++) {
        if (descendents.indexOf(links[i]) === -1 ) 
            descendents.push(links[i]);
        this.getDescendents(links[i], descendents);
    }
    return descendents;
};

BayesNet.prototype.getPathsFrom = function (state) {
    return this.variables[state].children;
};

BayesNet.prototype.getPathsTo = function (state) {
    return this.variables[state].parents;
};
BayesNet.prototype.topologicalSort = function () {
    L  = [];
    S = [];
    edgesLeft = {};
    for (key in this.variables) {
        if (this.variables[key].parents.length === 0)
            S.push(key);
        edgesLeft[key] = this.variables[key].parents.length;
    }
    while (S.length > 0) {
        var node_s = S.pop();
        L.push(node_s);
        for (var i = 0; i < this.variables[node_s].children.length; i++) {
            var child = this.variables[node_s].children[i]
            edgesLeft[child] = edgesLeft[child] - 1;
            if(edgesLeft[child] === 0){
                S.push(child); 
            }
        }
    } //TODO:If cycle, return error;
    return L;
};

BayesNet.prototype.enumerationInference = function (query)  {
    var hidden = this.getUnobservedVariables();
    var evidence = this.getObservedVariables();
    var distribution = [];
    for (var i = 0; i < this.variables[query].domain.length; i++) {
        evidence[query] = this.variables[query].domain[i];
        distribution.push(this.enumerateAll(query, this.topologicalSort().reverse(), evidence));
    }
    return normalize(distribution);
};

BayesNet.prototype.enumerateAll = function (query, vars, evidence) {
    if (vars.length == 0)
        return 1.0;
    var newvars = _.extend([], vars);
    var y = newvars.pop();
    if (typeof evidence[y] !== 'undefined') {
            var newevidence = _.extend({}, evidence);
            return this.variables[y].P(evidence, evidence[y]) * this.enumerateAll(query, newvars, newevidence);
    }
    else {
        var sum = [];
        for (var i = 0; i <this.variables[y].domain.length; i++) {
            var newevidence = _.extend({}, evidence);
            newevidence[y] = this.variables[y].domain[i];
            sum.push(this.variables[y].P(evidence, this.variables[y].domain[i]) * this.enumerateAll(query, newvars, newevidence));
        }
    }
        return sumArray(sum);
}; 

BayesNet.prototype.rejectionSampling = function (query, N) {
    var values = [] ;
    var evidence = this.getObservedVariables();
    for (var i = 0; i < this.variables[query].domain.length; i++) {
        values.push(0);
    }
    for (i = 0; i < N; i++) {
        var sample = this.priorSample();
        var s = sample[query];
        if (isConsistent(evidence, sample))
            values[this.variables[query].domain.indexOf(s)]++;
    }
    return normalize(values);
};


BayesNet.prototype.priorSample = function () {
    var vars = this.topologicalSort();
    var sample = {};
    for (var i = 0; i < vars.length; i++) {
        var node = vars[i];
        sample[node] = this.variables[node].sample(sample);
    }
    return sample;
};

BayesNet.prototype.liklihoodWeighting = function (query, N) {
    var W = [];
    for (var i = 0; i < this.variables[query].domain.length; i++) {
        W.push(0);
    }
    for (var i = 0; i < N; i++) {
       var w = this.weightedSample();
       var s  = this.variables[query].domain.indexOf(w['sample'][query]);
       W[s] = W[s] + w['weight'];
    }
    return normalize(W);
};

BayesNet.prototype.weightedSample = function () {
    var w = 1;
    var events = this.getObservedVariables();
    var vars = this.topologicalSort();
    for (var i = 0; i < vars.length; i++) {
        var node  = vars[i];
        if (typeof events[node] !== 'undefined') {
            w = w*this.variables[node].P(events);
        }
        else {
            events[node] = this.variables[node].sample(events);
        }
    }
    return {weight:w, sample:events};
};

BayesNet.prototype.gibbsSampling = function (query, N) {
    var distribution = [];
    for (var i = 0; i < this.variables[query].domain.length; i++) {
        W.push(0);
    }
    for (var i = 0; i < N; i++) {
        for (var i = 0; i < this.variables.length; i++) {
            var v = this.variables[i];
            v.observation = v.sample();
            distribution[this.variables[query].domain.indexOf(query.observation)]++;
        }
    }
    normalize(distribution);
};

