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
    width: 500,
    height: 400,
    gridSize: 1,
    model: graph
});

var selected;

function buildGraphFromvariableList(variables) {
    var elements = [];
    var links = [];
    
    _.each(variables, function(opts, parentElementLabel) {
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
    var fillColor;

    //decide what color to use based on variable properties.
    if (opts.blocks) 
        fillColor = 'red';
    else if (opts.observation != "none") 
        fillColor = 'green';
    else 
        fillColor = 'white';
    // Compute width/height of the rectangle based on the number 
    // of lines in the label and the letter size. 0.6 * letterSize is
    // an approximation of the monospace font letter width.
    var letterSize = 8;
    var width = 2 * (letterSize * (0.6 * maxLineLength + 1));
    var height = 2 * ((label.split('\n').length + 1) * letterSize);

    var variable =  new joint.shapes.basic.Rect({
        name : label,
        id: label,
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


function drawCondtionalProbabilityTable(variable) {
    var v = variables[variable];
    var rows = Math.pow(2, v.parents.length);
    var table = "<table border=1><td colspan=\"" + String(v.parents.length+1) +  "\">" + generateObservationRadio(v) + " </td></tr><tr>";
    for (var i = 0; i < v.parents.length; i++) {
        table += "<td>&nbsp;&nbsp;" + v.parents[i] + "&nbsp;&nbsp;</td>";
    }
    table += "<td>&nbsp;&nbsp; P &nbsp;&nbsp;</td></tr>";
    var form = generateTrueFalseRows(rows,v.parents.length).reverse();
    for (var i = 0; i < form.length; i++) {
        table += "<tr>";
        for (var j = 0; j < form[i].length; j++) {
           table += "<td>" + form[i][j]+ "</td>" ;
        }
        table += "<td><input id=\"" + selected + form[i] + "\" class=\"form-control\"></input></td></tr>";
    }
    table += "<tr><td colspan=\"" + String(v.parents.length+1) +  "\"><button id=\"update-cpt\" onclick=\"updateCPT()\">update</button></td></tr></table>";
    $('#probtable').html(table);
}

function generateObservationRadio(variable) {
        if (variable.observation == "true") 
            return "<input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"true\">true</input><input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"false\">false</input><input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"none\">none</input>";
        if (variable.observation == "false") 
            return "<input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"true\">true</input><input type=\"radio\" name=\"observed" + selected + "\" checked onclick=toggleObservation() value=\"false\">false</input><input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"none\">none</input>";
        return "<input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"true\">true</input><input type=\"radio\" name=\"observed" + selected + "\" onclick=toggleObservation() value=\"false\">false</input><input type=\"radio\" name=\"observed" + selected + "\"  onclick=toggleObservation() value=\"none\" checked>none</input>";
}

function generateTrueFalseRows(numRows, varsLeft) {
    var TFvalue = "T";
    var ret = [];
    for (var i = 0; i < numRows; i++) {
        ret[i] = "";
    }
    if (varsLeft === 0)
        return ret;
    var rows  = generateTrueFalseRows(numRows, varsLeft - 1 );
    for (i = rows.length - 1; i >= 0; i--) {
       ret[i] = TFvalue + rows[i];
       if (i % Math.pow(2, varsLeft - 1) === 0 )
        TFvalue = toggleTrueFalseValue(TFvalue);
    }
    return ret;
}

function updateCPT() {
    var variable = variables[selected];
    var entries = Math.pow(2, variable.parents.length);
    var cpt = [];
    var truefalsestrings = generateTrueFalseRows(entries,variable.parents.length).reverse();
    for(var i = 0; i < entries; i++) {
        var pvalue = $('#'+selected+truefalsestrings[i]).val();
        pvalue = parseFloat(pvalue);
        if(isNaN(pvalue) || pvalue > 1.0 || pvalue < 0) {
            console.log("error! A parmater is NaN or not between 0 and 1!"); //TODO: Put in exception handling.
            return;
        }
        cpt.push(pvalue); 
    }
    variable.cpt = cpt;
}

function toggleTrueFalseValue(val) {
    if (val == "T")
        return "F";
    return "T";
}

function addVar(name, properties) {
    if(arguments.length == 1) {
        variables[name.name] = {"blocks":false, "observation" : false, "parents" : [], "children":[]};
    }
    else if(arguments.length == 2) {
        variables[name.name] = properties; 
    }
    else {
        variables[$("#varname").val()] = {"observation" : false, "parents" : [], "children":[]};
    }
    drawGraph();
}

function rmVar() {
    delete variables[$("#varname").val()];
    drawGraph();
}

function mvVar(oldName, newName) { 
    variables[newName] = variables[oldName];
    delete variables[oldName];
    drawGraph();
}

function addRelationship() {
    variables[$("#parentname").val()].children.push($("#childname").val());
    variables[$("#childname").val()].parents.push($("#parentname").val());
    drawGraph();
}

function rmRelationship() {
    var childIndex = variables[$("#parentname").val()].children.indexOf($("#childname").val());
    variables[$("#childname").val()].parents.splice(childIndex, 1);
    var parentIndex = variables[$("#childname").val()].parents.indexOf($("#parentname").val());
    variables[$("#childname").val()].parents.splice(parentIndex, 1);
    drawGraph();
}

function toggleObservation() { 
    console.log(selected);
    variables[selected].blocks = false;
    variables[selected].observation = $('input[name="observed' +  selected +'"]:checked').val();
    drawGraph();
}

function queryDSeperation() {
    for (v in variables) {
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

function selectVariable(variable) {
    selected = variable;
    drawCondtionalProbabilityTable(variable);
} 

function drawGraph() {
    var cells = buildGraphFromvariableList(variables);
    graph.resetCells(cells);
    joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
}


drawGraph();


paper.on('cell:pointerdown', 
    function(cellView, evt, x, y) { 
            selectVariable( cellView.model.id ); 
            drawGraph();
        }
    );
drawGraph();
