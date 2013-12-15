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

var adjacencyList = {
    "a" : ["c", "d"], "b": ["d"], "c": [ "f", "g" ], "d" : ["g", "h"], "e" : ["h"], "f" : [], "g" : [] , "h" : [] 
    };
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

function buildGraphFromAdjacencyList(adjacencyList) {
    var elements = [];
    var links = [];
    
    _.each(adjacencyList, function(edges, parentElementLabel) {
        elements.push(makeElement(parentElementLabel));

        _.each(edges, function(childElementLabel) {
            links.push(makeLink(parentElementLabel, childElementLabel));
        });
    });

    // Links must be added after all the elements. This is because when the links
    // are added to the graph, link source/target
    // elements must be in the graph already.
    return elements.concat(links);
}

function makeLink(parentElementLabel, childElementLabel) {

    return new joint.dia.Link({
        source: { id: parentElementLabel },
        target: { id: childElementLabel },
        attrs: { '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' } },
        smooth: true
    });
}

function makeElement(label, evidence) {

    var maxLineLength = _.max(label.split('\n'), function(l) { return l.length; }).length;

    if (varibles[label].blocks) 
        var fillColor = 'red';
    else if (varibles[label].evidence) 
        var fillColor = 'green';
    else 
        var fillColor = 'white';
    // Compute width/height of the rectangle based on the number 
    // of lines in the label and the letter size. 0.6 * letterSize is
    // an approximation of the monospace font letter width.
    var letterSize = 8;
    var width = 2 * (letterSize * (0.6 * maxLineLength + 1));
    var height = 2 * ((label.split('\n').length + 1) * letterSize);

    var variable =  new joint.shapes.basic.Rect({
        name : label,
        id: label,
        onclick : function () {alert("hello");},
        size: { width: width, height: height },
        attrs: {
            text: { text: label, 'font-size': letterSize, 'font-family': 'monospace' },
            rect: {
                fill : fillColor, 
                width: width, height: height,
                rx: 5, ry: 5,
                stroke: '#555'
            }
        }
    });
    return variable;
}

function addVar(opts) {
    if(opts != undefined) {
    adjacencyList[opts.name] = []
    varibles[opts.name] = {"blocks":false, "evidence" : false, "parents" : [], "children":[]};
    }
    else {
    adjacencyList[$("#varname").val()] = [];
    varibles[$("#varname").val()] = {"evidence" : false, "parents" : [], "children":[]};
    }
    drawGraph();
}

function rmVar() {
    delete adjacencyList[$("#varname").val()];
    delete varibles[$("#varname").val()];
    drawGraph();
}

function mvVar(oldName, newName) {
    adjacencyList[newName] = adjacencyList[oldName];
    delete adjacencyList[oldName];
    varibles[newName] = varibles[oldName];
    delete varibles[$("#varname").val()];
    drawGraph();
}

function addRelationship() {
    adjacencyList[$("#parentname").val()].push($("#childname").val());
    varibles[$("#parentname").val()].children.push($("#childname").val());
    varibles[$("#childname").val()].parents.push($("#parentname").val());
    drawGraph();
}

function rmRelationship() {
    var childIndex = adjacencyList[$("#parentname").val()].indexOf($("#childname").val());
    adjacencyList[$("#parentname").val()].splice(childIndex,1);
    childIndex = varibles[$("#parentname").val()].children.indexOf($("#childname").val());
    varibles[$("#childname").val()].parents.splice(childIndex, 1);
    var parentIndex = varibles[$("#childname").val()].parents.indexOf($("#parentname").val());
    varibles[$("#childname").val()].parents.splice(parentIndex, 1);
    drawGraph();
}

function toggleEvidence(name) {
    varibles[name].blocks = false;
    if (varibles[name].evidence) 
        varibles[name].evidence = false;
    else 
        varibles[name].evidence = true;
    drawGraph();
}

function queryDSeperation() {
    for (v in varibles) {
        v.blocks = false;
    }
    drawGraph();
    var start = $("#qstart").val();
    var end = $("#qend").val();
    if (isdseperated(start, end))
        $("#querymessage").html(start + " and " + end + " are d-seperated.");
    else
        $("#querymessage").html(start + " and " + end + " are d-connected.");
    drawGraph();
}

function drawGraph() {
    var cells = buildGraphFromAdjacencyList(adjacencyList);
    graph.resetCells(cells);
    joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
}

function handleClickEvent() {

}

drawGraph();
//event handlers

var isInAddMode  = false;
paper.on('cell:pointerdown', 
    function(cellView, evt, x, y) { 
            toggleEvidence( cellView.model.id ); 
            drawGraph();
        }
    );
paper.on('blank:pointerdown', 
    function(cellView, evt, x, y) { 
            addVar("hello");            
            isInAddMode = true;
            drawGraph();
        }
    );
drawGraph();
