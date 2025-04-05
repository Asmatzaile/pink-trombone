/*
P I N K   T R O M B O N E

Bare-handed procedural speech synthesis

version 1.1, March 2017
by Neil Thapen
venuspatrol.nfshost.com


Bibliography

Julius O. Smith III, "Physical audio signal processing for virtual musical instruments and audio effects."
https://ccrma.stanford.edu/~jos/pasp/

Story, Brad H. "A parametric model of the vocal tract area function for vowel and consonant simulation." 
The Journal of the Acoustical Society of America 117.5 (2005): 3231-3254.

Lu, Hui-Ling, and J. O. Smith. "Glottal source modeling for singing voice synthesis." 
Proceedings of the 2000 International Computer Music Conference. 2000.

Mullen, Jack. Physical modelling of the vocal tract with the 2D digital waveguide mesh. 
PhD thesis, University of York, 2006.


Copyright 2017 Neil Thapen
Copyright 2025 Gorka Egino

Permission is hereby granted, free of charge, to any person obtaining a 
copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
IN THE SOFTWARE.
*/

const clamp = (number, min, max) => Math.max(min, Math.min(max, number));

var palePink = "#FFEEF5";
const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
var temp = {a:0, b:0};

var time = 0;

function redraw(highResTimestamp)
{
    time = Date.now()/1000;
    UI.updateTouches();
    UI.draw();
    requestAnimationFrame(redraw);
}

