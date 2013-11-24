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
        this.enable();


        var riddleElt = $('<div>', { class: 'riddle' }).appendTo(this.container);
        $('<p>', { class: 'gardian_desc' }).text(this.gardian.description).appendTo(riddleElt);
        $('<p>', { class: 'gardian_question' }).text(this.gardian.question_text).appendTo(riddleElt);
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

                $(this).addClass('selected');
                self.answerRiddle($(this).text());
            });
            answerElt.appendTo(riddleAnswersElt);
        };

        this.container.fadeIn(500);
    };

    RiddleRenderer.prototype.hide = function () {
        this.container.fadeOut(500);
    };

    RiddleRenderer.prototype.disable = function () {
        $('.answer', this.container).unbind('click');
        this.container.addClass('disabled')
    };

    RiddleRenderer.prototype.enable = function () {
        this.container.removeClass('disabled')
    };

    RiddleRenderer.prototype.answerRiddle = function (answer) {
        // Block the form so it's impossible to click anything.
        this.disable();

        if (answer == this.riddle.answers[0]) {
            // The correct answer is always the first one in the list.
            this.onSuccessCallback();
        }
        else {
            this.onFailureCallback();
        }
    };

    return RiddleRenderer;
});
