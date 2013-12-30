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
