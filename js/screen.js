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
        $('<img>', { src: 'img/screen/splash.png' }).appendTo(this.container);
    };

    Screen.prototype.displayCredits = function (next) {
        var self = this;

        var img = $('<img>', { src: 'img/screen/credits.png' }).appendTo(this.container);
        img.click(function (e) {
            e.preventDefault();
            self.hide();
            next();
        });
    };

    Screen.prototype.displayTutorial = function (next) {
        var self = this;

        var img = $('<img>', { src: 'img/screen/tutorial.png' }).appendTo(this.container);
        img.click(function (e) {
            e.preventDefault();
            self.hide();
            next();
        });
    };

    Screen.prototype.hide = function () {
        this.container.empty();
        this.container.hide();
    };

    return Screen;
});
