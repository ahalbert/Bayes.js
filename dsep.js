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

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 800,
    height: 600,
    gridSize: 1,
    model: graph
});

var varibles = {
    "a": {children : ["d","c"], parents : [], evidence : false, blocks : false},
    "b": {children : ["d"], parents : [], evidence : false, blocks : false},
    "c": {children : ["f", "g"], parents : ["a"], evidence : false, blocks : false},
    "d": {children : ["g", "h"], parents : ["b", "a"], evidence : false, blocks : false},
    "e": {children : ["h"], parents : [], evidence : false, blocks : false},
    "f": {children : [], parents : ["c"], evidence : false, blocks : false},
    "g": {children : [], parents : ["c", "d"], evidence : false, blocks : false},
    "h": {children : [], parents : ["d", "e"], evidence : false, blocks : false}
};

function isdseperated(start, target)   {
    for (v in varibles) {
        v.blocks = false;
    }
    var paths = searchForAllPaths(start, target, [], []);
    for(var i = 0; i < paths.length; i++ ) {
        var blockednodes = isPathBlocked(paths[i]);
        if (blockednodes.length === 0)
            return false;
        for (var j = 0; j < blockednodes.length; j++) {
            varibles[blockednodes[j]].blocks = true;
        }
    }
    return true;
}

function getDescendents(state, descendents) {
    var links = getPathsFrom(state);
    for (var i = 0; i < links.length; i++) {
        if (descendents.indexOf(links[i]) === -1 ) 
            descendents.push(links[i]);
        getDescendents(links[i], descendents);
    }
    return descendents;
}

function isDescendentInEvidence(state) {
    var descendents = getDescendents(state, []);
    for (var i = 0; i < descendents.length; i++) {
        if (varibles[descendents[i]].evidence === true)
            return true;
    }
    return false;
}
function isPathBlocked(path) {
    var blocks = [];
    for(var j = 1; j < path.length - 1; j++) {
        if ( isCollider(path[j-1], path[j], path[j+1])) {
            if (!varibles[path[j]].evidence && !isDescendentInEvidence(path[j])) {
                blocks.push(path[j]);
            }
        }
        else {
            if (varibles[path[j]].evidence) {
                blocks.push(path[j]);
            }
        }
    }
    return blocks;
}

// Finds all paths from a destination to a target. Operates recursively, using visited to
// avoid infinite loops. Current path is the path so far to start.
function searchForAllPaths(start, end, currentPath, visited) {
    var newCurrentPath = currentPath.slice(0); //Javascript passes arrays by reference, so I need to copy.
    newCurrentPath.push(start); 
    var newVisited = visited.slice(0);
    newVisited.push(start);

    if (start == end)  
        return [newCurrentPath];

    var links = getPathsFrom(start);
    links = links.concat(getPathsTo(start));
    var paths = [];
    for (var i = 0; i < links.length; i++) {
        if (visited.indexOf(links[i]) === -1) {
            var ret = searchForAllPaths(links[i], end, newCurrentPath, newVisited);
            for (var j = 0; j < ret.length; j++) {
                paths.push(ret[j]);
            }
        }
    }
    return paths;
}

function isCollider(start,mid,target) {
    if (varibles[mid].parents.indexOf(start) !== -1) {
        if (varibles[mid].parents.indexOf(target) !== -1)
            return true;
    }
    return false;
}

function getPathsFrom(state) {
    return varibles[state].children;
}

function getPathsTo(state) {
    return varibles[state].parents;
}
