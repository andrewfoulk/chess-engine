
var board = null;
var game = new Chess();
const depth = 3;

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}

board = Chessboard("myBoard", config);

function evaluateBoard(game) {
  let totalEvaluation = 0;

  // Define piece values
  const pieceValues = {
      'p': 1,
      'n': 2.9,
      'b': 3,
      'r': 5,
      'q': 9,
      'k': 0
  };

  // Idea to control piece value by how many squares each piece controls as well
  // Define positional values to encourage central positioning
  const positionValues = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [.2, .5, .6, .7, .8, .7, .5, 0.2],
      [.1, .5, .6, .7, .8, .7, .5, .1],
      [0, .4, .5, .7, .7, .5, .4, 0],
      [0, .4, .5, .7, .7, .5, .4, 0],
      [0, .4, .5, .5, .5, .5, .4, 0],
      [0, .2, .2, .2, .2, .2, .2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  // Iterate over the board
  for (let row = 0; row < game.board().length; row++) {
      for (let col = 0; col < game.board()[row].length; col++) {
          const square = game.board()[row][col];
          if (square) {
              const pieceValue = pieceValues[square.type];
              
              // Use mirrored position values for Black pieces
              const positionValue = square.color === 'w'
                  ? positionValues[row][col]
                  : positionValues[7 - row][col];

              totalEvaluation += ((square.color === 'w' ? 1 : -1) * pieceValue) + positionValue;
          }
      }
  }

  return totalEvaluation;
}


function maxValue(state, depth) {

  if (depth === 0 || state.game_over()) {
      return evaluateBoard(state);
  }

  let v = Number.MIN_SAFE_INTEGER;
  var possibleMoves = state.moves();

  for (let i = 0; i < possibleMoves.length; i++) {
      state.move(possibleMoves[i]);                   // Apply the move
      v = Math.max(v, minValue(state, depth - 1));    // Recurse with reduced depth
      state.undo();                                   // Undo the move
  }

  return v;
}

function minValue(state, depth) {

  if (depth === 0 || state.game_over()) {
      return evaluateBoard(state);
  }

  let v = Number.MAX_SAFE_INTEGER;
  var possibleMoves = state.moves();

  for (let i = 0; i < possibleMoves.length; i++) {
      state.move(possibleMoves[i]);                   // Apply the move
      v = Math.min(v, maxValue(state, depth - 1));    // Recurse with reduced depth
      state.undo();                                   // Undo the move
  }

  return v;
}

function minimax(state, depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0 || state.game_over()) {
      return evaluateBoard(state);
  }

  const possibleMoves = state.moves();
  if (isMaximizingPlayer) {
      let maxEval = Number.MIN_SAFE_INTEGER;
      for (let i = 0; i < possibleMoves.length; i++) {
          state.move(possibleMoves[i]);
          const eval = minimax(state, depth - 1, false, alpha, beta);
          state.undo();

          maxEval = Math.max(maxEval, eval);
          alpha = Math.max(alpha, eval);
          if (beta <= alpha) break;  // Beta cut-off (prune)
      }
      return maxEval;
  } else {
      let minEval = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < possibleMoves.length; i++) {
          state.move(possibleMoves[i]);
          const eval = minimax(state, depth - 1, true, alpha, beta);
          state.undo();

          minEval = Math.min(minEval, eval);
          beta = Math.min(beta, eval);
          if (beta <= alpha) break;  // Alpha cut-off (prune)
      }
      return minEval;
  }
}

function findBestMove(game) {
  let bestMove = null;
  const isMaximizingPlayer = game.turn() === 'w';
  let bestValue = isMaximizingPlayer ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  let alpha = Number.MIN_SAFE_INTEGER;
  let beta = Number.MAX_SAFE_INTEGER;

  const possibleMoves = game.moves();
  for (let i = 0; i < possibleMoves.length; i++) {
      game.move(possibleMoves[i]);
      const moveValue = minimax(game, depth - 1, !isMaximizingPlayer, alpha, beta);
      game.undo();

      if (isMaximizingPlayer && moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = possibleMoves[i];
          alpha = Math.max(alpha, bestValue);  // Update alpha for maximizing player
      } else if (!isMaximizingPlayer && moveValue < bestValue) {
          bestValue = moveValue;
          bestMove = possibleMoves[i];
          beta = Math.min(beta, bestValue);  // Update beta for minimizing player
      }
  }

  return bestMove;
}

function makeMove(game) {
  const bestMove = findBestMove(game);  // Find the best move based on the current depth

  if (bestMove) {
      game.move(bestMove);  // Make the best move on the board state
      board.position(game.fen());  // Update the HTML board to match the game state

      console.log(`AI move: ${bestMove.san}`);  // Log the AI's move
  } else {
      console.log("Game over or no valid moves.");
  }
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for White
  if (piece.search(/^b/) !== -1) return false
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' //always promote to a queen for simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  // make capture move for black
  window.setTimeout(() => makeMove(game), 100)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

