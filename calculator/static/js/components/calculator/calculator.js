import { resetViewBox, initDrag, pixelsToViewBox } from "./viewport.js";

class Node {
    constructor(id) {
        this.position = {x: 0, y: 0};
        this.size = {'width': 2, 'height': 2};
        this.id = id;
    }

    draw(board) {
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
        
        const left = this.position.x - this.size.width/2
        const up   = this.position.y - this.size.height/2
        
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let background = generateRect(
            left, up,
            this.size.width, this.size.height,
        )
        
        let grabZone = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let grabZoneBackground = generateRect(
            left, up,
            this.size.width, this.size.height/4
        )
        
        background.setAttribute('fill', 'lightgray');
        grabZoneBackground.setAttribute('fill', 'lightgray');

        grabZone.append(
            grabZoneBackground,
            generateText(left + .1, up + .4, `Id = ${this.id}`, .3)
        );
        group.append(
            background,
            grabZone
        );

        grabZone.style.cursor = 'grab';
        initDrag(this.position, group, grabZone, board);

        board.append(group);
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

function generateLine(point1, point2) {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute('x1', point1.x);
    line.setAttribute('x2', point2.x);
    line.setAttribute('y1', point1.y);
    line.setAttribute('y2', point2.y);

    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', .1);

    return line
}

function generateRect(x, y, width, height) {
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width',  width);
    rect.setAttribute('height', height);

    rect.setAttribute('stroke', 'black');
    rect.setAttribute('stroke-width', .1);

    return rect
}

function generateText(x, y, textContent, fontSize) {
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");

    text.textContent = textContent;
    text.setAttribute('x', x);
    text.setAttribute('y', y);

    text.setAttribute('font-size', fontSize);
    
    text.setAttribute('dominant-baseline', 'auto')

    return text
}

function drawCrosshair(board) {
    board.append(
        generateLine({"x": -1, "y":  0}, {"x": 1, "y": 0}),
        generateLine({"x":  0, "y": -1}, {"x": 0, "y": 1})
    );
}

function createNode(board, nodesStore) {
    let nodeIndex = 0;
    for (const id of nodesStore.ids()) {
        nodeIndex = id+1;
    }
    
    const node = new Node(nodeIndex);
    nodesStore.add(node);

    drawNodes(board, nodesStore);
}

function drawNodes(board, nodesStore) {
    clearBoard(board);
    for (const node of nodesStore.nodes()) {
        node.draw(board);
    }
}

function clearBoard(board) {
    board.innerHTML = "";
}

window.addEventListener("DOMContentLoaded", function() {
    const calculatorPage = document.getElementById("calculator-page");
    const calculatorBoard = calculatorPage.querySelector('svg');
    const nodesStore = new NodeStore();

    resetViewBox(calculatorBoard);
    drawCrosshair(calculatorBoard);
    initDrag(calculatorBoard);

    document.getElementById('reset-view-button').addEventListener('click', () => resetViewBox(calculatorBoard));
    document.getElementById('add-node-button').addEventListener('click', () => createNode(calculatorBoard, nodesStore));
});
