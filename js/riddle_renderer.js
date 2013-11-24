define(['lib/jquery', 'tools'], function (jquery, tools) {
    var RiddleRenderer = function (riddle, gardian, onSuccess, onFailure) {
        this.riddle = riddle;
        this.gardian = gardian;
        this.onSuccessCallback = onSuccess;
        this.onFailureCallback = onFailure;

        this.container = $('#riddle-container');
    };

    RiddleRenderer.prototype.display = function () {
        var self = this;

        // First clean the container to remove previous riddles.
        this.container.empty();

        var gardianElt = $('<div>', { class: 'gardian' }).appendTo(this.container);
        $('<img>', { src: 'img/' + this.gardian.file + '_01.png' }).appendTo(gardianElt);

        var gardianTextElt = $('<div>', { class: 'gardian-text' }).appendTo(this.container);
        $('<p>', { class: 'gardian_desc' }).text(this.gardian.description).appendTo(gardianTextElt);
        $('<p>', { class: 'gardian_question' }).text(this.gardian.question_text).appendTo(gardianTextElt);

        var riddleElt = $('<div>', { class: 'riddle' }).appendTo(this.container);
        $('<p>', { class: 'riddle_text' }).text(this.riddle.text).appendTo(riddleElt);
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

        this.container.fadeIn(500);
    };

    RiddleRenderer.prototype.hide = function () {
        this.container.fadeOut(500);
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
