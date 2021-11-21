var game = {};

game.init = function() {
  // unchanging variables

  game.player = {};
  game.screen = {};
  game.controls = {};
  game.logics = {};
  game.time = {};

  game.controls.interactKey = 32; //space

  game.screen.canvas = document.getElementById("c");
  game.screen.ctx = game.screen.canvas.getContext("2d");

  var w = window.innerWidth <= 800 ? window.innerWidth : 800,
    h = 1200,
    ww = window.innerWidth,
    wh = window.innerHeight,
    i = 1;

  //while( w * i <= ww && h * i <= wh ) ++i;

  game.screen.canvas.width = game.logics.width = game.screen.width = w * i;
  game.screen.canvas.height = game.logics.height = game.screen.height = h * i;
  game.screen.halfw = game.logics.halfw = game.screen.width / 2;
  game.screen.halfh = game.screen.height / 2;

  game.screen.colors = [
    "#fff",
    "#000",
    "#f80808",
    "rgba(120,120,120,.6)",
    "#eee",
  ];
  game.screen.fonts = [
    "40px Verdana",
    "30px Verdana",
    "20px Verdana",
    "35px Verdana",
  ];
  game.screen.texts = [
    "jumps",
    "Squashed at <score>",
    "spacebar or touch to begin",
    "highscore of <score>",
  ];

  game.screen.lengths = [];

  game.screen.ctx.font = game.screen.fonts[2];
  game.screen.lengths[0] = game.screen.ctx.measureText(
    game.screen.texts[0]
  ).width;

  game.screen.ctx.font = game.screen.fonts[2];
  game.screen.lengths[1] = game.screen.ctx.measureText(
    game.screen.texts[2]
  ).width;

  game.screen.midBezierPassingMultiplier = 2;
  game.screen.midBezierFriction = 0.8;
  game.screen.midBezierAccMultiplier = 0.1;
  game.screen.barSizeVel = 0.02;

  game.screen.pillarHeight = 6;

  game.logics.gravity = 0.3;
  game.logics.friction = 0.9;
  game.logics.pillars = [];

  game.logics.basePillarWidth = 35;
  game.logics.addedPillarWidth = 50;
  game.logics.basePillarWait = 90;
  game.logics.addedPillarWait = 30;
  game.logics.lastPillarInitialWaitDecrementer = 2;

  game.logics.playerThresholdVel = 6;
  game.logics.playerIncrementMultiplier = 1.01;
  game.logics.playerDecrementMultiplier = 0.992;

  game.logics.playerThresholdJumpVel = 2;

  game.time.updateMS = 16;

  game.reset(); // changing variables

  game.controls.menuing = true;

  // constants so that I don't have to calculate some stuff every time
  game.constants = [
    -game.player.size / 2,
    game.screen.halfw * 1.5 - game.screen.lengths[0] / 2,
    game.screen.height - 30,
    game.screen.halfw * 1.5 - game.screen.lengths[0] / 2 - 6,
    game.screen.height - 48,
    game.screen.lengths[0] + 10,
    game.screen.halfw - game.screen.lengths[1] / 2,
  ];

  game.anim(); // start

  //event listeners

  game.controls.interact = function() {
    if (game.controls.menuing) game.controls.menuing = false;

    if (game.player.dead) {
      game.reset();
      game.anim();
    } else if (game.controls.canInteract) game.controls.interacted = true;
  };

  window.addEventListener("keydown", function(e) {
    if (e.keyCode === game.controls.interactKey) game.controls.interact();
  });
  window.addEventListener("touchstart", game.controls.interact);

  if (!localStorage.game_highScore) localStorage.game_highScore = 0;
};
game.reset = function() {
  game.controls.canInteract = true;
  game.controls.interacted = false;
  game.controls.lastInteraction = 0;
  game.controls.menuing = false;

  game.player.dead = false;

  game.player.x = (game.logics.halfw * 3) / 2;
  game.player.y = game.logics.height - 100;
  game.player.vx = 0;
  game.player.vy = -3;
  game.player.ax = 0;
  game.player.ay = -0.0005;

  game.player.size = 18;
  game.player.side = 1;
  game.player.rotation = 0;

  game.player.usedJumps = 0;
  game.player.maxJumps = 5;

  game.logics.pillars.length = 0;
  game.logics.lastPillar = 300;
  game.logics.lastPillarSide = 1;
  game.logics.lastPillarInitialWait = 60;

  game.screen.midBezier = 0;
  game.screen.midBezierVel = 0;

  game.screen.barSize = 1;

  game.logics.score = 0;

  game.time.now = Date.now();
  game.time.leftOverMS = 0;
  document.getElementById("score").classList = "";
  document.getElementById("score").innerText = "";
};
game.anim = function() {
  if (!game.player.dead) window.requestAnimationFrame(game.anim);
  else return game.over();

  var now = Date.now(),
    elapsed = game.time.leftOverMS + (now - game.time.now);

  if (elapsed > 50) elapsed = 0;

  while (elapsed > game.time.updateMS && !game.player.dead) {
    game.updatePlayer();
    if (!game.controls.menuing) game.updatePillars();

    elapsed -= game.time.updateMS;
  }

  if (game.player.dead) return game.over();

  game.time.leftOverMS = elapsed;
  game.time.now = now;

  game.drawBackground();
  game.drawPillars();
  game.drawPlayer();
  game.drawTexts();
};

