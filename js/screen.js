define(['lib/jquery'], function () {
    var Screen = function (name) {
        this.name = name;

        this.container = $('#screen');
    };

    Screen.prototype.display = function (next) {
        if (this.name == 'title') {
            this.displayTitle(next);
        }
        else if (this.name == 'splash') {
            this.displaySplash(next);
        }
        else if (this.name == 'credits') {
            this.displayCredits(next);
        }
        else if (this.name == 'tutorial') {
            this.displayTutorial(next);
        }
        else if (this.name == 'end-game') {
            this.displayEndGame(next);
        }
        else if (this.name == 'fade-to-black') {
            this.displayFadeToBlack(next);
        }

        this.container.show();
    };

    Screen.prototype.displayTitle = function (next) {
        var self = this;

        $('<img>', { src: 'img/screen/title-1.png' }).appendTo(this.container);
        var titleImg = $('<img>', { src: 'img/screen/title-2.png', class: 'blink' }).appendTo(this.container);

        titleImg.click(function (e) {
            e.preventDefault();
            self.hide();
            next();
        });
    };

    Screen.prototype.displaySplash = function (next) {
        $('<img>', { src: 'img/screen/splash_01.png' }).appendTo(this.container);
        $('<img>', { src: 'img/screen/splash_02.png', class: 'blink' }).appendTo(this.container);
    };

    Screen.prototype.displayCredits = function (next) {
        var self = this;

        $('<img>', { src: 'img/screen/credits_01.png' }).appendTo(this.container);
        var img = $('<img>', { src: 'img/screen/credits_02.png', class: 'blink' }).appendTo(this.container);
        img.click(function (e) {
            e.preventDefault();
            self.hide();
            next();
        });
    };

    Screen.prototype.displayTutorial = function (next) {
        var self = this;

        $('<img>', { src: 'img/screen/tutorial_01.png' }).appendTo(this.container);
        var img = $('<img>', { src: 'img/screen/tutorial_02.png', class: 'blink' }).appendTo(this.container);
        img.click(function (e) {
            e.preventDefault();
            self.hide();
            next();
        });
    };

    Screen.prototype.displayFadeToBlack = function (next) {
        $('<div>', { class: 'fade-to-black' }).hide().appendTo(this.container).fadeIn(3000, next);
    };

    Screen.prototype.displayEndGame = function (next) {
        $('<img>', { src: 'img/screen/end-game.png' }).appendTo(this.container);
    };

    Screen.prototype.hide = function () {
        this.container.empty();
        this.container.hide();
    };

    return Screen;
});
