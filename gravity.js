// Global variables 
var frameRate = 1 / 100; //Seconds
var frameDelay = frameRate * 1000; //ms
var scale = 1; 
var bodies = [];
var projectiles = [];
var cannons = new _2DArray(5);
var width = canvas.width;
var height = canvas.height;

//Settings
var settings = {
    zoomSpeed: 0.015,
    panSpeed: 50,
    minScale: 0.1,
    maxScale: 3,
    maxBodies: 200,
    gravityStrength: 1,
    satelliteSize: 1,
};

var projectileSettings = {
  speed: 500,
  radius: 2,
  lifeLength: 300
};

/*
 * Key and mouse down and up handlers
 */
var mouse = {
    x: 0,
    y: 0,
    leftDown: false,
    rightDown: false
};

function getMousePosition(e) {
    mouse.x = (e.pageX - canvas.offsetLeft) / scale;
    mouse.y = (e.pageY - canvas.offsetTop) / scale;
};

function mouseDown(e) {
  switch (event.which) {
        case 1: // left mouse button
            break;
        case 2: // right mouse button
            break;
        case 3: // middle mouse button
            break;
        default:
            /* Nothing */
    }
};

function mouseUp(e) {
    switch (event.which) {
        case 1: // left mouse button
            break;
        case 2: // right mouse button
            break;
        case 3: // middle mouse button
            break;
        default:
            /* Nothing */
    }
};

var keys = {
    upDown: false,
    downDown: false,
    leftDown: false,
    rightDown: false,
    pageDown: false,
    pageUp: false,
    enterDown: false
};

function keyDown (e) {
    if (e.which == 38) keys.upDown = true;
    if (e.which == 40) keys.downDown = true;
    if (e.which == 37) keys.leftDown = true;
    if (e.which == 39) keys.rightDown = true;
    if (e.which == 33) keys.pageUp = true;
    if (e.which == 34) keys.pageDown = true;
    if (e.which == 13) {
    keys.enterDown = true;
      for (i = 0; i < cannons.length; i++) {
        for (j = 0; j < cannons[i].length; j++) {
          projectiles.push(new GravityWell({x: cannons[i][j].x, y: cannons[i][j].y, xVel: projectileSettings.speed * Math.sin(cannons[i][j].angle), yVel: projectileSettings.speed * Math.cos(cannons[i][j].angle), radius: projectileSettings.radius, density: 1}));
        }
      }
    }
};

function keyUp (e) {
    if (e.which == 38) keys.upDown = false;
    if (e.which == 40) keys.downDown = false;
    if (e.which == 37) keys.leftDown = false;
    if (e.which == 39) keys.rightDown = false;
    if (e.which == 33) keys.pageUp = false;
    if (e.which == 34) keys.pageDown = false;
};
/*
 * End key and mouse down and up handlers
 */

/*
 * Gravity Well class
 */
function GravityWell(args) {
	this.x = args.x || width / 2;
	this.y = args.y || height / 2;
  this.Fx = 0;
  this.Fy = 0;
	this.xVel = args.xVel || 0;
	this.yVel = args.yVel || 0;
	this.density = args.density || 1;
	this.radius = args.radius || 5;
	this.mass = args.density * (4/3) * Math.PI * args.radius * args.radius;
	this.color = args.color || 'black';
	this.diameter = args.radius * 2;
  this.updateCount = 0;
  this.isActive = true;
  this.health = 100;
};

// Update the position of the gravity well
GravityWell.prototype.forceFrom = function(that) {
	
	var xDist = this.x - that.x;
  var yDist = this.y - that.y;
  var radius = this.distance(that);
  
  var cos = xDist / radius;
  var sin = yDist / radius;
  
  this.Fx += settings.gravityStrength * -cos * (this.mass * that.mass) / radius;
  this.Fy += settings.gravityStrength * -sin * (this.mass * that.mass) / radius;
};

GravityWell.prototype.update = function() {
  
  //Calculate x and y acceleration
	var ax = this.Fx / this.mass;
	var ay = this.Fy / this.mass;
	
	//Calculate x and y velocity
	this.xVel += ax * frameRate;
	this.yVel += ay * frameRate;
	
	//Calculate new x and y positions
	this.x += this.xVel * frameRate;
	this.y += this.yVel * frameRate;
  
  //Reset forces
  this.Fx = 0;
  this.Fy = 0;
  
  this.updateCount += 1;
};