export const UI = 
{ 
    width : 600,
    top_margin : 5,
    left_margin : 5,
    inAboutScreen : true,
    inInstructionsScreen : false,
    instructionsLine : 0,
    debugText : "",

    showControls: false,
    showAnatomyLabels: false,
    
    init : function(trombone)
    {
        this.glottis = trombone.glottis;
        this.tract = trombone.tract;
        this.audioSystem = trombone.audioSystem;

        this.touchesWithMouse = [];
        this.mouseTouch = {alive: false, endTime: 0};
        this.mouseDown = false;
        
        this.aboutButton = makeButton(460, 392, 140, 30, "about...", true);         
        this.alwaysVoiceButton = makeButton(460, 428, 140, 30, "always voice", trombone.glottis.alwaysVoice);
        this.autoWobbleButton = makeButton(460, 464, 140, 30, "pitch wobble", trombone.glottis.autoWobble); 

        var backCanvas = document.createElement("canvas");
        backCanvas.width = 600;
        backCanvas.height = 600;
        var backCtx = backCanvas.getContext("2d");
        var tractCanvas = document.createElement("canvas");
        tractCanvas.width = 600;
        tractCanvas.height = 600;
        var tractCtx = tractCanvas.getContext("2d");
        this.tractCtx = tractCtx;

        this.backCanvas = backCanvas;
        this.tractCanvas = tractCanvas;

        tractCanvas.addEventListener('touchstart', UI.startTouches);
        tractCanvas.addEventListener('touchmove', UI.moveTouches);
        tractCanvas.addEventListener('touchend', UI.endTouches);     
        tractCanvas.addEventListener('touchcancel', UI.endTouches);  

        const onResize = newSize => this.width = newSize;
        const observer = new ResizeObserver(entries => onResize(entries[0].borderBoxSize[0].inlineSize));
        observer.observe(tractCanvas);

        document.addEventListener('mousedown', (e) => UI.startMouse(e));
        document.addEventListener('mouseup', (e) => UI.endMouse(e));
        document.addEventListener('mousemove', (e) => UI.moveMouse(e));    
        
        TractUI.init(this.tract, this.glottis, {showControls: this.showControls, showAnatomyLabels: this.showAnatomyLabels, ctx: tractCtx, canvas: tractCanvas, backCtx });
        GlottisUI.init(this.glottis, this.showControls, {ctx: backCtx});
        requestAnimationFrame(redraw);

        return { backCanvas, tractCanvas };
    },
    
    draw : function()
    {
        TractUI.draw({showControls: this.showControls, showAnatomyLabels: this.showAnatomyLabels });
        if (!this.showControls) return;
        this.alwaysVoiceButton.draw(this.tractCtx);
        this.autoWobbleButton.draw(this.tractCtx);
        this.aboutButton.draw(this.tractCtx);
        if (this.inAboutScreen) this.drawAboutScreen();
        else if (this.inInstructionsScreen) this.drawInstructionsScreen();

    },
    
    drawAboutScreen :  function()
    {
        var ctx = this.tractCtx;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "white";
        ctx.rect(0,0,600,600);
        ctx.fill();   
    
        this.drawAboutText();
    },
    
    drawAboutText : function()
    {
        var ctx = this.tractCtx;
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#C070C6";
        ctx.strokeStyle = "#C070C6";
        ctx.font="50px Arial";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.strokeText("P i n k   T r o m b o n e", 300, 230);
        ctx.fillText("P i n k   T r o m b o n e", 300, 230);
        
        ctx.font="28px Arial";
        ctx.fillText("bare-handed  speech synthesis", 300, 330);

        ctx.font="20px Arial";        
        //ctx.fillText("(tap to start)", 300, 380);   

        if (isFirefox) 
        {
            ctx.font="20px Arial";        
            ctx.fillText("(sorry - may work poorly with the Firefox browser)", 300, 430);  
        }
    },

    
    drawInstructionsScreen :  function()
    {
        this.audioSystem.mute();
        var ctx = this.tractCtx;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "white";
        ctx.rect(0,0,600,600);
        ctx.fill();   
        
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#C070C6";
        ctx.strokeStyle = "#C070C6";
        ctx.font="24px Arial";
        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        
        ctx.font = "19px Arial";
        ctx.textAlign = "left";
        this.instructionsLine = 0;
        this.write("Sound is generated in the glottis (at the bottom left) then ");
        this.write("filtered by the shape of the vocal tract. The voicebox ");
        this.write("controls the pitch and intensity of the initial sound.");
        this.write("");
        this.write("Then, to talk:");
        this.write("");
        this.write("- move the body of the tongue to shape vowels");
        this.write("");
        this.write("- touch the oral cavity to narrow it, for fricative consonants");
        this.write("");
        this.write("- touch above the oral cavity to close it, for stop consonants");
        this.write("");
        this.write("- touch the nasal cavity to open the velum and let sound ");
        this.write("   flow through the nose.");
        this.write("");
        this.write("");
        this.write("(tap anywhere to continue)");
        
        ctx.textAlign = "center";
        ctx.fillText("[tap here to RESET]", 470, 535);
        
        this.instructionsLine = 18.8;
        ctx.textAlign = "left";
        this.write("Pink Trombone v1.1");
        this.write("by Neil Thapen");
        ctx.fillStyle = "blue";
        ctx.globalAlpha = 0.6;
        this.write("venuspatrol.nfshost.com");
        
        /*ctx.beginPath();
        ctx.rect(35, 535, 230, 35);
        ctx.rect(370, 505, 200, 50);
        ctx.fill();*/
        
        ctx.globalAlpha = 1.0;
    },

    
    instructionsScreenHandleTouch : function(x,y)
    {
        if ((x >=35 && x<=265) && (y>=535 && y<=570)) window.location.href = "http://venuspatrol.nfshost.com";
        else if ((x>=370 && x<=570) && (y>=505 && y<=555)) location.reload(false);
        else
        {
            UI.inInstructionsScreen = false;
            UI.aboutButton.switchedOn = true;
            this.audioSystem.unmute();
        }
    },
    
    write : function(text)
    {
        this.tractCtx.fillText(text, 50, 100 + this.instructionsLine*22);
        this.instructionsLine += 1;
        if (text == "") this.instructionsLine -= 0.3;
    },
    
    buttonsHandleTouchStart : function(touch)
    {
        this.alwaysVoiceButton.handleTouchStart(touch);
        this.glottis.alwaysVoice = this.alwaysVoiceButton.switchedOn;
        this.autoWobbleButton.handleTouchStart(touch);
        this.glottis.autoWobble = this.autoWobbleButton.switchedOn;
        this.aboutButton.handleTouchStart(touch);

    },
    
    startTouches : function(event)
    {
        if (!this.showControls) return;
        event.preventDefault();
        
        if (UI.inAboutScreen)
        {
            UI.inAboutScreen = false;
            return;
        }
        
        if (UI.inInstructionsScreen)
        {
            var touches = event.changedTouches;
            for (var j=0; j<touches.length; j++)        
            {
                var x = (touches[j].clientX-this.tractCanvas.getBoundingClientRect().left)/UI.width*600;
                var y = (touches[j].clientY-this.tractCanvas.getBoundingClientRect().top)/UI.width*600;
            }
            UI.instructionsScreenHandleTouch(x,y);
            return;
        }
        

        var touches = event.changedTouches;
        for (var j=0; j<touches.length; j++)        
        {
            var touch = {};
            touch.startTime = time;
            touch.endTime = 0;
            touch.fricative_intensity = 0;            
            touch.alive = true;
            touch.id = touches[j].identifier;
            touch.x = (touches[j].clientX-this.tractCanvas.getBoundingClientRect().left)/UI.width*600;
            touch.y = (touches[j].clientY-this.tractCanvas.getBoundingClientRect().top)/UI.width*600;
            touch.index = TractUI.getIndex(touch.x, touch.y);
            touch.diameter = TractUI.getDiameter(touch.x, touch.y);
            UI.touchesWithMouse.push(touch);
            UI.buttonsHandleTouchStart(touch);            
        }    

        UI.handleTouches();
    },
    
    getTouchById : function(id)
    {
        for (var j=0; j<UI.touchesWithMouse.length; j++)
        {
            if (UI.touchesWithMouse[j].id == id && UI.touchesWithMouse[j].alive) return UI.touchesWithMouse[j];
        }
        return 0;
    },
    
    moveTouches : function(event)
    {
        if (!this.showControls) return;
        var touches = event.changedTouches;
        for (var j=0; j<touches.length; j++)        
        {
            var touch = UI.getTouchById(touches[j].identifier);
            if (touch != 0)
            {
                touch.x = (touches[j].clientX-this.tractCanvas.getBoundingClientRect().left)/UI.width*600;
                touch.y = (touches[j].clientY-this.tractCanvas.getBoundingClientRect().top)/UI.width*600;
                touch.index = TractUI.getIndex(touch.x, touch.y);
                touch.diameter = TractUI.getDiameter(touch.x, touch.y);
            }
        }   
        UI.handleTouches();
    },
    
    endTouches : function(event)
    {
        var touches = event.changedTouches;
        for (var j=0; j<touches.length; j++)        
        {
            var touch = UI.getTouchById(touches[j].identifier);
            if (touch != 0)
            {
                touch.alive = false;
                touch.endTime = time; 
            }
        }   
        UI.handleTouches();
        
        if (!UI.aboutButton.switchedOn) 
        {
            UI.inInstructionsScreen = true;
        }
    },
      
    startMouse : function(event)
    {
        if (!this.showControls) return;
        UI.mouseDown = true;
        event.preventDefault();
        if (UI.inAboutScreen)
        {
            UI.inAboutScreen = false;
            return;
        }
        if (UI.inInstructionsScreen)
        {
            var x = (event.clientX-this.tractCanvas.getBoundingClientRect().left)/UI.width*600;
            var y = (event.clientY-this.tractCanvas.getBoundingClientRect().top)/UI.width*600;
            UI.instructionsScreenHandleTouch(x,y);
            return;
        }
        
        var touch = {};
        touch.startTime = time;
        touch.fricative_intensity = 0;
        touch.endTime = 0;
        touch.alive = true;
        touch.id = "mouse"+Math.random();
        touch.x = (event.clientX-this.tractCanvas.getBoundingClientRect().left)/UI.width*600;
        touch.y = (event.clientY-this.tractCanvas.getBoundingClientRect().top)/UI.width*600;
        touch.index = TractUI.getIndex(touch.x, touch.y);
        touch.diameter = TractUI.getDiameter(touch.x, touch.y);
        UI.mouseTouch = touch;
        UI.touchesWithMouse.push(touch);   
        UI.buttonsHandleTouchStart(touch);
        UI.handleTouches();
    },    

    moveMouse : function(event)
    {
        if (!this.showControls) return;
        var touch = UI.mouseTouch;
        if (!touch.alive) return;
        touch.x = (event.clientX-this.tractCanvas.getBoundingClientRect().left)/UI.width*600;
        touch.y = (event.clientY-this.tractCanvas.getBoundingClientRect().top)/UI.width*600;
        touch.index = TractUI.getIndex(touch.x, touch.y);
        touch.diameter = TractUI.getDiameter(touch.x, touch.y); 
        UI.handleTouches();
    },
    
    endMouse : function(event)
    {
        UI.mouseDown = false;
        var touch = UI.mouseTouch;
        if (!touch.alive) return;
        touch.alive = false;
        touch.endTime = time; 
        UI.handleTouches();
        
        if (!UI.aboutButton.switchedOn) UI.inInstructionsScreen = true;  
    },
    
    handleTouches : function(event)
    {
        TractUI.handleTouches();
        GlottisUI.handleTouches();
    },
    
    updateTouches : function()
    {
        var fricativeAttackTime = 0.1;
        for (var j=UI.touchesWithMouse.length-1; j >=0; j--)
        {
            var touch = UI.touchesWithMouse[j];
            if (!(touch.alive) && (time > touch.endTime + 1))
            {
                UI.touchesWithMouse.splice(j,1);
            }
            else if (touch.alive) 
            {
                touch.fricative_intensity = clamp((time-touch.startTime)/fricativeAttackTime, 0, 1);
            }
            else
            {
                touch.fricative_intensity = clamp(1-(time-touch.endTime)/fricativeAttackTime, 0, 1);
            }
        }
        this.tract.fricativeTouches = this.touchesWithMouse;
    }
}

