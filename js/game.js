require.config({
    baseUrl: "js",
    paths: {
        'data': '../data'
    }
});

require(['level', 'scene'], function (Level, Scene) {
    "use strict";

    var lvl = new Level(1);
    lvl.load(function () {
        // The level is loaded and has its map and riddles.
        // Create a new Scene object, and pass it the level, then start it.
        var scene = new Scene(lvl);
        scene.init();
    });
});
