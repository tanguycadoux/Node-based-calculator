import { resetViewBox, initDrag, pixelsToViewBox } from "./viewport.js";

class Node {
    constructor(id) {
        this.position = {x: 0, y: 0};
        this.size = {'width': 10, 'height': 10};
        this.id = id;
        // this.inputSockets = [
        //     'Couleur',
        //     'Forme',
        // ];
        // this.outputSockets = [
        //     'Alpha',
        //     'Beta',
        //     'Gamma',
        // ];
        this.inputSockets  = [];
        this.outputSockets = [];
    }
    
    static headerSize = 2;
    static contentSizeWithoutNode = 2;
    static padding = .4;
    static socketSize = .6;
    static fontSize = 1;
    static strokeWidth = .1;

    #updateSize() {
        if (this.inputSockets.length == 0 && this.outputSockets.length == 0) {
            this.size.height = Node.headerSize + Node.contentSizeWithoutNode;
        }
        else {
            const inputSocketsSize  = this.inputSockets.length  * (Node.socketSize + Node.padding) - Node.padding;
            const outputSocketsSize = this.outputSockets.length * (Node.socketSize + Node.padding) - Node.padding;
            this.size.height = Node.headerSize + 2*Node.padding + Math.max(inputSocketsSize, outputSocketsSize);
        }
    }

    draw(layer, board) {
        function initDrag(initPos, group, grabZone, board){
            function unDragging(e) {
                e.stopPropagation();
                dragging = false;
                grabZone.style.cursor = 'grab';
            }

            let dragging = false;
            let last = { x: 0, y: 0 };
            let pos = initPos;

            grabZone.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                dragging = true;
                last = { x: e.clientX, y: e.clientY };
                grabZone.style.cursor = 'grabbing';
            });
            
            grabZone.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                e.stopPropagation();
                const { dx, dy } = pixelsToViewBox(board, e.clientX - last.x, e.clientY - last.y);
                pos.x += dx;
                pos.y += dy;
                group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                last = { x: e.clientX, y: e.clientY };
            });

            grabZone.addEventListener('mouseup',    (e) => unDragging(e));
            grabZone.addEventListener('mouseleave', (e) => unDragging(e));
        }

        function drawSocket(x, y, text, color, textAlign) {
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            let textAnchor = 'start';
            let textXpos = x + (Node.socketSize/2 + Node.padding);
            if (textAlign == 'right') {
                textAnchor = 'end';
                textXpos = x - (Node.socketSize/2 + Node.padding);
            }

            const fontSize = Node.fontSize/2;
            group.append(
                generateCircle(x, y, Node.socketSize/2, color, {'stroke': 'black', 'strokeWidth': Node.strokeWidth}),
                generateText(textXpos, y + fontSize/3, text, fontSize, textAnchor),
            );
            return group;
        }

        function drawSockets(sockets, x, color, layer, textAlign) {
            let socketNumber = 0;
            for (const socket of sockets) {
                const y = contentUp + Node.padding + Node.socketSize/2 + socketNumber * (Node.padding + Node.socketSize);
                layer.append(drawSocket(x, y, socket, color, textAlign));
                socketNumber += 1;
            }
        }

        this.#updateSize();
        
        const left  = this.position.x - this.size.width/2
        const right = this.position.x + this.size.width/2
        const up    = this.position.y - this.size.height/2
        const contentUp = up + Node.headerSize;
        
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");

        let background = newGenerateRect({
            x: left, y: up,
            width: this.size.width, height: this.size.height,
            fill: 'lightgray',
            stroke: {stroke: 'black', strokeWidth: Node.strokeWidth},
            cornerRadius: Node.padding,
        });
        
        let header = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let grabZoneBackground = newGenerateRect({
            x: left, y: up,
            width: this.size.width, height: Node.headerSize,
            fill: 'transparent',
            stroke: {stroke: 'transparent', strokeWidth: 0},
        });

        let content = document.createElementNS("http://www.w3.org/2000/svg", "g");

        group.id = `node_${this.id}`
        
        header.append(
            grabZoneBackground,
            newGenerateLine({
                p1: {x: left, y:contentUp}, p2: {x: right, y:contentUp}
            }),
            generateText(left + Node.padding, up + Node.padding + Node.fontSize, `Id = ${this.id}`, Node.fontSize),
        );

        drawSockets(this.inputSockets,  left,  'green', content, 'left');
        drawSockets(this.outputSockets, right, 'red',   content, 'right');

        group.append(
            background,
            header,
            content,
        );

        header.style.cursor = 'grab';
        initDrag(this.position, group, header, board);

        layer.append(group);
    }
}

class NodeStore {
    #nodes = new Map();

    add(node) {
        if (this.#nodes.has(node.id)) {
            throw new Error(`Node with id ${node.id} already exists`);
        }
        this.#nodes.set(node.id, node);
    }

