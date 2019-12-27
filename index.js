const randomInRange = max => Math.floor(Math.random() * Math.floor(max));

const randomSettings = () => {
    let _maxSize = 40;
    let _randDensity = (Math.random() + 0.1) / 4; // Bounded between 0.1 and 0.275
    let _randx = randomInRange(_maxSize) + 5;
    let _randy = randomInRange(_maxSize) + 5;
    if (_randy > _randx) {
        let _tempx = _randx;
        _randx = _randy;
        _randy = _tempx;
    }
    let _randnumMines = Math.round(_randx * _randy * _randDensity);
    return { size : { x: _randx, y: _randy }, numMines: _randnumMines };
};

const gameModes = {
    "Beginner" : { size : { x : 9, y : 9 }, numMines : 10 },
    "Intermediate" : { size : { x : 16, y : 16 }, numMines : 40 },
    "Expert" : { size : { x : 30, y : 16 }, numMines : 99 },
    "Random" : (() => randomSettings())(),
    // "Testing" : { size : { x : 30, y : 20 }, numMines : 0 }
};

const gameModeButton = (difficulty) => `<button class="gamemode" onclick="initWDiff('${difficulty}')">${difficulty}</button>`;

let buttonHTML = "";
Object.keys(gameModes).forEach(difficulty => {
    buttonHTML += gameModeButton(difficulty);
});
document.getElementById("gamemodes").innerHTML = buttonHTML;

const difficulty_rating = (size, numMines) => numMines / (size.x * size.y) / 0.20625;
function initWDiff(difficulty) {
    gameMode = (difficulty == "Random") ? randomSettings() : gameModes[difficulty];
    initGameWHTML(difficulty, gameMode.size, gameMode.numMines);
}

function initCustom() {
    const size = {
        x : parseInt(document.getElementById("size.x").value || 30),
        y : parseInt(document.getElementById("size.y").value || 30)
    };
    const numMines = parseInt(document.getElementById("numMine") || 100);
    
    initGameWHTML("Custom", size, numMines);
}

function initGameWHTML(difficulty, size, numMines) {
    const _b = new Board(size, numMines);
    const _bNode = _b.render();
    document.getElementById("board").innerHTML = "";
    document.getElementById("board").append(_bNode);

    document.getElementById("board-info").innerHTML = 
        `Playing ${difficulty.toLowerCase()} ${size.x}x${size.y} board 
            with ${numMines} mines (${ Math.round(difficulty_rating(size, numMines) * 100) }% difficulty)`;
}

/*
    1 light blue
    2 green
    3 red
    4 dark blue
    5 brown
    6 aqua
    7 black
    8 light grey
*/
const colorList = ["#add8e6", "#00FF00", "#FF0000", "#003366", "#654321", "#00ffff", "#000000", "#d3d3d3"];
class Board {
    constructor(size, numMines) {
        this.board = Array.from(Array(size.y), () => new Array(size.x));
        for (var y = 0; y < size.y; y++)
            for (var x = 0; x < size.x; x++)
                this.board[y][x] = new Tile(x, y, this);
        this.size = size;
        this.is_gameover = false;
        
        this.numMines = numMines;
        this.mineList = [];
        this.addMines();

        this.boardNode = document.createElement("div");
        this.boardNode.className = "inner-board";

        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                const curTile = this.getTile(x, y);
                const adjList = curTile.getAdjTiles(true);
                const numAdj = adjList.reduce((numMines, tile) => numMines + (tile.is_mine ? 1 : 0), 0);
                curTile.num_adj_mines = numAdj;
            }
        }
    }

    addMines() {
        let numAdded = 0;
        while (numAdded < this.numMines) {
            const x = randomInRange(this.size.x);
            const y = randomInRange(this.size.y);
            
            this.mineList.push(this.getTile(x, y));
            this.board[y][x].make_mine();
            numAdded++;
        }
    }

    getTile(x, y) { return this.board[y][x]; }

    guess(x, y) {
        const guessed_tile = this.getTile(x, y);
        guessed_tile.guess();
    }

    blowAllMines() {
        this.is_gameover = true;
        for (var mine of this.mineList) mine.guess();
    }

    render() {
        var y = -1;
        this.board.forEach(row => {
            row.forEach(tile => {
                const tileNode = tile.render();
                this.boardNode.appendChild(tileNode);
            });
            this.boardNode.appendChild(document.createElement("br"));
        });
        return this.boardNode;
    }

    win() {
        for (var row of this.board)
            for (var tile of row)
                if (!tile.is_mine) tile.guess();
    }
}
class Tile {
    constructor(x, y, board) {
        this.board = board;
        this.x = x;
        this.y = y;

        this.checked = false;
        this.is_mine = false;
        this.num_adj_mines = 0;

        this.tileNode = "";
    }

    getAdjTiles(include_corners) {
        var adjList = [];
        for (var x_offset = -1; x_offset <= 1; x_offset++) {
            for (var y_offset = -1; y_offset <= 1; y_offset++) {
                const x_coord = this.x + x_offset;
                const y_coord = this.y + y_offset;

                const in_x_range = x_coord >= 0 && x_coord < this.board.size.x;
                const in_y_range = y_coord >= 0 && y_coord < this.board.size.y;

                const is_corner = Math.abs(x_offset) == Math.abs(y_offset);
                const add_corner = is_corner ? include_corners : true;

                const is_center = x_offset == 0 && y_offset == 0;

                if (in_x_range && in_y_range && add_corner && !is_center) adjList.push(this.board.getTile(x_coord, y_coord));
            }
        }
        return adjList;
    }

    make_mine() {
        this.is_mine = true;
    }

    guess() {
        if (!this.checked) {
            this.checked = true;
            this.tileNode.classList.add("checked");

            if (this.is_mine) { 
                this.tileNode.classList.add("exploded");
                this.board.blowAllMines();
            } else {
                if (this.num_adj_mines == 0) {
                    const adjList = this.getAdjTiles(false);
                    for (var adjTile of adjList) adjTile.guess();
                } else {
                    this.tileNode.style.color = colorList[this.num_adj_mines - 1];
                    this.tileNode.innerText = this.num_adj_mines;
                }
            }
        }
    }

    render() {
        const tileNode = document.createElement('button');
        tileNode.classList = [ "box" ];
        tileNode.id = `${this.x},${this.y}`;
        tileNode.onclick = () => this.board.guess(this.x, this.y);
        tileNode.innerText = ".";

        this.tileNode = tileNode;

        return this.tileNode;
    }
}