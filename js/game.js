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
    var titleTheme = new buzz.sound('sound/title_theme.ogg');
    titleTheme.loop().play();

    var resManager = new ResourceManager();

    var lastLevel = 5;

    var startLevel = function (levelIndex) {
        var level = new Level(levelIndex);
        level.load(function () {
            var scene = new Scene(level);
            scene.init();
            if (levelIndex >= lastLevel) {
                // The player reached the end of the game.
                scene.onEnd(endGame);
            }
            else {
                scene.onEnd(function () {
                    startLevel(levelIndex + 1);
                });
            }
        });
    };

    var endGame = function () {
        // GG WP.
        var end = new Screen('end-game');
        end.display();
        var endTheme = new buzz.sound('sound/end_level_theme.ogg');
        endTheme.loop().play();
    };

    resManager.preload(function () {
        var title = new Screen('title');
        splash.hide();
        title.display(function () {
            var credits = new Screen('credits');
            credits.display(function () {
                var tutorial = new Screen('tutorial');
                tutorial.display(function () {
                    titleTheme.stop();
                    startLevel(2);
                });
            });
        });
    });
});
