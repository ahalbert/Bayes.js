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