// Draw the gravity well 
GravityWell.prototype.draw = function() {
	ctx.beginPath();
	ctx.fillStyle = this.color;
	ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
};

GravityWell.prototype.distance = function(that) {
  var xDist = this.x - that.x;
  var yDist = this.y - that.y;
  return Math.sqrt(xDist * xDist + yDist * yDist);
};

GravityWell.prototype.collidesWith = function(that) {
  if (this.distance(that) < this.radius + that.radius) return true;
  else return false;
};

GravityWell.prototype.drawHealth = function() {
  var offset = this.radius / 10;
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.fillStyle = 'black';
  ctx.fillRect(0 - offset, 0, this.health, 2);
  ctx.font = "bold 8px Arial";
  ctx.textBaseline= "top"; 
  ctx.fillText(this.health + " / 100", 0 - offset, 0);
  ctx.restore();
}
/*
 *End Gravity Well class
 */

/*
 *Cannon class
 */
function Cannon(width, height, index, angle) {
  this.x = bodies[index].x + bodies[index].radius * Math.sin(angle);
  this.y = bodies[index].y + bodies[index].radius * Math.cos(angle);
  this.width = width;
  this.height = height;
  this.index = index;
  this.angle = angle;
  this.isActive = true;
};

Cannon.prototype.update = function() {
  this.x = bodies[this.index].x + bodies[this.index].radius * Math.sin(this.angle);
  this.y = bodies[this.index].y + bodies[this.index].radius * Math.cos(this.angle);
};

Cannon.prototype.draw = function() {
  ctx.beginPath();
  ctx.fillStyle =  'black';
  ctx.save();
  ctx.translate(this.x, this.y); 
  ctx.rotate(-this.angle); 
  ctx.rect(0, 0, this.width, this.height);
  ctx.fill();
  ctx.restore();
  ctx.closePath();
};
/*
 *End Cannon class
 */

/*
 *Initialization setups
 */
function SolarSystem() {
  bodies[0] = new GravityWell({x: width / 2, y: height / 2, xVel: 0, yVel: 0, density: 10, radius: 20, color: 'red'});
  bodies[1] = new GravityWell({x: width / 2, y: height / 2 + 130, xVel: 130, yVel: 0, density: 5, radius: 5});
  bodies[2] = new GravityWell({x: width / 2, y: height / 2 + 140, xVel: 110, yVel: -5, density: 1, radius: 1});
  bodies[3] = new GravityWell({x: width / 2, y: height / 2 - 240, xVel: -130, yVel: 0, density: 3.5, radius: 3});
  bodies[4] = new GravityWell({x: width / 4, y: height / 2, xVel: 0, yVel: 130, density: 2, radius: 10});
  bodies[5] = new GravityWell({x: width / 4 - 20, y: height / 2, xVel: 0, yVel: 95, density: 1, radius: 1});
  bodies[6] = new GravityWell({x: width / 4 + 20, y: height / 2, xVel: -10, yVel: 95, density: 1, radius: 1});
}

function planetAndMoon() {
  bodies[bodies.length] = new GravityWell({x: mouse.x, y: mouse.y, density: 3, radius: 10});
  bodies[bodies.length] = new GravityWell({x: mouse.x - 15, y: mouse.y, yVel: 35, density: 1, radius: 1});
}

function sunAndPlanet() {
  bodies[bodies.length] = new GravityWell({x: mouse.x, y: mouse.y, density: 4, radius: 20, color: 'red'});
  bodies[bodies.length] = new GravityWell({x: mouse.x - 150, y: mouse.y, yVel: 100, density: 3, radius: 10});
  bodies[bodies.length] = new GravityWell({x: mouse.x - 165, y: mouse.y, yVel: 135, density: 1, radius: 1});
}
/*
 *End initialization setups
 */

/*
 *Basic methods
 */

function updateEntities() {
    calcBodyForces();
    calcProjectileForces();
    updateBodies();  
    updateProjectiles();
    updateCannons();
    updateCollisions();
}