game.over = function() {
  var ctx = game.screen.ctx;

  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = game.screen.colors[3];
  ctx.fillRect(0, 0, game.screen.width, game.screen.height);

  ctx.fillStyle = game.screen.colors[4];
  ctx.font = game.screen.fonts[3];
  var text = game.screen.texts[1].replace("<score>", game.logics.score);
  document.getElementById("score").classList = "end";
  document.getElementById("score").innerText = game.logics.score;
  ctx.fillText(
    text,
    game.screen.halfw - ctx.measureText(text).width / 2,
    game.screen.halfh - 20
  );

  var highscore = +localStorage.game_highScore;
  if (game.logics.score > highscore)
    localStorage.game_highScore = game.logics.score;

  ctx.font = game.screen.fonts[2];
  text = game.screen.texts[3].replace("<score>", localStorage.game_highScore);
  ctx.fillText(
    text,
    game.screen.halfw - ctx.measureText(text).width / 2,
    game.screen.halfh + 20
  );
};
game.updatePlayer = function() {
  var player = game.player;

  var didntWarp = false;

  if (player.x < -player.size) {
    player.x += game.logics.width + player.size;
    player.vx *= 0.8;
  } else if (player.x > game.logics.width + player.size) {
    player.x -= game.logics.width + player.size;
    player.vx *= 0.8;
  } else didntWarp = true;

  var newSide = player.x < game.logics.halfw ? 1 : -1;

  if (newSide !== player.side && didntWarp) {
    player.ax = 0;
    player.usedJumps = 0;

    game.screen.midBezierVel =
      player.vx * game.screen.midBezierPassingMultiplier;
    game.screen.midBezier = 0;
  }

  player.side = newSide;

  if (Math.abs(player.vx) > game.logics.playerThresholdVel)
    player.vx *= game.logics.playerDecrementMultiplier;
  else player.vx *= game.logics.playerIncrementMultiplier; // keep it constantish

  if (!game.controls.menuing) player.vy += player.ay;

  player.x += player.vx +=
    game.logics.gravity * player.side + (player.ax *= game.logics.friction);
  player.rotation = Math.atan(player.vy / player.vx); // it's symmetric so...

  if (
    --game.controls.lastInteraction &&
    game.controls.interacted &&
    player.usedJumps < player.maxJumps
  ) {
    game.controls.lastInteraction = 10;
    game.controls.interacted = false;

    ++player.usedJumps;

    player.ax = -player.side / 3;
    player.vx -= player.side * 2;
    if (
      Math.sign(player.vx) === player.side ||
      Math.abs(player.vx) < game.logics.playerThresholdJumpVel
    )
      player.vx = -player.side * 2;
  }
};
game.updatePillars = function() {
  var player = game.player;

  game.logics.lastPillar += player.vy;

  if (game.logics.lastPillar <= 0) {
    var num = 0;

    do {
      if (Math.random() < 0.7) game.logics.lastPillarSide *= -1;

      var x =
          (game.logics.halfw +
            Math.random() * game.logics.halfw * game.logics.lastPillarSide) |
          0,
        width =
          (game.logics.basePillarWidth +
            (game.logics.addedPillarWidth * Math.random()) / (num + 1)) |
          0,
        found = -1;

      for (var i = 0; i < game.logics.pillars.length; ++i)
        if (game.logics.pillars[i].dead) found = i;

      var pillar = found > -1 ? game.logics.pillars[found] : {};
      pillar.x = x;
      pillar.y = 0;
      pillar.warping = x + width > game.logics.width;

      if (pillar.warping) {
        pillar.w = game.logics.width - x;
        pillar.warpLeft = width - pillar.w;
      } else pillar.w = width;

      pillar.dead = false;

      if (found === -1) game.logics.pillars.push(pillar);

      // just a smoothener so mplethat it's easier in the beginning
      if (game.logics.lastPillarInitialWait > 0)
        game.logics.lastPillarInitialWait -=
          game.logics.lastPillarInitialWaitDecrementer;
      game.logics.lastPillar =
        (game.logics.lastPillarInitialWait +
          (game.logics.basePillarWait +
            game.logics.addedPillarWait * Math.random())) |
        0;

      ++num;
    } while (Math.random() < 0.1 && num < 2);
  }
  for (var i = 0; i < game.logics.pillars.length; ++i) {
    var pillar = game.logics.pillars[i];

    if (pillar.dead) continue;

    pillar.y -= player.vy; // if you go towards something it's as if they went towards you

    if (pillar.y > game.logics.height) {
      pillar.dead = true;
    } else if (pillar.y > player.y && pillar.y + player.vy < player.y) {
      if (
        (player.x > pillar.x && player.x < pillar.x + pillar.w) ||
        (pillar.warping && player.x <= pillar.warpLeft)
      ) {
        player.dead = true;
      } else {
        ++game.logics.score;
      }
    }
  }
};
game.drawBackground = function() {
  game.screen.midBezier += game.screen.midBezierVel -=
    game.screen.midBezier * game.screen.midBezierAccMultiplier;
  game.screen.midBezierVel *= game.screen.midBezierFriction;

  var ctx = game.screen.ctx;

  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = game.screen.colors[0];
  ctx.fillRect(
    0,
    0,
    game.screen.halfw +
      (game.screen.midBezier > 0 ? (game.screen.midBezier / 2) | 0 : 0),
    game.screen.height
  );

  ctx.fillStyle = game.screen.colors[1];
  ctx.beginPath();
  ctx.moveTo(game.screen.halfw, 0);
  ctx.lineTo(game.screen.width, 0);
  ctx.lineTo(game.screen.width, game.screen.height);
  ctx.lineTo(game.screen.halfw, game.screen.height);
  ctx.quadraticCurveTo(
    game.screen.halfw + game.screen.midBezier,
    game.player.y,
    game.screen.halfw,
    0
  );
  ctx.fill();
};
game.drawPillars = function() {
  var ctx = game.screen.ctx;

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = game.screen.colors[2];

  for (var i = 0; i < game.logics.pillars.length; ++i) {
    var pillar = game.logics.pillars[i];

    if (!pillar.dead) {
      ctx.fillRect(pillar.x, pillar.y, pillar.w, game.screen.pillarHeight);
      if (pillar.warping)
        ctx.fillRect(0, pillar.y, pillar.warpLeft, game.screen.pillarHeight);
    }
  }
};
game.drawPlayer = function() {
  var ctx = game.screen.ctx,
    player = game.player;

  ctx.globalCompositeOperation = "difference";

  ctx.fillStyle = game.screen.colors[0];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);
  ctx.fillRect(game.constants[0], game.constants[0], player.size, player.size); // -player.size / 2;
  ctx.restore();
};
game.drawTexts = function() {
  var ctx = game.screen.ctx;

  ctx.globalCompositeOperation = "difference";

  ctx.fillStyle = game.screen.colors[0];

  var prop =
    game.screen.barSize - (1 - game.player.usedJumps / game.player.maxJumps);

  if (prop < 0) game.screen.barSize += game.screen.barSizeVel;
  else if (prop > game.screen.barSizeVel)
    game.screen.barSize -= game.screen.barSizeVel;

  ctx.font = game.screen.fonts[2];

  ctx.fillText(game.screen.texts[0], game.constants[1], game.constants[2]); // game.screen.halfw * 1.5 - game.screen.lengths[ 0 ] / 2; game.screen.height - 30;
  ctx.fillRect(
    game.constants[3],
    game.constants[4],
    game.screen.barSize * game.constants[5],
    25
  ); // game.screen.halfw * 1.5 - game.screen.lenghts[ 0 ] / 2 - 5; game.screen.height - 48; game.screen.lengths[ 0 ] + 10

  ctx.font = game.screen.fonts[1];

  var text = game.logics.score;
  ctx.fillText(text, game.screen.halfw - ctx.measureText(text).width / 2, 80);

  if (game.controls.menuing) {
    ctx.font = game.screen.fonts[2];
    ctx.fillText(game.screen.texts[2], game.constants[6], game.screen.halfh); // game.screen.halfw - game.screen.lengths[ 1 ] / 2
  }
};

game.init();
