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


function buildGraphFromVaribleList(varibles) {
    var elements = [];
    var links = [];
    
    _.each(varibles, function(opts, parentElementLabel) {
        elements.push(makeElement(parentElementLabel, opts));

        _.each(opts.children, function(childElementLabel) {
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

function makeElement(label, opts) {

    var maxLineLength = _.max(label.split('\n'), function(l) { return l.length; }).length;

    //decide what color to use based on varible properties.
    if (opts.blocks) 
        var fillColor = 'red';
    else if (opts.evidence) 
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

function addVar(name, properties) {
    if(arguments.length == 1) {
        varibles[name.name] = {"blocks":false, "evidence" : false, "parents" : [], "children":[]};
    }
    else if(arguments.length == 2) {
        varibles[name.name] = properties; 
    }
    else {
        varibles[$("#varname").val()] = {"evidence" : false, "parents" : [], "children":[]};
    }
    drawGraph();
}

function rmVar() {
    delete varibles[$("#varname").val()];
    drawGraph();
}

function mvVar(oldName, newName) {
    varibles[newName] = varibles[oldName];
    delete varibles[oldName];
    drawGraph();
}

function addRelationship() {
    varibles[$("#parentname").val()].children.push($("#childname").val());
    varibles[$("#childname").val()].parents.push($("#parentname").val());
    drawGraph();
}

function rmRelationship() {
    var childIndex = varibles[$("#parentname").val()].children.indexOf($("#childname").val());
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
    var cells = buildGraphFromVaribleList(varibles);
    graph.resetCells(cells);
    joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
}

function handleClickEvent() {

}


drawGraph();
//event handlers
var currentName = "";
var isInVaribleNamingMode = false;
var skip = false;

//Note to self: Try building new cell, and creating the varible after the user is done typing.
$('body').keypress( function (event) {
    if(isInVaribleNamingMode) {
        if(event.which == 12 || event.which == 27) {
            currentName = "";
            isInVaribleNamingMode = false;
        }
        else {
            alert(currentName);
            var charStr = String.fromCharCode(event.which);
            graph.deleteCell(currentName);
            currentName = currentName + charStr;
            graph.addCell(makeElement(currentName));
            joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
        }
    }
});
paper.on('cell:pointerdown', 
    function(cellView, evt, x, y) { 
            toggleEvidence( cellView.model.id ); 
            drawGraph();
        }
    );
paper.on('blank:pointerdown', 
    function(cellView, evt, x, y) { 
            if(!isInVaribleNamingMode ) {
                addVar({ name : ""});            
                isInVaribleNamingMode = true;
                drawGraph();
            }
            else {
                currentName = "";
                isInVaribleNamingMode = false;
            }
        }
    );
drawGraph();
