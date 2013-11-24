require.config({
    baseUrl: "js",
    paths: {
        'data': '../data'
    }
});

require(['level', 'scene', 'screen'], function (Level, Scene, Screen) {
    "use strict";

    var splash = new Screen('splash');
    splash.display();

    var lvl1 = new Level(2);
    lvl1.load(function () {
        var title = new Screen('title');
        splash.hide();
        title.display(function () {
            var credits = new Screen('credits');
            credits.display(function () {
                var tutorial = new Screen('tutorial');
                tutorial.display(function () {
                    var scene = new Scene(lvl1);
                    scene.init();
                });
            });
        });
    });
});
