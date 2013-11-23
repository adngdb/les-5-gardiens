define(['lib/jquery'], function () {
    var Screen = function (name) {
        this.name = name;

        this.container = $('#screen');
    };

    Screen.prototype.display = function () {
        if (this.name == 'title') {
            this.displayTitle();
        }
    };

    Screen.prototype.displayTitle = function () {
    };

    Screen.prototype.hide = function () {
        this.container.empty();
    };

    return Screen;
});