    remove(id) {
        return this.#nodes.delete(id);
    }

    get(id) {
        return this.#nodes.get(id);
    }

    has(id) {
        return this.#nodes.has(id);
    }

    *ids() {
        yield* this.#nodes.keys();
    }

    *nodes() {
        yield* this.#nodes.values();
    }
}

function newGenerateLine({
    p1={x, y}, p2={x, y},
    stroke={'stroke': 'black', 'strokeWidth': .1},
}) {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute('x1', p1.x);
    line.setAttribute('x2', p2.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('y2', p2.y);

    line.setAttribute('stroke', stroke.stroke);
    line.setAttribute('stroke-width', stroke.strokeWidth);

    return line
}

function newGenerateRect({
    x, y, width, height,
    fill='white',
    stroke={'stroke': 'black', 'strokeWidth': .1},
    cornerRadius=0
}) {
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width',  width);
    rect.setAttribute('height', height);
    
    rect.setAttribute('fill', fill);

    rect.setAttribute('stroke', stroke.stroke);
    rect.setAttribute('stroke-width', stroke.strokeWidth);

    rect.setAttribute('rx', cornerRadius);

    return rect
}

function generateCircle(x, y, radius, fill='white', stroke={'stroke': 'black', 'strokeWidth': .1}) {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', radius);

    circle.setAttribute('fill', fill)

    circle.setAttribute('stroke', stroke.stroke);
    circle.setAttribute('stroke-width', stroke.strokeWidth);

    return circle
}

function generateText(x, y, textContent, fontSize, textAnchor='start') {
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");

    text.textContent = textContent;
    text.setAttribute('x', x);
    text.setAttribute('y', y);

    text.setAttribute('font-size', fontSize);
    text.setAttribute('text-anchor', textAnchor);
    
    text.setAttribute('dominant-baseline', 'auto')

    return text
}

function drawbackgroundLayer(board) {
    const bgLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

    bgLayer.id = 'background_layer';
    drawCrosshair(bgLayer);
    board.append(bgLayer)
}

function drawMainLayer(board) {
    const mainLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

    mainLayer.id = 'main_layer';
    board.append(mainLayer)

    return mainLayer
}

function drawCrosshair(layer) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    group.id = 'global_crosshair';
    group.append(
        newGenerateLine({
            p1: {x: -1, y: 0}, p2: {x: 1, y: 0}
        }),
        newGenerateLine({
            p1: {x: 0, y: -1}, p2: {x: 0, y: 1}
        }),
    );

    layer.append(group);
}

function createNode(nodesStore) {
    let nodeId = 0;
    for (const id of nodesStore.ids()) {
        nodeId = id+1;
    }
    
    const node = new Node(nodeId);
    nodesStore.add(node);

    return nodeId
}

function drawNodes(board, nodesStore, selectedList) {
    const mainLayer = board.getElementById('main_layer');

    mainLayer.innerHTML = "";
    // D'abord celles pas sélectionnées
    for (const node of nodesStore.nodes()) {
        if (selectedList.includes(node.id)) {
            continue
        }
        node.draw(mainLayer, board);
    }
    // Puis celles sélectionnées
    for (const node of nodesStore.nodes()) {
        if (selectedList.includes(node.id)) {
            node.draw(mainLayer, board);
        }
    }
}

function selectNode(id, nodesStore, selectedList) {
    if (!nodesStore.has(id)) {
        throw new Error(`Node ${id} cannot be selected: not found.`);
    }
    const options = document.getElementById('overlay-node-options');
    options.classList.remove('hidden');
    options.getElementsByTagName('summary')[0].textContent = `Node ${id} options`;
    selectedList.push(id);
}

window.addEventListener("DOMContentLoaded", function() {
    const calculatorPage = document.getElementById("calculator-page");
    const calculatorBoard = calculatorPage.querySelector('svg');

    resetViewBox(calculatorBoard);
    drawbackgroundLayer(calculatorBoard);
    const mainLayer = drawMainLayer(calculatorBoard);
    initDrag(calculatorBoard);

    document.getElementById('reset-view-button').addEventListener('click', () => resetViewBox(calculatorBoard));
    document.getElementById('add-node-button').addEventListener('click', () => {
        const id = createNode(nodesStore);
        selectedNodes = [];
        selectNode(id, nodesStore, selectedNodes);
        drawNodes(calculatorBoard, nodesStore, selectedNodes);
    });
    document.getElementById('update-draw-button').addEventListener('click', () => drawNodes(calculatorBoard, nodesStore, selectedNodes));
});

const nodesStore = new NodeStore();
let selectedNodes = [];

window.debug = {
    selectNode: (id) => {selectedNodes = []; selectNode(id, nodesStore, selectedNodes); console.log(selectedNodes);},
}
