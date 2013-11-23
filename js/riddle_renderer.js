define(['lib/jquery', 'tools'], function (jquery, tools) {
    var RiddleRenderer = function (riddle, onSuccess, onFailure) {
        this.riddle = riddle;
        this.onSuccessCallback = onSuccess;
        this.onFailureCallback = onFailure;

        this.container = $('#riddle-container');
    };

    RiddleRenderer.prototype.display = function () {
        var self = this;

        var riddleElt = $('<div>', { class: 'riddle' }).appendTo(this.container);
        var riddleTextElt = $('<p>').text(this.riddle.text).appendTo(riddleElt);
        var riddleAnswersElt = $('<div>', { class: 'answers' }).appendTo(riddleElt);

        var orderOfRiddles = [];
        for (var i = 0; i < this.riddle.answers.length; i++) {
            orderOfRiddles.push(i);
        }
        tools.shuffleArray(orderOfRiddles);

        for (var i = orderOfRiddles.length - 1; i >= 0; i--) {
            var index = orderOfRiddles[i];
            var answer = this.riddle.answers[index];
            var answerElt = $('<div>', { class: 'answer' });
            answerElt.text(answer);
            answerElt.click(function (e) {
                e.preventDefault();

                self.answerRiddle($(this).text());
            });
            answerElt.appendTo(riddleAnswersElt);
        };
    };

    RiddleRenderer.prototype.hide = function () {
        this.container.empty();
    };

    RiddleRenderer.prototype.answerRiddle = function (answer) {
        if (answer == this.riddle.answers[0]) {
            // The correct answer is always the first one in the list.
            this.onSuccessCallback();
        }
        else {
            this.onFailureCallback();
        }
        this.hide();
    };

    return RiddleRenderer;
});
