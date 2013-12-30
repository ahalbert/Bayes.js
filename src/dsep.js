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