var TractUI =
{
    originX : 340, 
    originY : 449, 
    radius : 298, 
    scale : 60,
    tongueIndex : 12.9,
    tongueDiameter : 2.43,
    innerTongueControlRadius : 2.05,
    outerTongueControlRadius : 3.5,
    tongueTouch : 0,
    angleScale : 0.64,
    angleOffset : -0.24,
    noseOffset : 0.8,
    gridOffset : 1.7,
    fillColour : 'pink',
    lineColour : '#C070C6',
    
    init : function(tract, glottis, {showControls, showAnatomyLabels, ctx, canvas, backCtx })
    {
        this.ctx = ctx;
        this.canvas = canvas;
        this.backCtx = backCtx;
        this.tract = tract;
        this.glottis = glottis;
        this.setRestDiameter();
        for (var i=0; i<this.tract.n; i++) 
        {
            this.tract.diameter[i] = this.tract.targetDiameter[i] = this.tract.restDiameter[i];
        }
        this.drawBackground(showControls, showAnatomyLabels);
        this.tongueLowerIndexBound = this.tract.bladeStart+2;
        this.tongueUpperIndexBound = this.tract.tipStart-3;
        this.tongueIndexCentre = 0.5*(this.tongueLowerIndexBound+this.tongueUpperIndexBound);
    },
    
    moveTo : function(i,d) 
    {
        var angle = this.angleOffset + i * this.angleScale * Math.PI / (this.tract.lipStart-1);
        var wobble = (this.tract.maxAmplitude[this.tract.n-1]+this.tract.noseMaxAmplitude[this.tract.noseLength-1]);
        wobble *= 0.03*Math.sin(2*i-50*time)*i/this.tract.n;
        angle += wobble;        
        var r = this.radius - this.scale*d + 100*wobble;
        this.ctx.moveTo(this.originX-r*Math.cos(angle), this.originY-r*Math.sin(angle));
    },
    
    lineTo : function(i,d) 
    {
        var angle = this.angleOffset + i * this.angleScale * Math.PI / (this.tract.lipStart-1);
        var wobble = (this.tract.maxAmplitude[this.tract.n-1]+this.tract.noseMaxAmplitude[this.tract.noseLength-1]);
        wobble *= 0.03*Math.sin(2*i-50*time)*i/this.tract.n;
        angle += wobble;       
        var r = this.radius - this.scale*d + 100*wobble;
        this.ctx.lineTo(this.originX-r*Math.cos(angle), this.originY-r*Math.sin(angle));
    },
    
    drawText : function(i,d,text)
    {
        var angle = this.angleOffset + i * this.angleScale * Math.PI / (this.tract.lipStart-1);
        var r = this.radius - this.scale*d; 
        this.ctx.save();
        this.ctx.translate(this.originX-r*Math.cos(angle), this.originY-r*Math.sin(angle)+2); //+8);
        this.ctx.rotate(angle-Math.PI/2);
        this.ctx.fillText(text, 0, 0);
        this.ctx.restore();
    },
    
    drawTextStraight : function(i,d,text)
    {
        var angle = this.angleOffset + i * this.angleScale * Math.PI / (this.tract.lipStart-1);
        var r = this.radius - this.scale*d; 
        this.ctx.save();
        this.ctx.translate(this.originX-r*Math.cos(angle), this.originY-r*Math.sin(angle)+2); //+8);
        //this.ctx.rotate(angle-Math.PI/2);
        this.ctx.fillText(text, 0, 0);
        this.ctx.restore();
    },
    
    drawCircle : function(i,d,radius)
    {
        var angle = this.angleOffset + i * this.angleScale * Math.PI / (this.tract.lipStart-1);
        var r = this.radius - this.scale*d; 
        this.ctx.beginPath();
        this.ctx.arc(this.originX-r*Math.cos(angle), this.originY-r*Math.sin(angle), radius, 0, 2*Math.PI);
        this.ctx.fill();
    },
        
    getIndex : function(x,y)
    {
        var xx = x-this.originX; var yy = y-this.originY;
        var angle = Math.atan2(yy, xx);
        while (angle> 0) angle -= 2*Math.PI;
        return (Math.PI + angle - this.angleOffset)*(this.tract.lipStart-1) / (this.angleScale*Math.PI);
    },
    getDiameter : function(x,y)
    {
        var xx = x-this.originX; var yy = y-this.originY;
        return (this.radius-Math.sqrt(xx*xx + yy*yy))/this.scale;
    },
    
    draw : function({showControls, showAnatomyLabels})
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';        
        this.ctx.lineJoin = 'round';  
        
        if (showControls) {
            this.drawTongueControl();
            this.drawPitchControl();
        }
        
        var velum = this.tract.noseDiameter[0];
        var velumAngle = velum * 4;
        
        //first draw fill
        this.ctx.beginPath();        
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.fillColour;
        this.ctx.fillStyle = this.fillColour;
        this.moveTo(1,0);
        for (var i = 1; i < this.tract.n; i++) this.lineTo(i, this.tract.diameter[i]);
        for (var i = this.tract.n-1; i >= 2; i--) this.lineTo(i, 0);  
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
        
        //for nose
        this.ctx.beginPath();        
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.fillColour;
        this.ctx.fillStyle = this.fillColour;
        this.moveTo(this.tract.noseStart, -this.noseOffset);
        for (var i = 1; i < this.tract.noseLength; i++) this.lineTo(i+this.tract.noseStart, -this.noseOffset - this.tract.noseDiameter[i]*0.9);
        for (var i = this.tract.noseLength-1; i >= 1; i--) this.lineTo(i+this.tract.noseStart, -this.noseOffset);  
        this.ctx.closePath();
        //this.ctx.stroke();
        this.ctx.fill();
        
        //velum
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.fillColour;
        this.ctx.fillStyle = this.fillColour;
        this.moveTo(this.tract.noseStart-2, 0);
        this.lineTo(this.tract.noseStart, -this.noseOffset);
        this.lineTo(this.tract.noseStart+velumAngle, -this.noseOffset);
        this.lineTo(this.tract.noseStart+velumAngle-2, 0);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
        

        
        //white text
        this.ctx.fillStyle = "white";
        this.ctx.font="20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.globalAlpha = 1.0;
        if (showAnatomyLabels) {
            this.drawText(this.tract.n*0.10, 0.425, "throat");         
            this.drawText(this.tract.n*0.71, -1.8, "nasal");
            this.drawText(this.tract.n*0.71, -1.3, "cavity");
            this.ctx.font="22px Arial";        
            this.drawText(this.tract.n*0.6, 0.9, "oral");    
            this.drawText(this.tract.n*0.7, 0.9, "cavity"); 
        }
         
  
       
        this.drawAmplitudes(); 
        
        //then draw lines
        this.ctx.beginPath();        
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = this.lineColour;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';          
        this.moveTo(1, this.tract.diameter[0]);
        for (var i = 2; i < this.tract.n; i++) this.lineTo(i, this.tract.diameter[i]);
        this.moveTo(1,0);
        for (var i = 2; i <= this.tract.noseStart-2; i++) this.lineTo(i, 0);
        this.moveTo(this.tract.noseStart+velumAngle-2,0);
        for (var i = this.tract.noseStart+Math.ceil(velumAngle)-2; i < this.tract.n; i++) this.lineTo(i, 0);   
        this.ctx.stroke();
        
        //for nose
        this.ctx.beginPath();        
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = this.lineColour;
        this.ctx.lineJoin = 'round';  
        this.moveTo(this.tract.noseStart, -this.noseOffset);
        for (var i = 1; i < this.tract.noseLength; i++) this.lineTo(i+this.tract.noseStart, -this.noseOffset - this.tract.noseDiameter[i]*0.9);
        this.moveTo(this.tract.noseStart+velumAngle, -this.noseOffset);
        for (var i = Math.ceil(velumAngle); i < this.tract.noseLength; i++) this.lineTo(i+this.tract.noseStart, -this.noseOffset);
        this.ctx.stroke();
        
        
        //velum
        this.ctx.globalAlpha = velum*5;
        this.ctx.beginPath();
        this.moveTo(this.tract.noseStart-2, 0);
        this.lineTo(this.tract.noseStart, -this.noseOffset);
        this.moveTo(this.tract.noseStart+velumAngle-2, 0);
        this.lineTo(this.tract.noseStart+velumAngle, -this.noseOffset);  
        this.ctx.stroke();

        
        this.ctx.fillStyle = "orchid";
        this.ctx.font="20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.globalAlpha = 0.7;
        if (showAnatomyLabels) this.drawText(this.tract.n*0.95, 0.8+0.8*this.tract.diameter[this.tract.n-1], " lip"); 
        
        this.ctx.globalAlpha=1.0;        
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = "left";
        this.ctx.fillText(UI.debugText, 20, 20);
        // this.drawPositions();
    },
    
    drawBackground : function(showControls, showAnatomyLabels)
    {
        this.ctx = this.backCtx;
        
        
        //text
        this.ctx.fillStyle = "orchid";
        this.ctx.font="20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.globalAlpha = 0.7;
        if (showAnatomyLabels) {
            this.drawText(this.tract.n*0.44, -0.28, "soft");
            this.drawText(this.tract.n*0.51, -0.28, "palate");
            this.drawText(this.tract.n*0.77, -0.28, "hard");
            this.drawText(this.tract.n*0.84, -0.28, "palate");
            this.drawText(this.tract.n*0.95, -0.28, " lip");
        }

        this.ctx.font="17px Arial";        
        if (showControls) this.drawTextStraight(this.tract.n*0.18, 3, "  tongue control");   
        this.ctx.textAlign = "left";
        if (showAnatomyLabels) {
            this.drawText(this.tract.n*1.03, -1.07, "nasals");
            this.drawText(this.tract.n*1.03, -0.28, "stops");
            this.drawText(this.tract.n*1.03, 0.51, "fricatives");
            //this.drawTextStraight(1.5, +0.8, "glottis")
        }

        this.ctx.strokeStyle = "orchid";
        this.ctx.lineWidth = 2;
        if (showAnatomyLabels) {
            this.ctx.beginPath();
            this.moveTo(this.tract.n*1.03, 0); this.lineTo(this.tract.n*1.07, 0); 
            this.moveTo(this.tract.n*1.03, -this.noseOffset); this.lineTo(this.tract.n*1.07,  -this.noseOffset); 
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 0.9;
        this.ctx.globalAlpha = 1.0;
    },
    
    drawPositions : function()
    {
        this.ctx.fillStyle = "orchid";
        this.ctx.font="24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.globalAlpha = 0.6;
        var a = 2;
        var b = 1.5;
        this.drawText(15, a+b*0.60, 'æ'); //pat
        this.drawText(13, a+b*0.27, 'ɑ'); //part
        this.drawText(12, a+b*0.00, 'ɒ'); //pot
        this.drawText(17.7, a+b*0.05, '(ɔ)'); //port (rounded)
        this.drawText(27, a+b*0.65, 'ɪ'); //pit
        this.drawText(27.4, a+b*0.21, 'i'); //peat
        this.drawText(20, a+b*1.00, 'e'); //pet
        this.drawText(18.1, a+b*0.37, 'ʌ'); //putt   
            //put ʊ
        this.drawText(23, a+b*0.1, '(u)'); //poot (rounded)   
        this.drawText(21, a+b*0.6, 'ə'); //pert [should be ɜ]
        
        var nasals = -1.1;
        var stops = -0.4;
        var fricatives = 0.3;
        var approximants = 1.1;
        this.ctx.globalAlpha = 0.8;
        
        //approximants
        this.drawText(38, approximants, 'l');
        this.drawText(41, approximants, 'w');
        
        //?
        this.drawText(4.5, 0.37, 'h');
        
        if (this.glottis.isTouched || this.glottis.alwaysVoice)
        {
            //voiced consonants
            this.drawText(31.5, fricatives, 'ʒ');     
            this.drawText(36, fricatives, 'z');
            this.drawText(41, fricatives, 'v');
            this.drawText(22, stops, 'g');
            this.drawText(36, stops, 'd');
            this.drawText(41, stops, 'b');
            this.drawText(22, nasals, 'ŋ');
            this.drawText(36, nasals, 'n');
            this.drawText(41, nasals, 'm');  
        }
        else
        {
            //unvoiced consonants
            this.drawText(31.5, fricatives, 'ʃ'); 
            this.drawText(36, fricatives, 's');
            this.drawText(41, fricatives, 'f');
            this.drawText(22, stops, 'k');
            this.drawText(36, stops, 't');
            this.drawText(41, stops, 'p');
            this.drawText(22, nasals, 'ŋ');
            this.drawText(36, nasals, 'n');
            this.drawText(41, nasals, 'm');  
        }
    },
    
    drawAmplitudes : function()
    {
        this.ctx.strokeStyle = "orchid";
        this.ctx.lineCap = "butt";
        this.ctx.globalAlpha = 0.3;
        for (var i=2; i<this.tract.n-1; i++)
        {
            this.ctx.beginPath();
            this.ctx.lineWidth = Math.sqrt(this.tract.maxAmplitude[i])*3;
            this.moveTo(i, 0);
            this.lineTo(i, this.tract.diameter[i]);
            this.ctx.stroke();
        }
        for (var i=1; i<this.tract.noseLength-1; i++)
        {
            this.ctx.beginPath();
            this.ctx.lineWidth = Math.sqrt(this.tract.noseMaxAmplitude[i]) * 3;
            this.moveTo(i+this.tract.noseStart, -this.noseOffset);
            this.lineTo(i+this.tract.noseStart, -this.noseOffset - this.tract.noseDiameter[i]*0.9);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    },
    
    drawTongueControl : function()
    {
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.strokeStyle = palePink;
        this.ctx.fillStyle = palePink;
        this.ctx.globalAlpha = 1.0;
        this.ctx.beginPath();
        this.ctx.lineWidth = 45;
        
        //outline
        this.moveTo(this.tongueLowerIndexBound, this.innerTongueControlRadius);
        for (var i=this.tongueLowerIndexBound+1; i<=this.tongueUpperIndexBound; i++) this.lineTo(i, this.innerTongueControlRadius);
        this.lineTo(this.tongueIndexCentre, this.outerTongueControlRadius);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
        
        var a = this.innerTongueControlRadius;
        var c = this.outerTongueControlRadius;
        var b = 0.5*(a+c);
        var r = 3;
        this.ctx.fillStyle = "orchid";
        this.ctx.globalAlpha = 0.3;        
        this.drawCircle(this.tongueIndexCentre, a, r);
        this.drawCircle(this.tongueIndexCentre-4.25, a, r);
        this.drawCircle(this.tongueIndexCentre-8.5, a, r);
        this.drawCircle(this.tongueIndexCentre+4.25, a, r);
        this.drawCircle(this.tongueIndexCentre+8.5, a, r);
        this.drawCircle(this.tongueIndexCentre-6.1, b, r);    
        this.drawCircle(this.tongueIndexCentre+6.1, b, r);  
        this.drawCircle(this.tongueIndexCentre, b, r);  
        this.drawCircle(this.tongueIndexCentre, c, r);
        
        this.ctx.globalAlpha = 1.0;         

        //circle for tongue position
        var angle = this.angleOffset + this.tongueIndex * this.angleScale * Math.PI / (this.tract.lipStart-1);
        var r = this.radius - this.scale*(this.tongueDiameter);
        var x = this.originX-r*Math.cos(angle);
        var y = this.originY-r*Math.sin(angle);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "orchid";
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.arc(x,y, 18, 0, 2*Math.PI);
        this.ctx.stroke();        
        this.ctx.globalAlpha = 0.15;
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        
        this.ctx.fillStyle = "orchid";
     },
    
    drawPitchControl : function()
    {
        var w=9;
        var h=15;
        if (GlottisUI.x)
        {
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = "orchid";
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(GlottisUI.x-w, GlottisUI.y-h);
            this.ctx.lineTo(GlottisUI.x+w, GlottisUI.y-h);
            this.ctx.lineTo(GlottisUI.x+w, GlottisUI.y+h);
            this.ctx.lineTo(GlottisUI.x-w, GlottisUI.y+h);                    
            this.ctx.closePath();            
            this.ctx.stroke();    
            this.ctx.globalAlpha = 0.15;
            this.ctx.fill();            
            this.ctx.globalAlpha = 1.0;
        }
    },
    
    setRestDiameter : function()
    {
        for (var i=this.tract.bladeStart; i<this.tract.lipStart; i++)
        {
            var t = 1.1 * Math.PI*(this.tongueIndex - i)/(this.tract.tipStart - this.tract.bladeStart);
            var fixedTongueDiameter = 2+(this.tongueDiameter-2)/1.5;
            var curve = (1.5-fixedTongueDiameter+this.gridOffset)*Math.cos(t);
            if (i == this.tract.bladeStart-2 || i == this.tract.lipStart-1) curve *= 0.8;
            if (i == this.tract.bladeStart || i == this.tract.lipStart-2) curve *= 0.94;               
            this.tract.restDiameter[i] = 1.5 - curve;
        }
    },
    
    handleTouches : function()
    {           
        if (this.tongueTouch != 0 && !this.tongueTouch.alive) this.tongueTouch = 0;
        
        if (this.tongueTouch == 0)
        {        
            for (var j=0; j<UI.touchesWithMouse.length; j++)  
            {
                var touch = UI.touchesWithMouse[j];
                if (!touch.alive) continue;
                if (touch.fricative_intensity == 1) continue; //only new touches will pass this
                var x = touch.x;
                var y = touch.y;        
                var index = TractUI.getIndex(x,y);
                var diameter = TractUI.getDiameter(x,y);
                if (index >= this.tongueLowerIndexBound-4 && index<=this.tongueUpperIndexBound+4 
                    && diameter >= this.innerTongueControlRadius-0.5 && diameter <= this.outerTongueControlRadius+0.5)
                {
                    this.tongueTouch = touch;
                }
            }    
        }
        
        if (this.tongueTouch != 0)
        {
            var x = this.tongueTouch.x;
            var y = this.tongueTouch.y;        
            var index = TractUI.getIndex(x,y);
            var diameter = TractUI.getDiameter(x,y);
            var fromPoint = (this.outerTongueControlRadius-diameter)/(this.outerTongueControlRadius-this.innerTongueControlRadius);
            fromPoint = clamp(fromPoint, 0, 1);
            fromPoint = Math.pow(fromPoint, 0.58) - 0.2*(fromPoint*fromPoint-fromPoint); //horrible kludge to fit curve to straight line
            this.tongueDiameter = clamp(diameter, this.innerTongueControlRadius, this.outerTongueControlRadius);
            //this.tongueIndex = clamp(index, this.tongueLowerIndexBound, this.tongueUpperIndexBound);
            var out = fromPoint*0.5*(this.tongueUpperIndexBound-this.tongueLowerIndexBound);
            this.tongueIndex = clamp(index, this.tongueIndexCentre-out, this.tongueIndexCentre+out);
        }
        
        this.setRestDiameter();   
        for (var i=0; i<this.tract.n; i++) this.tract.targetDiameter[i] = this.tract.restDiameter[i];        
        
        //other constrictions and nose
        this.tract.velumTarget = 0.01;
        for (var j=0; j<UI.touchesWithMouse.length; j++) 
        {
            var touch = UI.touchesWithMouse[j];
            if (!touch.alive) continue;            
            var x = touch.x;
            var y = touch.y;
            var index = TractUI.getIndex(x,y);
            var diameter = TractUI.getDiameter(x,y);
            if (index > this.tract.noseStart && diameter < -this.noseOffset)
            {         
                this.tract.velumTarget = 0.4;
            }            
            temp.a = index;
            temp.b = diameter;
            if (diameter < -0.85-this.noseOffset) continue;
            diameter -= 0.3;
            if (diameter<0) diameter = 0;         
            var width=2;
            if (index<25) width = 10;
            else if (index>=this.tract.tipStart) width= 5;
            else width = 10-5*(index-25)/(this.tract.tipStart-25);
            if (index >= 2 && index < this.tract.n && y<this.canvas.height && diameter < 3)
            {
                const intIndex = Math.round(index);
                for (var i=-Math.ceil(width)-1; i<width+1; i++) 
                {   
                    if (intIndex+i<0 || intIndex+i>=this.tract.n) continue;
                    var relpos = (intIndex+i) - index;
                    relpos = Math.abs(relpos)-0.5;
                    var shrink;
                    if (relpos <= 0) shrink = 0;
                    else if (relpos > width) shrink = 1;
                    else shrink = 0.5*(1-Math.cos(Math.PI * relpos / width));
                    if (diameter < this.tract.targetDiameter[intIndex+i])
                    {
                        this.tract.targetDiameter[intIndex+i] = diameter + (this.tract.targetDiameter[intIndex+i]-diameter)*shrink;
                    }
                }
            }
        }      
    },

}

var GlottisUI = {
    touch : 0,
    x : 240,
    y : 530,
    
    keyboardTop : 500,
    keyboardLeft : 0,
    keyboardWidth : 600,
    keyboardHeight : 100,
    semitones : 20,
    marks : [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    baseNote : 87.3071, //F
    init: function(glottis, showControls, {ctx}) {
        this.ctx = ctx;
        this.glottis = glottis;
        if (showControls) this.drawKeyboard();
    },

    drawKeyboard : function() {      
        this.ctx.strokeStyle = palePink;
        this.ctx.fillStyle = palePink;        
        this.ctx.globalAlpha = 1.0;     
        this.ctx.lineCap = 'round';        
        this.ctx.lineJoin = 'round';        
    
        var radius = 2;
        
        this.drawBar(0.0, 0.4, 8);
        this.ctx.globalAlpha = 0.7;         
        this.drawBar(0.52, 0.72, 8);
        
        this.ctx.strokeStyle = "orchid";   
        this.ctx.fillStyle = "orchid";
        for (var i=0; i< this.semitones; i++)
        {
            var keyWidth = this.keyboardWidth/this.semitones;
            var x = this.keyboardLeft+(i+1/2)*keyWidth;
            var y = this.keyboardTop;
            if (this.marks[(i+3)%12]==1)
            {
                this.ctx.lineWidth = 4;
                this.ctx.globalAlpha = 0.4;  
            }
            else             
            {
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.2;  
            }
            this.ctx.beginPath();
            this.ctx.moveTo(x,y+9);
            this.ctx.lineTo(x, y+this.keyboardHeight*0.4-9);
            this.ctx.stroke();
            
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.15;   
            
            this.ctx.beginPath();
            this.ctx.moveTo(x,y+this.keyboardHeight*0.52+6);
            this.ctx.lineTo(x, y+this.keyboardHeight*0.72-6);
            this.ctx.stroke();  
            
        }
        
        this.ctx.fillStyle = "orchid";
        this.ctx.font="17px Arial";
        this.ctx.textAlign = "center";
        this.ctx.globalAlpha = 0.7; 
        this.ctx.fillText("voicebox control", 300, 490);
        this.ctx.fillText("pitch", 300, 592);
        this.ctx.globalAlpha = 0.3; 
        this.ctx.strokeStyle = "orchid";
        this.ctx.fillStyle = "orchid";  
        this.ctx.save()
        this.ctx.translate(410, 587);
        this.drawArrow(80, 2, 10);
        this.ctx.translate(-220, 0);
        this.ctx.rotate(Math.PI);
        this.drawArrow(80, 2, 10);
        this.ctx.restore(); 
        this.ctx.globalAlpha=1.0;        
    },
    
    drawBar : function(topFactor, bottomFactor, radius)
    {
        this.ctx.lineWidth = radius*2; 
        this.ctx.beginPath();
        this.ctx.moveTo(this.keyboardLeft+radius, this.keyboardTop+topFactor*this.keyboardHeight+radius);
        this.ctx.lineTo(this.keyboardLeft+this.keyboardWidth-radius, this.keyboardTop+topFactor*this.keyboardHeight+radius);
        this.ctx.lineTo(this.keyboardLeft+this.keyboardWidth-radius, this.keyboardTop+bottomFactor*this.keyboardHeight-radius);
        this.ctx.lineTo(this.keyboardLeft+radius, this.keyboardTop+bottomFactor*this.keyboardHeight-radius);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    },
    
    drawArrow : function(l, ahw, ahl)
    {
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-l, 0);
        this.ctx.lineTo(0,0);
        this.ctx.lineTo(0, -ahw);
        this.ctx.lineTo(ahl, 0);
        this.ctx.lineTo(0, ahw);
        this.ctx.lineTo(0,0);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    },
    
    handleTouches :  function()
    {
        if (this.touch != 0 && !this.touch.alive) this.touch = 0;
        
        if (this.touch == 0)
        {        
            for (var j=0; j<UI.touchesWithMouse.length; j++)  
            {
                var touch = UI.touchesWithMouse[j];
                if (!touch.alive) continue;
                if (touch.y<this.keyboardTop) continue;
                this.touch = touch;
            }    
        }
        
        if (this.touch != 0)
        {
            var local_y = this.touch.y -  this.keyboardTop-10;
            var local_x = this.touch.x - this.keyboardLeft;
            local_y = clamp(local_y, 0, this.keyboardHeight-26);
            var semitone = this.semitones * local_x / this.keyboardWidth + 0.5;
            this.glottis.UIFrequency = this.baseNote * Math.pow(2, semitone/12);
            if (this.glottis.intensity == 0) this.glottis.smoothFrequency = this.glottis.UIFrequency;
            //this.glottis.UIRd = 3*local_y / (this.keyboardHeight-20);
            var t = clamp(1-local_y / (this.keyboardHeight-28), 0, 1);
            this.glottis.UITenseness = 1-Math.cos(t*Math.PI*0.5);
            this.glottis.loudness = Math.pow(this.glottis.UITenseness, 0.25);
            this.x = this.touch.x;
            this.y = local_y + this.keyboardTop+10;
        }
        this.glottis.isTouched = (this.touch != 0);
    },
}


function makeButton(x, y, width, height, text, switchedOn)
{
    const button = {};
    button.x = x;
    button.y = y;
    button.width = width;
    button.height = height;
    button.text = text;
    button.switchedOn = switchedOn;
    
    button.draw = function(ctx)
    {
        var radius = 10;
        ctx.strokeStyle = palePink;
        ctx.fillStyle = palePink;        
        ctx.globalAlpha = 1.0;     
        ctx.lineCap = 'round';        
        ctx.lineJoin = 'round';        
        ctx.lineWidth = 2*radius;     
        
        ctx.beginPath();
        ctx.moveTo(this.x+radius, this.y+radius);
        ctx.lineTo(this.x+this.width-radius, this.y+radius);
        ctx.lineTo(this.x+this.width-radius, this.y+this.height-radius);
        ctx.lineTo(this.x+radius, this.y+this.height-radius);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        ctx.font="16px Arial";
        ctx.textAlign = "center";
        if (this.switchedOn) 
        {
            ctx.fillStyle = "orchid";        
            ctx.globalAlpha = 0.6;
        }
        else        
        {
            ctx.fillStyle = "white";        
            ctx.globalAlpha = 1.0;
        }
        this.drawText(ctx);
    };
    
    button.drawText = function(ctx)
    {
        ctx.fillText(this.text, this.x+this.width/2, this.y+this.height/2+6);
    };
    
    button.handleTouchStart = function(touch)
    {
        if (touch.x>=this.x && touch.x <= this.x + this.width  
            && touch.y >= this.y && touch.y <= this.y + this.height)
        {
            this.switchedOn = !this.switchedOn;
        }
    };
    
    return button;
}