require.config({
    baseUrl: "js",
    paths: {
        'data': '../data'
    }
});

require(['level', 'scene', 'screen', 'resource', 'lib/stats'], function (Level, Scene, Screen, ResourceManager, _stats) {
    "use strict";

    var splash = new Screen('splash');
    splash.display();

    // Load the title screen music and play it.
    var titleTheme = new buzz.sound('sound/title_theme.ogg');
    titleTheme.loop().play();

    var scene = new Scene();
    var resManager = scene.resman;

    var lastLevel = 5;

    var endGame = function () {
        // GG WP.
        var end = new Screen('end-game');
        end.display();
        var endTheme = new buzz.sound('sound/end_level_theme.ogg');
        endTheme.loop().play();
    };

    var startLevel = function (levelIndex) {
        var level = new Level(levelIndex);
        level.load(function () {
            if (levelIndex >= lastLevel) {
                // The player reached the end of the game.
                scene.onEnd(endGame);
            }
            else {
                scene.onEnd(function () {
                    startLevel(levelIndex + 1);
                });
            }
            scene.init(level);
        });
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

    // this.stats = new Stats();
    // var container = document.createElement('div');
    // document.body.appendChild(container);
    // this.stats.domElement.style.position = 'absolute';
    // this.stats.domElement.style.top = '0px';
    // container.appendChild(this.stats.domElement);
});
