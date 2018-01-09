var audio_context;
var recorder;
var hasGottenPermission = false;

$(document).ready(function() {
    $('#start-recording').on('click', startRecording);
    $('#stop-recording').on('click', stopRecording);
});

function startRecording() {
    if(!hasGottenPermission) {
        initializeRecording();
        return;
    }
    recorder && recorder.record();
}

function stopRecording() {
    recorder && recorder.stop();

    recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        console.log(url);
    });

    recorder.clear();
}

function initializeRecording() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.URL = window.URL || window.webkitURL;

        /*
        navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia ||
                       navigator.mediaDevices.getUserMedia);
        */

        audio_context = new AudioContext;
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        console.log('No web audio support in this browser!');
    }

    navigator.mediaDevices.getUserMedia({audio: true})
        .then(function(stream) { // Success
            var input = audio_context.createMediaStreamSource(stream);
            recorder = new Recorder(input);
            hasGottenPermission = true;
            startRecording();
        }).catch(function(e) { // Failure
            console.log('No live audio input: ' + e);
        });
}