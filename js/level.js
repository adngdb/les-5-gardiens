define(['lib/jquery', 'riddles'], function (jquery, Riddles) {
    var Level = function (levelNum) {
        this.levelDir = 'data/lvl' + levelNum + '/';
    }

    Level.prototype.load = function (callback) {
        this.callback = callback;

        this.resourcesToLoad = 2;
        this.loaded = 0;

        var self = this;

        $.getJSON(this.levelDir + 'map.json', function (data) {
            self.map = data;
            self.height = data.length;
            self.width = data[0].length;

            self.loadedResource();
        });
        $.getJSON(this.levelDir + 'riddles.json', function (data) {
            self.riddles = new Riddles(data.enigmas);
            self.loadedResource();
        });
    }

    Level.prototype.loadedResource = function () {
        this.loaded +=1;

        if (this.loaded >= this.resourcesToLoad) {
            // All resources are loaded.
            this.callback();
        }
    }

    return Level;
});
