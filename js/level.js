define(['lib/jquery', 'riddles', 'gardians'], function (jquery, Riddles, Gardians) {
    var Level = function (levelNum) {
        this.dataDir = 'data/';
        this.levelDir = this.dataDir + 'lvl' + levelNum + '/';
    }

    Level.prototype.load = function (callback) {
        this.callback = callback;

        this.resourcesToLoad = 3;
        this.loaded = 0;

        var self = this;

        $.getJSON(this.levelDir + 'map.json', function (data) {
            self.map = data.map;
            self.height = self.map.length;
            self.width = self.map[0].length;

            self.objects = data.objects;
            self.properties = data.properties;

            self.loadedResource();
        });
        $.getJSON(this.levelDir + 'riddles.json', function (data) {
            self.riddles = new Riddles(data.enigmas);
            self.loadedResource();
        });
        $.getJSON(this.dataDir + 'gardians.json', function (data) {
            self.gardians = new Gardians(data);
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
