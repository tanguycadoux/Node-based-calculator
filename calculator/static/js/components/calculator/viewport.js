export function resetViewBox(board) {
    const w = board.clientWidth, h = board.clientHeight;
    const minViewWidth = 10;
    const viewW = minViewWidth*w/h, viewH = minViewWidth;

    board.setAttribute('viewBox', `${-viewW/2} ${-viewH/2} ${viewW} ${viewH}`);
}

function pixelsToViewBox(board, dx, dy) {
    const rect = board.getBoundingClientRect();
    const viewBox = board.viewBox.baseVal;
    return {
        dx: dx * (viewBox.width / rect.width),
        dy: dy * (viewBox.height / rect.height)
    };
}

export function initDrag(board) {
    function unDragging() {
        dragging = false;
        board.style.cursor = 'default';
    }

    let dragging = false;
    let last = { x: 0, y: 0 };

    board.addEventListener('mousedown', (e) => {
        dragging = true;
        last = { x: e.clientX, y: e.clientY };
        board.style.cursor = 'grabbing';
    });

    board.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const { dx, dy } = pixelsToViewBox(board, e.clientX - last.x, e.clientY - last.y);
        const vb = board.viewBox.baseVal;
        vb.x -= dx;
        vb.y -= dy;
        last = { x: e.clientX, y: e.clientY };
    });

    board.addEventListener('mouseup', () => unDragging());
    board.addEventListener('mouseleave', () => unDragging());
}
