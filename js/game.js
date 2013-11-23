require.config({
    baseUrl: "js",
    paths: {
        'data': '../data'
    }
});

require(['level', 'scene', 'screen'], function (Level, Scene, Screen) {
    "use strict";

    var lvl = new Level(2);
    lvl.load(function () {
        // The level is loaded and has its map and riddles.
        // Create a new Scene object, and pass it the level, then start it.
        var scene = new Scene(lvl);
        scene.init();
    });
});
