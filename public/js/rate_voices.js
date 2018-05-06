
var currentRecordingRating = null;
var currentRecordingRatingCount = null;
var currentFileName = null;
var currentRecordingBuffer = null;

var context;    // Audio context
var buf;        // Audio buffer

$(document).ready(function() {

    if (!window.AudioContext) {
        if (!window.webkitAudioContext) {
            console.log('Your browser does not support any AudioContext and cannot play back this audio.');
            return;
        }
        window.AudioContext = window.webkitAudioContext;
    }

    context = new AudioContext();

    getNextRecording();

    $('.rate-voice-btn').on('click', function() {
        var usersRating = parseInt($(this).attr('data-rate-val'));
        sendRating(usersRating)
    });

    $('#play-voice').on('click', playRecording);
});

function getNextRecording() {
    $('#play-voice').addClass('disabled');
    $('.rate-voice-btn').addClass('disabled');

    fetch('/api/recordings/next')
    .then(req_status)
    .then(req_json)
    .then(function(data) {
        console.log(data);
        if(data) {
            currentFileName = data.file_name;
            currentRecordingRating = !data.rating ? 0 : parseInt(data.rating);
            currentRecordingRatingCount = !data.rating_amount ? 0 : parseInt(data.rating_amount);

            $('#transcription').text(data.transcription_text);
            loadAudio(data.file.Body.data);
        } else {
            $('#transcription').text('Could not get a text at the moment, please try again later!');
        }
    }).catch(function(error) {
        currentRecordingRating = null;
        currentRecordingRatingCount = null;
        currentFileName = null;
        currentRecordingBuffer = null;

        $('#transcription').text('Could not get a text at the moment, please try again later!');
    });
}

function sendRating(uRating) {
    var newRating = (currentRecordingRatingCount * currentRecordingRating + uRating) / (currentRecordingRatingCount + 1);

    var data = {
        file_name : currentFileName,
        new_rating : newRating
    };

    console.log(data);

    fetch('api/recording/rate', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
    .then(req_status)
    .then(req_json)
    .then(function(data) {
        getNextRecording();
    }).catch(function(error) {
    });
}

function loadAudio( bytes ) {
    var buffer = new Uint8Array( bytes.length );
    buffer.set( new Uint8Array(bytes), 0 );

    context.decodeAudioData(buffer.buffer, function(audioBuffer) {
        currentRecordingBuffer = audioBuffer;
        $('#play-voice').removeClass('disabled');
        $('.rate-voice-btn').removeClass('disabled');
    }, function(error) {
        console.log(error);
    });
}

function playRecording( ) {
    var source = context.createBufferSource();
    source.buffer = currentRecordingBuffer;
    source.connect( context.destination );
    source.start(0);
}
