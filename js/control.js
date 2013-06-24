var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.requestAnimationFrame = requestAnimationFrame;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

control = {

    ip: '192.168.1.92',
    username: 'webcamtest',
    hue: 0,
    webcam: null,
    canvas: null,
    gCtx: null,
    imageData: null,
    backBuffer: null,
    bCtx: null,
    colour: null,
    hsb: null,
    paused: false,
    flipBulb: true,


    init: function() {

        this.turnLightOn(1);
        this.turnLightOn(3);

        this.webcam = document.getElementById('webcam');
        this.canvas = document.getElementById('webcamcanvas');
        this.gCtx = this.canvas.getContext('2d');

        this.backBuffer = document.createElement('canvas');
        this.bCtx = this.backBuffer.getContext('2d');

        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        navigator.getUserMedia({video:true}, function(localMediaStream) {control.callbackStreamIsReady(localMediaStream);}, function(err) {console.log(err);});

        setInterval(function() {
            control.setBulb();
        }, 200);

    },

    callbackStreamIsReady: function(stream) {

        this.webcam.src = URL.createObjectURL(stream);
        this.webcam.play();
        window.requestAnimationFrame(control.makeFrame);

    },

    makeFrame: function() {

        var w = 1;
        var h = 1;

        control.backBuffer.width = w;
        control.backBuffer.height = h;

        //  copy the image from the video into the background bugger
        control.bCtx.translate(w, 0);
        control.bCtx.scale(-1, 1);
        control.bCtx.drawImage(control.webcam, 0, 0, w, h);

        var pixels = control.bCtx.getImageData(0, 0, w, h);
        control.gCtx.putImageData(pixels, 0, 0);

        control.colour = {
            r: pixels.data[0],
            g: pixels.data[1],
            b: pixels.data[2]
        };

        control.hsb = control.rgb2hsb(control.colour.r, control.colour.g, control.colour.b);
        window.requestAnimationFrame(control.makeFrame);
    },

    setBulb: function() {

        if (control.colour === null) return;
        if (control.paused) return;

        var bulb = 1;
        if (control.flipBulb) bulb = 3;
        control.flipBulb = !control.flipBulb;

        control.setState(bulb, control.hsb.hue, control.hsb.sat, control.hsb.bri);

        $('.rgb').text('rgb: ' + control.colour.r + ',' + control.colour.g + ',' + control.colour.b);
        $('.hsb').text('hsb: ' + control.hsb.hue + ',' + control.hsb.sat + ',' + control.hsb.bri);

    },







    setState: function(lightNo, hue, sat, bri) {

        var url = 'http://' + control.ip + '/api/' +
            control.username + '/lights/' + lightNo + '/state';
        var params = {on: true, sat: sat, bri: bri, hue: hue};

        $.ajax({
            type: "PUT",
            url: url,
            contentType: "application/json",
            data: JSON.stringify(params)
        });

    },







    turnLightOn: function(lightNo) {

        var url = 'http://' + control.ip + '/api/' + control.username + '/lights/' + lightNo + '/state';
        //var url = 'http://' + control.ip + '/api/' + control.username + '/groups/' + lightNo + '/action';
        var params = {on: true};

        $.ajax({
            type: "PUT",
            url: url,
            contentType: "application/json",
            data: JSON.stringify(params)
        });
    },

    turnLightOff: function(lightNo) {

        var url = 'http://' + control.ip + '/api/' + control.username + '/lights/' + lightNo + '/state';
        //var url = 'http://' + control.ip + '/api/' + control.username + '/groups/' + lightNo + '/action';
        var params = {on: false};

        $.ajax({
            type: "PUT",
            url: url,
            contentType: "application/json",
            data: JSON.stringify(params)
        });
    },


    rgb2hsb: function(r, g, b) {

        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {hue: Math.floor(h * 65535), sat: Math.floor(s * 255), bri: Math.floor(l * 255)};
    }


};