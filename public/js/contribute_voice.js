var audio_context;
var recorder;
var hasGottenPermission = false;

var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'violet',
    progressColor: 'purple'
});

/*
var microphone = Object.create(WaveSurfer.Microphone);

microphone.init({
    wavesurfer: wavesurfer
});
*/

$(document).ready(function() {

    getTranscription();

    $('body').on('click', '#toggle-recording[data-action="start"]', startRecording);
    $('body').on('click', '#toggle-recording[data-action="stop"]', stopRecording);

});

function getTranscription() {

    $('#transcription').text('Loading text...');
    $('#toggle-recording').addClass('disabled');

    fetch('/transcriptions')
    .then(req_status)
    .then(req_json)
    .then(function(data) {
        if(data.message && data.message[0].transcription_text) {
            $('#transcription').text(data.message[0].transcription_text);
            $('#toggle-recording').removeClass('disabled');
        } else {
            $('#transcription').text('Could not get a text at the moment, please try again later!');
        }
    }).catch(function(error) {
        $('#transcription').text('Could not get a text at the moment, please try again later!');
    });
}

function startRecording() {
    if ($('#toggle-recording').hasClass('disabled')) return;
    $('#contribute-thankyou').hide();

    if(!hasGottenPermission) {
        initializeRecording();
        return;
    }

    $('#toggle-recording').attr('data-action', 'stop').text('Stop');
    recorder && recorder.record();
    //microphone.start();
}

function stopRecording() {
    if ($('#toggle-recording').hasClass('disabled')) return;

    if(recorder && recorder.recording) {

        $('#contribute-thankyou').show();

        recorder && recorder.stop();
        //microphone.stop();
        uploadRecording();
        recorder.clear();

        $('#toggle-recording').attr('data-action', 'start').text('Record');
        getTranscription();
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

        /*
        sendToPath('post', '/api/recording', data, function (error, response) {
            if(error) {
                console.log(error);
            } else {
                console.log(response);
            }
        });
        */
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