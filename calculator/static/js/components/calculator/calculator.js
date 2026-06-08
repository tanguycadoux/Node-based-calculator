import { resetViewBox, initDrag } from "./viewport.js";

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

function drawCrosshair(board) {
    board.append(
        generateLine({"x": -1, "y":  0}, {"x": 1, "y": 0}),
        generateLine({"x":  0, "y": -1}, {"x": 0, "y": 1})
    );
}

window.addEventListener("DOMContentLoaded", function() {
    const calculatorPage = document.getElementById("calculator-page");
    const calculatorBoard = calculatorPage.querySelector('svg');

    resetViewBox(calculatorBoard);
    drawCrosshair(calculatorBoard);
    initDrag(calculatorBoard);


    document.getElementById('reset-view-button').addEventListener('click', () => resetViewBox(calculatorBoard));
});