function updateCollisions() {
  for (i = 0; i < projectiles.length; i++) {
    for (j = 0; j < bodies.length; j++) {
      if (j == blackHoleIndex) continue;
      if (projectiles[i].collidesWith(bodies[j])) {
        projectiles[i].isActive = false;
        bodies[j].health -= 10;
      }
    }
  }
};

function drawEntities() {
    ctx.save();
    updateView();
    updateScale();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.scale(scale, scale);
    drawBodies();
    drawCannons();
    drawProjectiles();
    //if (mouse.leftDown) drawTemp();
    //drawLines();
    ctx.restore();
};

function calcBodyForces() {
	for (i = 0; i < bodies.length; i++) {
		for (j = 0; j < bodies.length; j++) {
			if (i == j) continue;
			bodies[i].forceFrom(bodies[j]);
		}
	}
};

function calcProjectileForces() {
  for (i = 0; i < projectiles.length; i++) {
		for (j = 0; j < bodies.length; j++) {
			if (i == j) continue;
			projectiles[i].forceFrom(bodies[j]);
		}
	}
}

function updateBodies() {
  for (i = 0; i < bodies.length; i++) {
    if (bodies[i].health <= 0) {
      cannons.splice(i);
      blackHoleIndex -= 1;
      bodies[i].isActive = false;
    }
    if (bodies[i].isActive) bodies[i].update();
    else bodies.splice(i,1);
  }
};

function updateBlackHole() {
  bodies[blackHoleIndex].x = mouse.x;
  bodies[blackHoleIndex].y = mouse.y;
};

function updateProjectiles() {
  for (i = 0; i < projectiles.length; i++) {
    //if (projectiles[i].updateCount > projectileSettings.lifeLength) projectiles[i].isActive = false;
    if (projectiles[i].isActive) projectiles[i].update();
    else projectiles.splice(i, 1);
  }
};

function updateCannons() {
  for (i = 0; i < cannons.length; i++) {
    for (j = 0; j < cannons[i].length; j++) {
      if (cannons[i][j].isActive) cannons[i][j].update();
      else cannons.splice(i, 1);
    }
  }
};

function drawBodies() {
  for (i = 0; i < bodies.length; i++) {
    bodies[i].draw();
    if (i == blackHoleIndex) continue;
    //bodies[i].drawHealth();
  }
};

function drawCannons() {
  for (i = 0; i < cannons.length; i++) {
    for (j = 0; j < cannons[i].length; j++) {
      cannons[i][j].draw();
    }
  }
};

function drawProjectiles() {
  for (i = 0; i < projectiles.length; i++) {
    projectiles[i].draw();
  }
};

function removeEntities(index) {
  cannons.splice(index);
  bodies.splice(index, 1);
}

function drawLines() {
  for (i = 0; i < bodies.length; i++) {
    for (j = 0; j < bodies.length; j++) {
        var x1 = bodies[i].x, x2 = bodies[j].x;
        var y1 = bodies[i].y, y2 = bodies[j].y;
        var xDist = x1 - x2;
        var yDist = y1 - y2;
        radius = Math.sqrt(xDist * xDist + yDist * yDist);
        if (radius < 200) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
      }
    }
  }
}

function createSatellites() {
  bodies[bodies.length] = new GravityWell({x: mouse.x, y: mouse.y, density: 0.5, radius: settings.satelliteSize});
}

function printText() {
  ctx.fillStyle = "black";
  ctx.font = "bold 16px Arial";
  ctx.textBaseline= "top"; 
  ctx.fillText(projectiles[0].updateCount, 0, 0);
}

function _2DArray(rows) {
  var arr = [];

  for (var i = 0; i < rows; i++) {
     arr[i] = [];
  }

  return arr;
}

/*
 * End basic methods
 */

/*
 * Scale and pan handlers (no pun intended)
 */
