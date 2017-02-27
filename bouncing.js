/**
 * bouncing.js
 * Julianne Johnson
 * 
 *  Code to manage and run the Bouncing Balls game
 */

	// Default settings for the game
	var numPlayers=3;			// default number of players
	var gameTime = 15000;		// default game time: 15s
	
	// retrieve the canvas element	
	var canvas = document.getElementById('myCanvas');
	var canvasContainer = document.getElementById('canvasContainer');
	
	// add click event listener to the canvas element	
    canvas.addEventListener('click', on_canvas_click, false);	
	
	// create an empty object literal for storing the canvas state ( balls, and targets) 	
	var canvasState = {};
	
	// fields for targets on the top edge, bottom edge, right edge, and left edge, respectively
	canvasState.t_horz_targets=[];
	canvasState.b_horz_targets=[];
	canvasState.r_vert_targets=[];
	canvasState.l_vert_targets=[];
	
	// fields specifying the dimensions of the horizontal and vertical targets
	canvasState.horz_target_width = 30;
	canvasState.horz_target_height = parseInt(canvas.style.borderWidth)+5; 
	
	canvasState.vert_target_width = parseInt(canvas.style.borderWidth)+5; 
	canvasState.vert_target_height = 40;
	
	//  field for storing the ball objects contained in the canvas
	canvasState.balls=[];
	
	canvasState.borderWidth = parseInt(canvas.style.borderWidth);
	
	// Players
	function Player(id) {
		this.id = id;
		this.playerNum = id+1;
		this.ballCount = 0;
		this.points = 0;
		this.countDiv = document.getElementById("player"+(this.playerNum)+"Count");
		this.scoreDiv = document.getElementById("player"+(this.playerNum)+"Score");
		this.score = 0.0;
	
		this.showBallCount = function () {
			this.countDiv.innerHTML = "Player "+(this.playerNum)+" Ball Count:<br>"+this.ballCount;
		}

		this.showScore = function () {
			this.scoreDiv.innerHTML = "Player "+(this.playerNum)+" Score:<br>"+(this.score).toFixed(2);
		}
		
		// Add points to the total, and update the score. To subtract points, use a value less than 0
		this.updatePoints = function (n) {
			this.points += n;
			if (this.ballCount > 0) {
				this.score = this.points / this.ballCount;
			}
			this.showScore();
		}
		
		// Clear the displays for this player
		this.clearBoxes = function() {
			this.countDiv.innerHTML = "";
			this.scoreDiv.innerHTML = "";
		}

		// Erase the player from existence...
		this.erase = function() {
			var i=0;
			while (i < canvasState.balls.length) {
				if (canvasState.balls[i].playerId == this.id) {
					canvasState.balls.splice(i,1);
				} else {
					i++;
				}
			}
			this.clearBoxes();
		}
	}

	// Base class for target objects
	function Target(id, topLeftX, topLeftY, width, height){
		this.id = id;
		this.x = topLeftX;              // x coordinate of top left  
		this.y = topLeftY;              // y coordinate of top left
		this.width = width;         // width of the target
		this.height = height;        // height of the target
		this.labelWidth = 30;
		this.labelHeight = 40;
		this.labelGap = 10;
		this.labelDiv = null;
		this.labelColor = '#000000';
		this.labelFlashColor = '#FFFFFF';
		this.points = 0;

		this.newLabel = function (top,left) {
            var node = document.createElement("DIV");
            node.setAttribute("class","targetValue");
            node.style.top=parseInt(top)+"px";
            node.style.left=parseInt(left)+"px";
            node.style.backgroundColor = this.labelColor;
            this.labelDiv = node;
		}
		
		this.showLabel = function () {
            this.showPoints();
            canvasContainer.appendChild(this.labelDiv);
		}
		
		this.showPoints = function () {
			this.labelDiv.innerHTML=parseInt(this.points);
		}
		
		// Adjust the target's points by n, which can be negative or positive
		this.updatePoints = function (n) {
			this.points = Math.max(this.points+n,0);			
			this.showPoints();
		}
		
		this.flashLabel = function () {
			this.labelDiv.style.backgroundColor=this.labelFlashColor;
			this.flashTimer = setInterval(this.resetLabelColor,200,this);
		}

		this.resetLabelColor = function (self) {
			self.labelDiv.style.backgroundColor=self.labelColor;
			clearInterval(self.flashTimer);
		}
	
		// Check if another target overlaps with this one
		// Reference: http://www.geeksforgeeks.org/find-two-rectangles-overlap/
		this.isOverlapped = function (t) {
			// Is one target to the left of the other?
			if (this.x > (t.x+t.width)) { return false; }
			if (t.x > (this.x+this.width)) { return false; }

			// Is one target completely above the other?
			if (this.y > (t.y+t.height)) { return false; }
			if (t.y > (this.y+this.height)) { return false; }
			
			// Otherwise, there is overlap
			return true;
		}
	}

	// Create flavors of Target: Right, Left, Top, Bottom
	// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype
	// as a method of base class and sub class inheritance
	function VerticalTarget(id, topLeftX, topLeftY, width, height) {
		Target.apply(this,arguments);
		this.points = Math.floor(Math.random() * 101) + 100;
		this.labelTop = topLeftY + parseInt(canvas.style.borderWidth);
		this.labelFlashColor = 'orange';
	}
	VerticalTarget.prototype = Object.create(Target.prototype);				
	VerticalTarget.prototype.constructor = VerticalTarget;						
	
	function HorizontalTarget(id, topLeftX, topLeftY, width, height) {
		Target.apply(this,arguments);
		this.points = Math.floor(Math.random() * 51) + 50;
		this.labelLeft = topLeftX;
		this.labelFlashColor = 'yellow';
	}
	HorizontalTarget.prototype = Object.create(Target.prototype);
	HorizontalTarget.prototype.constructor = HorizontalTarget;

	function TopTarget(id, topLeftX, topLeftY, width, height) {
		HorizontalTarget.apply(this,arguments);
		this.labelTop = 0 - topLeftY - this.labelGap - this.labelHeight - canvasState.borderWidth;		// Top labels are above the canvas, with a gap
		this.labelColor = "red";
		this.newLabel(this.labelTop,this.labelLeft);
	}
	TopTarget.prototype = Object.create(HorizontalTarget.prototype);				
	TopTarget.prototype.constructor = TopTarget;						

	function BottomTarget(id, topLeftX, topLeftY, width, height) {
		HorizontalTarget.apply(this,arguments);
		this.labelTop = topLeftY + canvasState.horz_target_height + this.labelGap + (canvasState.borderWidth*2); // Bottom labels are below the canvas
		this.labelColor = "green";
		this.newLabel(this.labelTop,this.labelLeft);
	}
	BottomTarget.prototype = Object.create(HorizontalTarget.prototype);				
	BottomTarget.prototype.constructor = BottomTarget;						
	
	function RightTarget(id, topLeftX, topLeftY, width, height)  {
		VerticalTarget.apply(this,arguments);
		this.labelLeft = topLeftX + canvasState.vert_target_width + this.labelGap + (canvasState.borderWidth*2);  // Right labels are to the right of the canvas
		this.labelColor = "teal";
		this.newLabel(this.labelTop,this.labelLeft);
	}	
	RightTarget.prototype = Object.create(VerticalTarget.prototype);
	RightTarget.prototype.constructor = RightTarget;

	function LeftTarget(id, topLeftX, topLeftY, width, height) {
		VerticalTarget.apply(this,arguments);
		this.labelLeft = 0 - topLeftX - this.labelGap - this.labelWidth - canvasState.borderWidth;		// Left lables are to the left of the canvas
		this.labelColor = "blue";
		this.newLabel(this.labelTop,this.labelLeft);
	}
	LeftTarget.prototype = Object.create(VerticalTarget.prototype);
	LeftTarget.prototype.constructor = LeftTarget;

	function Ball(id, centerX, centerY, radius, velocityX, velocityY, playerId){
		this.id = id;			// id of the ball
		this.x = centerX;		// x coordinate of the center
		this.y = centerY;		// y coordinate of the center 
		this.r = radius;		// radius of the ball 
		this.vx = velocityX;	// x component of the velocity of the ball
		this.vy = velocityY;	// y component of the velocity of the ball  
		this.hasCollided = false;          // a boolean to keep track of whether this ball has collided with other balls
		this.collidedBalls = [];		   // an array to keep track of the balls whith which this ball has collided	
        this.fillStyle = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);                            // random color   
		this.playerId = playerId; // current owner of the ball
		this.points = Math.floor(Math.random() * 11);
	
		this.updatePoints = function (n) {
			this.points += n;
		}
	}	
		
	Ball.prototype.move = function(){
		
		// award points
		function processCollision(b,t) {
			var p = players[b.playerId];
			t.flashLabel();
			p.updatePoints(b.points * t.points);			// give player points
			t.updatePoints(Math.round(b.points/2,0)*-1);	// reduce target points
			b.updatePoints(Math.round(b.points * 1.1));		// increase ball points
		}
		
		// function for testing collision with a left edge target
		function testLVertTargetCollisions(ball){
			
			var y = ball.y;
			for (var i=0; i< canvasState.l_vert_targets.length; i++){       // test for each of the targets
				var vtarget = canvasState.l_vert_targets[i];                // retrieve the target from the array
				if ( y>vtarget.y && y<(vtarget.y+vtarget.height) ){         // check if the vertical position of the ball is within the vertical boundary of the target
					processCollision(ball,vtarget);
					//alert('hit vert target')
					//alert(y+" "+vtarget.y+" "+vtarget.height)
				} 
				
			}				
		}
		
		// function for testing collision with a right edge target
		function testRVertTargetCollisions(ball){
		
			var y = ball.y;
			
			for (var i=0; i< canvasState.r_vert_targets.length; i++){
				var vtarget = canvasState.r_vert_targets[i];
				if ( y>vtarget.y && y<(vtarget.y+vtarget.height) ){
					processCollision(ball,vtarget);
					//alert('hit vert target')
					//alert(y+" "+vtarget.y+" "+vtarget.height)
					
				} 
				
			}
		
		}
		
		// function for testing collision with a top edge target				
		function testTHorzTargetCollisions(ball){
		
			var x = ball.x;
			
			for (var i=0; i< canvasState.t_horz_targets.length; i++){
				var htarget = canvasState.t_horz_targets[i];
				if ( x>htarget.x && x<(htarget.x+htarget.width) ){
					processCollision(ball,htarget);
					//alert('hit horz target')
					//alert(x+" "+htarget.x+" "+htarget.width)
					
				} 
				
			}				
		
		}
		
		// function for testing collision with a bottom edge target				
		function testBHorzTargetCollisions(ball){
		
			var x = ball.x;
			
			for (var i=0; i< canvasState.b_horz_targets.length; i++){
				var htarget = canvasState.b_horz_targets[i];
				if ( x>htarget.x && x<(htarget.x+htarget.width) ){
					processCollision(ball,htarget);
					//alert('hit horz target')
					//alert(x+" "+htarget.x+" "+htarget.width)
					
				} 
				
			}				
		
		}
				
		if(this.x+this.r>=canvas.width){        // if the ball hits the right edge
			this.x = canvas.width-this.r; 		// reset the ball position at touching the right edge					
			this.vx*=-1;   						// reverse the velocity					
			testRVertTargetCollisions(this);  // test for collision with any right edge target					
		}else if(this.x-this.r<=0){   // if the ball hits the left edge				
			this.x=this.r;            // reset the ball position at touching the left edge
			this.vx*=-1;              // reverse the velocity
			testLVertTargetCollisions(this);	// test for collision with any left edge target						
		}
			
		if(this.y+this.r>=canvas.height){    // if the ball hits the bottom edge ...
			this.y = canvas.height-this.r;   // ...
			this.vy*=-1;                     // ... 
			testBHorzTargetCollisions(this);     // ...
		}else if(this.y-this.r<=0){      // if the ball hits the top edge
			this.y=this.r;               // ... 
			this.vy*=-1;                 // ...
			testTHorzTargetCollisions(this); // ...
		}
		
		// update the position of the ball
		this.x+=this.vx;
		this.y+=this.vy;
	};	

	// random color : '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
	
	// utility function for computing the distance between two points (x1,y1) and (x2,y2)
	function dist(x1,y1,x2,y2){
		return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));	
	}
	
	function isTargetOverlapped(t,targets) {
		for (var i=0; i<targets.length; i++) {
			if (t.isOverlapped(targets[i])) {
				return true;
			}
		}
		return false;
	}
	
	// canvas on click event listener
	function on_canvas_click(ev){
			
		// subtract the left (top) offset and canvas border width from x(y) coordinate of the event to make the coordinates relative to the top-left corner of the canvas
		var x = ev.clientX - canvas.parentElement.offsetLeft - parseInt(canvas.style.borderWidth);
		var y = ev.clientY - canvas.parentElement.offsetTop - parseInt(canvas.style.borderWidth);
		
		if( x>canvas.width ){
			// if the click event was on the right edge border of the canvas, add a right vertical target
			var t = new RightTarget(   canvasState.r_vert_targets.length,                  // id
					   canvas.width-canvasState.vert_target_width,    // x coordinate of the top left corner of this target
					   y-canvasState.vert_target_height/2,				   // y coordinate of the top left corner of this target
					   canvasState.vert_target_width,                      // width of this target
					   canvasState.vert_target_height);                     // height of this target
			if (!isTargetOverlapped(t,canvasState.r_vert_targets)) {
				canvasState.r_vert_targets.push(t);
				t.showLabel();
			}
		}else if(x<0 ){   
		
			// if the click event was on the left edge border of the canvas, add a left vertical target
			var t = new LeftTarget(   canvasState.l_vert_targets.length,                  // id
					   0,												  // x coordinate of the top left corner of this target	
                       y-canvasState.vert_target_height/2,                // y coordinate of the top left corner of this target
					   canvasState.vert_target_width,                     // width of this target
					   canvasState.vert_target_height                     // height of this target
						);
			if (!isTargetOverlapped(t,canvasState.l_vert_targets)) {
				canvasState.l_vert_targets.push(t);
				t.showLabel();
			}
		}else if (y>canvas.height ){
			
			// if the click event was on the bottom edge border of the canvas, add a bottom horz target
			var t = new BottomTarget(   canvasState.b_horz_targets.length,                  
					   x-canvasState.horz_target_width/2,
					   canvas.height-canvasState.horz_target_height,
					   canvasState.horz_target_width,
					   canvasState.horz_target_height                     // height of this target
						);
			if (!isTargetOverlapped(t,canvasState.b_horz_targets)) {
				canvasState.b_horz_targets.push(t);
				t.showLabel();
			}
		}else if(y<0){
			// if the click event was on the top edge border of the canvas, add a top horz target
			var t = new TopTarget(   canvasState.t_horz_targets.length,                  
					   x-canvasState.horz_target_width/2,
					   0,
					   canvasState.horz_target_width,
					   canvasState.horz_target_height                     // height of this target
						);
			if (!isTargetOverlapped(t,canvasState.t_horz_targets)) {
				canvasState.t_horz_targets.push(t);	
				t.showLabel();
			}
		}else{
			// if the click was within the canvas, add a ball
			var playerId = canvasState.balls.length % numPlayers;
			canvasState.balls.push( new Ball(canvasState.balls.length,x,y,15, Math.floor(Math.random()*-6)+3, Math.floor(Math.random()*-8)+4, playerId ));
			players[playerId].ballCount++;
			players[playerId].showBallCount();
		}
		
		
		// draw the canvas
		canvasState.draw();
				
	}

	
	
	// the method responsible for drawing the objects contained in the canvas 	
	canvasState.draw=function(){
		
		var context = canvas.getContext('2d');
      
		clearCanvas();
			
		// draw the balls	
		for(var i=0;i<canvasState.balls.length;i++){
			
			var ball=canvasState.balls[i];
			
			// draw the circle
			context.beginPath();
			context.arc(ball.x, ball.y, ball.r, 0, 2*Math.PI,true);
			context.strokeStyle = '#000000';
			context.stroke();
			context.fillStyle = ball.fillStyle;
			context.fill();		
			// draw the ball label
			context.font = "10px Comic Sans MS";			
			context.fillStyle ='white';
			context.fillText(ball.points+"",ball.x-3,ball.y+3);           // draw the point value of the ball

		}	

		// draw the top edge targets
		for(var i=0;i<canvasState.t_horz_targets.length;i++){
			
			var target=canvasState.t_horz_targets[i];
			context.strokeStyle = '#000000';
			context.fillStyle = 'red';
			context.fillRect(target.x,target.y,target.width,target.height);		
			
		}

		// draw the bottom edge targets
		for(var i=0;i<canvasState.b_horz_targets.length;i++){
			
			var target=canvasState.b_horz_targets[i];
			context.strokeStyle = '#000000';
			context.fillStyle = 'green';
			context.fillRect(target.x,target.y,target.width,target.height);		
			
		}

		// draw the right edge targets		
		for(var i=0;i<canvasState.r_vert_targets.length;i++){
			
			var target=canvasState.r_vert_targets[i];
			context.strokeStyle = '#000000';
			context.fillStyle = 'teal';			
			context.fillRect(target.x,target.y,target.width,target.height);		
			
		}	

		// draw the left edge targets
		for(var i=0;i<canvasState.l_vert_targets.length;i++){
			
			var target=canvasState.l_vert_targets[i];
			context.strokeStyle = '#000000';
			context.fillStyle = 'blue';
			context.fillRect(target.x,target.y,target.width,target.height);		
			
		}	

		
	}
		
	// generate next state of the canvas	
	canvasState.generateNextState=function(){
		
		// move each of the balls according to their velocities
		for(var i=0;i<canvasState.balls.length;i++){			
			canvasState.balls[i].move();											
		}
		
		// after moving, test if any pair of the balls have collided or not
		for(var i=0; i<canvasState.balls.length; i++){			
			var t1=canvasState.balls[i];	
			for(var j=i+1; j<canvasState.balls.length; j++){			
				var t2=canvasState.balls[j];
				if( dist(t1.x,t1.y,t2.x,t2.y)<(t1.r+t2.r)){
					// if the balls have collided, set the flag to true and add the id of the second ball to first ball's data structure
					t1.hasCollided=true;
					t1.collidedBalls.push(t2);

				}	
			}
		}
		
		// resolve collision of each of the balls using only the first ball it has collided with
		for(var i=0;i<canvasState.balls.length;i++){
			if(canvasState.balls[i].hasCollided){
				canvasState.exchangeVelocity(canvasState.balls[i],canvasState.balls[i].collidedBalls[0]);	
			}										
		}			
	}
	
	
	canvasState.collision_resolution_swap_velocities=function(ball_a, ball_b){
		
		// simple elastic collision
		
		var tmp;
		// swap the x components of the velocity
		tmp=ball_a.vx;
		ball_a.vx=ball_b.vx;
		ball_b.vx=tmp;
		
		// swap the y components of the velocity
		tmp=ball_a.vy;
		ball_a.vy=ball_b.vy;
		ball_b.vy=tmp;
		
		// push the balls away if velocity is small so that they are less likely to be still in collision in the next update 		
		if(ball_a.vx < ball_a.r){
			ball_a.x+=ball_a.vx;
		}
		if(ball_b.vx < ball_b.r){
			ball_b.x+=ball_b.vx;
		}
		if(ball_a.vy < ball_a.r){
			ball_a.y+=ball_a.vy;
		}
		if(ball_b.vy < ball_b.r){
			ball_b.y+=ball_b.vy;
		}

		// reset the collision state of the balls	
		ball_a.collidedBalls=[];
		ball_a.hasCollided=false;
		ball_b.collidedBalls=[];
		ball_b.hasCollided=false;	
	}
	
	canvasState.exchangeVelocity=function(ball_a, ball_b){		
		canvasState.collision_resolution_swap_velocities(ball_a, ball_b);
	}
	
		
	// update the canvas state and draw
	canvasState.updateState=function(){
		canvasState.generateNextState();
		canvasState.draw();

	}
	
	function stopGame() {
		clearInterval(canvasState.animationIntervalId);
		document.getElementById("startAnimationButtonId").disabled="";
		document.getElementById("idHowLong").disabled="";
		document.getElementById("idNumPlayers").disabled="";
		var whoWon = 0;
		for (var i=1; i<players.length; i++) {
			if (players[whoWon].score < players[i].score) {
				whoWon = i;
			}
		}
		window.alert("Congratulations, Player "+players[whoWon].playerNum+" -- You Won!!");
	}
	
	function animateCanvas(){
		document.getElementById("idHowLong").disabled="disabled";
		document.getElementById("idNumPlayers").disabled="disabled";
		canvasState.animationIntervalId=setInterval(canvasState.updateState,4);
		document.getElementById("startAnimationButtonId").disabled="disabled";
		setTimeout(stopGame,gameTime);
	}
	
	function pauseCanvas() {
		stopGame();
	}
	
	function clearCanvas(){
		var context = canvas.getContext('2d');      
		context.clearRect(0, 0, canvas.width, canvas.height);
	
	}
	
	// Match the number of players entered with the players list
	function setGamePlayers(n) {
		numPlayers = Math.max(n,1);
		numPlayers = Math.min(n,5);
		document.getElementById("idNumPlayers").value = numPlayers;

		// Trim extra entries
		for (var i=players.length; i>n; i--) {
			var p = players.pop();
			p.erase();
		}

		// Add entries
		for (var i=players.length; i<n; i++) {
			players.push(new Player(i));
			players[i].showBallCount();
			players[i].showScore();
		}
		
		canvasState.draw();
	}

	// Set the game time
	function setGameTime(val) {
		gameTime = val*1000;
	}

	// Initialize the players array with the default setting
	players=[];
	setGamePlayers(numPlayers);
	
	