require.config({
    baseUrl: "js",
    paths: {
        'data': '../data'
    }
});

require(['level', 'scene', 'screen', 'resource'], function (Level, Scene, Screen, ResourceManager) {
    "use strict";

    var splash = new Screen('splash');
    splash.display();

    // Load the title screen music and play it.
    var title_theme = new buzz.sound('sound/title_theme.ogg');
    title_theme.loop().play();

    var resManager = new ResourceManager();

    var startLevel = function (levelIndex) {
        var level = new Level(levelIndex);
        level.load(function () {
            var scene = new Scene(level);
            scene.init();
        });
    }

    resManager.preload(function () {
        var title = new Screen('title');
        splash.hide();
        title.display(function () {
            var credits = new Screen('credits');
            credits.display(function () {
                var tutorial = new Screen('tutorial');
                tutorial.display(function () {
                    title_theme.stop();
                    startLevel(2);
                });
            });
        });
    });
});
