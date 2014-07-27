var GravitySim = (function(window, undefined) {
	
	/**************************************\
	| Class Variables                      |
	\**************************************/

	var frameRate;          // rendering frame rate
	var frameLength;        // length of a frame based on the frame rate
	var scale;              // current scale of the canvas
	var suns;               // array of all suns in the scene	
	var satellites;         // array of all satellites in the scene
	var canvas;             // the canvas to render to
	var cw, ch;             // canvas width and height
	var ctx;                // the canvas rendering context
	var gui;                // google gui
	var settings;           // settings for this sim
	var scale;              // current scale of the scene
	var creatingSun;        // are we currently creating a sun?
	var newSunPos;          // position of the new sun we are creating
	
	/**************************************\
	| Game Logic                           |
	\**************************************/

	/* 
	 * Initialize everything and start the game loop
	 * @param {float} _frameRate Framerate to run the sim at
	 * @param {Canvas} _canvas Canvas to render to
	 */
	function init(_frameRate, _canvas)
	{
		frameRate = _frameRate;
		frameLength = frameRate * 1000;
		
		scale = 1;
		suns = [];
		satellites = [];
		canvas = _canvas;
		
		initCanvasCtx();
		initEventListeners();
		initSettings();
		initGUI();

		initSuns(25);
		initSatellites(150);

		loop();
	}
	
	/*
	 * Initialize the canvas context and all related variables
	 */
	function initCanvasCtx()
	{
		ctx = canvas.getContext("2d");
		ctx.webkitImageSmoothingEnabled = true;
		
		cw = canvas.width;
		ch = canvas.height;
	}
	
	/*
	 * Initialize all event listeners
	 */
	function initEventListeners()
	{
		// key and mouse event handlers initialization
		KeyMouseEventHandlers.init(canvas);

		// disable the context menu
		canvas.oncontextmenu = function () {
			return false;
		}; 
		
		// window event listeners
		window.onresize = function() {
			cw = canvas.width = window.innerWidth;
			ch = canvas.height = window.innerHeight;
		};
	}
	
	/*
	 * Initialize settings for this sim
	 */
	function initSettings()
	{
		settings = {
			zoomSpeed: 0.015,       // how fast the camera zooms in and out
			panSpeed: 50,           // how fast the camera pans
			minScale: 0.1,          // minimum zoom of the camera
			maxScale: 3,            // maximum zoom of the camera
			gravityStrength: 0.01,  // strength of gravity
		};
	}
	
	/*
	 * Initialize the google GUI
	 */
	function initGUI()
	{
		gui = new dat.GUI();
		
		// add variables we want visible on the GUI
		gui.add(settings, 'zoomSpeed', 0.01, 0.05);
		gui.add(settings, 'panSpeed', 15, 100);
		gui.add(settings, 'minScale', 0.01, 1);
		gui.add(settings, 'maxScale', 3, 10);
		gui.add(settings, 'gravityStrength', 0, 0.1);
	}

	/*
	 * Initialize all suns in the scene
	 * @param {int} num Number to initialize
	 */
	function initSuns(num)
	{
		for (var i = 0; i < num; i++) {
			
			var newSun = new GravityWell({
				position: {
					x: (Math.random() * cw) - (cw / 2),
					y: (Math.random() * ch) - (ch / 2)
				},
				density: 1,
				radius: Math.random() * 50,
				fillStyle: 'red',
				useGradient: true
			});

			suns.push(newSun);
		}
	}

	/*
	 * Initialize all satellites in the scene
	 * @param {int} num Number to initialize
	 */
	function initSatellites(num)
	{
		for (var i = 0; i < num; i++) {
			
			var newSat = new GravityWell({
				position: {
					x: (Math.random() * cw) - (cw / 2),
					y: (Math.random() * ch) - (ch / 2)
				},
				density: 1,
				radius: Math.random() * 2.5,
				fillStyle: 'black'
			});

			satellites.push(newSat);
		}
	}
	
	/*
	 * The main game loop
	 */
	function loop()
	{
		updateScene();
		renderScene();
		setTimeout(loop, frameLength);
	}
	
	/*
	 * Update all scene elements
	 */
	function updateScene()
	{
		updateWells();
		createNewSuns();
		createNewSatellites();
		panScene();
		scaleScene();
	}
	
	/*
	 * Update all gravity wells in the scene
	 */
	function updateWells()
	{
		// determine force to add for each well
		for (var i = 0; i < suns.length; i++) {
			for (var j = 0; j < satellites.length; j++) {
				suns[i].addForceFrom(satellites[j]);
			}
		}

		for (var i = 0; i < satellites.length; i++) {
			for (var j = 0; j < suns.length; j++) {
				satellites[i].addForceFrom(suns[j]);
			}
		}

		// update position of each gravity well based on determined force
		for (var i = 0; i < suns.length; i++) {
			suns[i].updatePosition();
		}

		for (var i = 0; i < satellites.length; i++) {
			satellites[i].updatePosition();
		}
	}

	/*
	 * Create new suns upon user input
	 */
	function createNewSuns()
	{
		var eh = "KeyMouseEventHandlers"; // eval(eh).getMousePosition() === KeyMouseEventHandlers.getMousePosition()
		var mousepos = eval(eh).getMousePosition();

		// get and react to user input
		if (eval(eh).mouseButtonDown(eval(eh).mouseCode.left)) {
			if (!creatingSun) {
				creatingSun = true;
				newSunPos = eval(eh).getMousePosition();
			}
		}
		else
			if (creatingSun) {
				creatingSun = false;
				var newRadius = Math.sqrt(((newSunPos.x - mousepos.x) * (newSunPos.x - mousepos.x)) + ((newSunPos.y - mousepos.y) * (newSunPos.y - mousepos.y)));
				suns.push(new GravityWell({
					position: {
						x: (newSunPos.x - (cw / 2)) / scale,
						y: (newSunPos.y - (ch / 2)) / scale
					},
					density: 1,
					radius: newRadius,
					fillStyle: 'red',
					useGradient: true
				}));
			}

		// render the sun
		if (creatingSun) {
			ctx.beginPath();
			var currRadius = Math.sqrt(((newSunPos.x - mousepos.x) * (newSunPos.x - mousepos.x)) + ((newSunPos.y - mousepos.y) * (newSunPos.y - mousepos.y)));
			ctx.arc(newSunPos.x, newSunPos.y, currRadius, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	/*
	 * Create new satellites upon user input
	 */
	function createNewSatellites()
	{
		var eh = "KeyMouseEventHandlers"; // eval(eh).getMousePosition() = KeyMouseEventHandlers.getMousePosition()
		var mousepos = eval(eh).getMousePosition();
		if (eval(eh).mouseButtonDown(eval(eh).mouseCode.right))
			satellites.push(new GravityWell({
				position: {
					x: mousepos.x - (cw / 2),
					y: mousepos.y - (ch / 2)
				},
				density: 1,
				radius: 2,
				fillStyle: 'black'
			}));
	}
	
	/*
	 * Pan the scene upon user input
	 */
	function panScene()
	{
		var hdir,	// horizontal direction
			vdir;	// vertical direction
		
		var eh = "KeyMouseEventHandlers";		// eval(eh).isKeyDown() === KeyMouseEventHandlers.isKeyDown()
		
		// determine if we should pan the scene and in what direction
		if (eval(eh).keyDown(eval(eh).keyCode.left)) 
			hdir = 1;
		else if (eval(eh).keyDown(eval(eh).keyCode.right))
			hdir = -1;
		else if (eval(eh).keyDown(eval(eh).keyCode.up))
			vdir = 1;
		else if (eval(eh).keyDown(eval(eh).keyCode.down))
			vdir = -1;
			
		// update horizontal position of each well if necessary
		if (hdir) {
			suns.forEach(function(sun) {
				sun.position.x += hdir * settings.panSpeed;
			});
			
			satellites.forEach(function(satellite) {
				satellite.position.x += hdir * settings.panSpeed;
			});
		}
		
		// update vertical position of each well if necessary
		if (vdir) {
			suns.forEach(function(sun) {
				sun.position.y += vdir * settings.panSpeed;
			});
			
			satellites.forEach(function(satellite) {
				satellite.position.y += vdir * settings.panSpeed;
			});
		}
	}
	
	/*
	 * Scale the scene  upon user input
	 */
	function scaleScene()
	{
		var eh = "KeyMouseEventHandlers";		// eval(eh).isKeyDown() === KeyMouseEventHandlers.isKeyDown()
		
		if (eval(eh).keyDown(eval(eh).keyCode.pageUp))
			if (scale < settings.maxScale)
				scale += settings.zoomSpeed * scale;
			else 
				scale = settings.maxScale;
		else if (eval(eh).keyDown(eval(eh).keyCode.pageDown))
			if (scale > settings.minScale)
				scale -= settings.zoomSpeed * scale;
			else 
				scale = settings.minScale;
	}
	
	/*
	 * Render all scene elements
	 */
	function renderScene()
	{
		ctx.save();
		ctx.translate(cw / 2, ch / 2);
		ctx.scale(scale, scale);
		ctx.fillStyle = 'rgba(255,255,255,.5)'; 
		ctx.fillRect((-cw / 2) / scale, (-ch / 2) / scale, cw / scale, ch / scale);
		
		suns.forEach(function(sun) {
			sun.render(ctx);
		});

		satellites.forEach(function(satellite) {
			satellite.render(ctx);
		});
		
		ctx.restore();
	}

	/**************************************\
	| Getters                              |
	\**************************************/

	function getScale()
	{
		return scale;
	}
	
	function getFrameRate()
	{	
		return frameRate;
	}

	function getGravityStrength()
	{
		return settings.gravityStrength;
	}
	
	/**************************************/

	// Module elements we want visible publicly
	return {
		init : init,
		getScale : getScale,
		getGravityStrength : getGravityStrength,
		getFrameRate : getFrameRate
	};
})(window);

/*
 * Provides an easy interface for canvas event handling
 */
var KeyMouseEventHandlers = (function(window, undefined) {

	var canvas;

	/*
	 * Initializes the event handlers
	 * @param {Canvas} canvas Canvas to attach the event handlers to
	 */
	function init(_canvas)
	{
		canvas = _canvas;

		// key event listeners
		window.onkeydown = onKeyDown;
		window.onkeyup   = onKeyUp;
		
		// mouse event listeners
		canvas.onmousemove = setMousePosition;
		canvas.onmousedown = mouseDown;
		canvas.onmouseup   = mouseUp;
	}

	/**************************************\
	| Mouse event handlers                 |
	\**************************************/

	// mouse object
	var mouse = {
		x: 0,
		y: 0
	};

	// mouse code mapping
	var mouseCode = {
		left: 1,
		middle: 2,
		right: 3
	};

	/*
	 * Set the mouse's screen position
	 */
	function setMousePosition(e) 
	{
		var scale = GravitySim.getScale();
		mouse.x = (e.pageX - canvas.offsetLeft);
		mouse.y = (e.pageY - canvas.offsetTop);
	}
	
	/*
	 * Get the mouse's screen position
	 * @return {pair} Mouse screen position
	 */
	function getMousePosition()
	{
		return {
			x: mouse.x, 
			y: mouse.y
		};
	}
	
	/*
	 * Is the parameter mouse button down?
	 * @param {mouseCode} mousecode Mousecode to check
	 */
	function mouseButtonDown(mousecode)
	{
		mousecode = "_" + mousecode;
		if (mouse.hasOwnProperty(mousecode))
			return mouse[mousecode];
		else
			return false;
	}

	/*
	 * Mouse down event handler
	 */
	function mouseDown(e) 
	{
		var mousecode = "_" + e.which;
		mouse[mousecode] = true;
	}

	/*
	 * Mouse up event handler
	 */
	function mouseUp(e) 
	{
		var mousecode = "_" + e.which;
		mouse[mousecode] = false;
	}

	/**************************************\
	| Key event handlers                   |
	\**************************************/
	
	// keys object
	var keys = {
	};
	
	// key code mapping
	var keyCode = {
		up: 38,
		down: 40,
		left: 37,
		right: 39, 
		pageUp: 33,
		pageDown: 34,
		enter: 13
	};
	
	/*
	 * Is the parameter key down?
	 * @param {keyCode / int} keycode Key to check
	 */
	function keyDown(keycode)
	{
		keycode = "_" + keycode;
		if (keys.hasOwnProperty(keycode))
			return keys[keycode];
		else
			return false;
	}

	/*
	 * Key down event handler
	 */
	function onKeyDown (e) 
	{
		var keycode = "_" + e.which;
		keys[keycode] = true;
	}

	/*
	 * Key up event handler
	 */
	function onKeyUp (e) 
	{
		var keycode = "_" + e.which;
		keys[keycode] = false;
	}

	// variables we want to be publicly visible
	return {
		init              : init,
		getMousePosition  : getMousePosition,
		mouseButtonDown   : mouseButtonDown,
		mouseCode 		  : mouseCode,
		keyCode           : keyCode,
		keyDown           : keyDown
	};
})(window);

/*
 * Class representing a gravity well
 */
function GravityWell(args) {
	
	this.position    = args.position || {x: 0, y: 0};   // position of the well on the canvas
	this.force       = {x: 0, y: 0};                    // used for physics calculations
	this.velocity    = args.velocity || {x: 0, y: 0};   // velocity of the well
	this.density     = args.density  || 1;              // density of the well
	this.radius      = args.radius   || 5;              // radius of the well
	this.mass        = (4 / 3) * Math.PI * this.radius * this.radius * this.radius * this.density; // mass of the well
	this.fillStyle   = args.fillStyle   || 'black';     // color to use when rendering this well
	this.useGradient = args.useGradient || false;       // whether or not to use a gradient when rendering this well
}

GravityWell.prototype = {

	/*
	 * Determine the amount of force another gravity well is exerting on this one
	 * @param {GravityWell} other The other gravity well
	 */
	addForceFrom: function(other) {

		// distance from other gravity well
		var xDist  = this.position.x - other.position.x,
		    yDist  = this.position.y - other.position.y;
		var dist = this.distance(other);

		// angles
		var cos = xDist / dist;
		var sin = yDist / dist;

		var G = GravitySim.getGravityStrength();

		// add force based on modified version of universal gravitation
		this.force.x += G * -cos * (this.mass * other.mass) / (dist);
		this.force.y += G * -sin * (this.mass * other.mass) / (dist);
	},

	/*
	 * Update the position of this well based on its current velocity and the 
	 * force it is experiencing
	 */
	updatePosition: function() {

		// calculate x and y acceleration
		var ax = this.force.x / this.mass,
		    ay = this.force.y / this.mass;
		
		// calculate x and y velocity
		var frameRate = GravitySim.getFrameRate();
		this.velocity.x += ax * frameRate;
		this.velocity.y += ay * frameRate;
		
		// calculate new x and y positions
		this.position.x += this.velocity.x * frameRate;
		this.position.y += this.velocity.y * frameRate;
	  
		// reset forces
		this.force.x = 0;
		this.force.y = 0;
	},

	/*
	 * Draw the gravity well
	 * @param {CanvasRenderingContext2D} ctx The context to draw to
	 */
	render: function(ctx) {

		var fillStyle = this.fillStyle;
		
		if (this.useGradient) {
			
			// create a gradient for rendering
			fillStyle = ctx.createRadialGradient(this.position.x, this.position.y, 0, 
															 this.position.x, this.position.y, this.radius);
			fillStyle.addColorStop(0, this.fillStyle);
			fillStyle.addColorStop(1, "white");
		}
		
		// render the well
		ctx.beginPath();
		ctx.fillStyle = fillStyle;
		ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	},

	/*
	 * Retrieve the distance in pixels from another gravity well
	 * @param {GravityWell} other The gravity well to get the distance from
	 */
	 distance: function(other) {
		
		var xDist = this.position.x - other.position.x;
		var yDist = this.position.y - other.position.y;
		
		return Math.sqrt(xDist * xDist + yDist * yDist);
	 },
};

window.onload = function() {
	
	var canvas = document.createElement("canvas");
	var center = document.createElement("center");

	canvas.width = 1500;
	canvas.height = 750;

	document.body.appendChild(center);
	center.appendChild(canvas);

	GravitySim.init(1 / 60, canvas);
}