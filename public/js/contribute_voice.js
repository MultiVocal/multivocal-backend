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

    console.log('Recording');
    $('#start-recording').prop('disabled', true);
    $('#stop-recording').prop('disabled', false);
    recorder && recorder.record();
    //microphone.start();
}

function stopRecording() {
    console.log(recorder);
    if(recorder && recorder.recording) {

        $('#stop-recording').prop('disabled', true);
        $('#start-recording').prop('disabled', false);

        recorder && recorder.stop();

        uploadRecording();

        recorder.clear();
    }
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

function uploadRecording() {

    recorder && recorder.exportWAV(function(blob) {
        file = blob;

        var data = {
            file : file,
            transcription_id : '',
            client_id : '',
            notes : []
        };

        console.log(data);

        return;

        sendToPath('post', '/recording', data, function (error, response) {
            console.log(error);
            console.log(response);
        });
    });

}

function createDownloadLink() {
    recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        var li = document.createElement('li');
        var au = document.createElement('audio');
        var hf = document.createElement('a');

        au.controls = true;
        au.src = url;
        hf.href = url;
        hf.download = new Date().toISOString() + '.wav';
        hf.innerHTML = hf.download;
        li.appendChild(au);
        li.appendChild(hf);
        $('#recordings').append(li);
    });
}