function updateScale() { 
var amount = 5;
    if (scale > settings.minScale && scale < settings.maxScale) {
      if (keys.pageDown) {
        scale -= settings.zoomSpeed * scale;
        for (i = 0; i < bodies.length; i++) {
          bodies[i].x += amount / scale;
          bodies[i].y += amount / scale;
        }
        for (i = 0; i < cannons.length; i++) {
          for (j = 0; j < cannons[i].length; j++) {
            cannons[i][j].x += amount / scale;
            cannons[i][j].y += amount / scale;
          }
        }
         for (i = 0; i < projectiles.length; i++) {
          projectiles[i].x += amount / scale; 
          projectiles[i].y += amount / scale;
        }
      }
      if (keys.pageUp) {
        scale += settings.zoomSpeed * scale;
         for (i = 0; i < bodies.length; i++) {
          bodies[i].x -= amount / scale; 
          bodies[i].y -= amount / scale;
        }
         for (i = 0; i < cannons.length; i++) {
          for (j = 0; j < cannons[i].length; j++) {
            cannons[i][j].x -= amount / scale;
            cannons[i][j].y -= amount / scale;
          }
        }
        for (i = 0; i < projectiles.length; i++) {
          projectiles[i].x -= amount / scale; 
          projectiles[i].y -= amount / scale;
        }
      }
    }
  else if (scale <= settings.minScale) {
    scale = settings.minScale;
    if (keys.pageUp) scale += settings.zoomSpeed * scale;
}
      else if (scale >= settings.maxScale) {
    scale = settings.maxScale;
        if (keys.pageDown) scale -= settings.zoomSpeed / scale;
}
    
   };

function updateView () {
    for (i = 0; i < bodies.length; i++) {
        if (keys.leftDown) bodies[i].x += settings.panSpeed / scale;
        if (keys.rightDown) bodies[i].x -= settings.panSpeed / scale;
        if (keys.downDown) bodies[i].y -= settings.panSpeed / scale;
        if (keys.upDown) bodies[i].y += settings.panSpeed / scale;
    }
  
    for (i = 0; i < cannons.length; i++) {
      for (j = 0; j < cannons[i].length; j++) {
        if (keys.leftDown) cannons[i][j].x += settings.panSpeed / scale;
        if (keys.rightDown) cannons[i][j].x -= settings.panSpeed / scale;
        if (keys.downDown) cannons[i][j].y -= settings.panSpeed / scale;
        if (keys.upDown) cannons[i][j].y += settings.panSpeed / scale;
      }
   }
  
  for (i = 0; i < projectiles.length; i++) {
      if (keys.leftDown) projectiles[i].x += settings.panSpeed / scale;
      if (keys.rightDown) projectiles[i].x -= settings.panSpeed / scale;
      if (keys.downDown) projectiles[i].y -= settings.panSpeed / scale;
      if (keys.upDown) projectiles[i].y += settings.panSpeed / scale;
   }
};
/*
 * End scale and pan handlers
 */ 

/*
 * Main loop
 */
var loop = function () {
  
    //if (mouse.rightDown) createSatellites();
  
    //Update 
    //if (bodies.length > settings.maxBodies) bodies.splice(0,bodies.length - settings.maxBodies);
    if (mouse.leftDown || mouse.rightDown) updateBlackHole();
    
    updateEntities();
  
    drawEntities();
  
    //printText();

};

/*
 * End main loop
 */

// Initialize everytrhgin
function init() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
  
    //Event listeners
    document.addEventListener("keydown", keyDown, false);
    document.addEventListener("keyup", keyUp, false);
    canvas.onmousemove = getMousePosition;
    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    canvas.oncontextmenu = function () {
        return false;
    }; 
    
    window.onresize = function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = canvas.width;
      height = canvas.height;
    }
    
    function animloop(){
      requestAnimFrame(animloop);
      loop();
    };
  
    ctx.webkitImageSmoothingEnabled = true;
  
    animloop();
}

window.onload = function() {
	init();
};
/*
 * End setup
 */

//Create a GUI with the ability to edit some variables in real time (Source: http://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.5/dat.gui.min.js)
/*var gui = new dat.GUI();
gui.add(settings, 'panSpeed', 15, 100);
gui.add(settings, 'zoomSpeed', 0.01, 0.05);
gui.add(settings, 'minScale', 0.01, 1);
gui.add(settings, 'maxScale', 3, 10);
gui.add(settings, 'maxBodies', 100, 500);
gui.add(settings, 'satelliteSize', 1, 50);
gui.add(settings, 'gravityStrength', 1, 50);*/