
var currentRecordingRating = null;
var currentRecordingRatingCount = null;
var currentFileName = null;

$(document).ready(function() {

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
            $('#toggle-recording').removeClass('disabled');
            $('.rate-voice-btn').removeClass('disabled');
        } else {
            $('#transcription').text('Could not get a text at the moment, please try again later!');
        }
    }).catch(function(error) {
        currentRecordingRating = null;
        currentRecordingRatingCount = null;
        currentFileName = null;
        $('#transcription').text('Could not get a text at the moment, please try again later!');
    });

    $('.rate-voice-btn').on('click', function() {
        var usersRating = parseInt($(this).attr('data-rate-val'));
        sendRating(usersRating)
    });
});

function sendRating(uRating) {
    var newRating = (currentRecordingRatingCount * currentRecordingRating + uRating) / (currentRecordingRatingCount + 1);

    var data = {
        file_name : currentFileName,
        new_rating : newRating
    };

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
    }).catch(function(error) {
    });
}

