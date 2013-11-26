define(['lib/three', 'lib/FirstPersonControls', 'riddle_renderer', 'resource', 'tools', 'screen'],
function(three,       first_person_controls,     RiddleRenderer,    ResourceManager,    tools, Screen) {
    var Scene = function (level) {
        this.level = level;
        this.pause = false;

        this.gardiansMap = [];
        for (var i = 0; i < this.level.map.length; i++) {
            this.gardiansMap[i] = [];
            for (var j = 0; j < this.level.map[0].length; j++) {
                this.gardiansMap[i][j] = 0;
            }
        }
    };

    // var Sound = function ( sources, radius, volume, loop=false ) {
    //     var audio = document.createElement( 'audio' );
    //     for ( var i = 0; i < sources.length; i ++ ) {
    //         var source = document.createElement( 'source' );
    //         source.src = sources[ i ];
    //         audio.appendChild( source );
    //         audio.loop = loop;
    //     }

    //     this.position = new THREE.Vector3();

    //     this.play = function () {
    //         audio.play();
    //     }

    //     this.update = function ( camera ) {
    //         var distance = this.position.distanceTo( camera.position );
    //         if ( distance <= radius ) {
    //             audio.volume = volume * ( 1 - distance / radius );
    //         } else {
    //             audio.volume = 0;
    //         }
    //     }
    // }

    var CUBE_SIZE = 200; //px

    Scene.prototype.init = function () {
        this.scene = new THREE.Scene();

        this.gameEnded = false;

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = CUBE_SIZE * this.level.objects.entrance[1];
        this.camera.position.y = 0;
        this.camera.position.z = CUBE_SIZE * this.level.objects.entrance[0];

        this.controls = new THREE.FirstPersonControls( this.camera );

        this.controls.lon = this.level.properties.startLon;
        this.controls.movementSpeed = 500;
        this.controls.lookSpeed = 10.0;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = false;

        this.clock = new THREE.Clock();

        this.scene.fog = new THREE.Fog( 0x000000, 1, CUBE_SIZE*5 );
        this.scene.add( new THREE.AmbientLight( 0x888888 ) );
        //this.scene.add( new THREE.AmbientLight( 0xffffff ) );
        this.torchLight = new THREE.PointLight( 0xffffff, 1, CUBE_SIZE*2 );
        this.scene.add(this.torchLight);

        this.renderer = new THREE.WebGLRenderer({antialias:true});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0x000000, 1 );
        //this.renderer.setFaceCulling(false);

        this.projector = new THREE.Projector();
        this.raycaster = new THREE.Raycaster();
        this.INTERSECTED;

        this.queueMovement = [];

        this.animCounter = 0;
        this.pnjArray = [];
        this.indiceMeshGround = null;

        // array with the direction toward the exit for every tile
        this.arrayTowardExit = [];
        for (var i=0; i<this.level.height; ++i) {
            var line = [];
            for (var j=0; j<this.level.width; ++j) {
                line.push([0,0]);
            }
            this.arrayTowardExit.push(line);
        }

        var resman = new ResourceManager();
        this.resourceManager = resman.getResMan();
        this.resourceManager['cube_size'] = CUBE_SIZE; // remove that and all is lost
        this.resourceManager['renderer'] = this.renderer; // remove that and all is lost
        resman.loadAll();

        // sounds
        this.music = {};
        this.music.mainTheme = new buzz.sound("sound/main_theme.ogg");
        this.music.secondTheme = new buzz.sound("sound/title_theme.ogg");
        this.music.riddleTheme = new buzz.sound("sound/riddle_theme.ogg");
        this.music.endTheme = new buzz.sound("sound/end_level_theme.ogg");
        this.music.eventStress = new buzz.sound("sound/event_stress.ogg");

        this.music.mainTheme.loop().play();

        this.sound = {};
        this.sound.riddleEnd = new buzz.sound("sound/event_riddle_end.ogg");
        this.sound.doorOpening = new buzz.sound("sound/door_opening.ogg");
        this.sound.doorBanging = new buzz.sound("sound/door_banging.ogg");

        var exit = this.level.objects.exit;
        var entrance = this.level.objects.entrance;

        for (var j = 0; j < this.level.height; ++j) {
            for (var i = 0; i < this.level.width; ++i) {

                // wall
                if (this.level.map[i][j]) {
                    // geometry = new THREE.CubeGeometry( CUBE_SIZE, CUBE_SIZE, CUBE_SIZE );
                    // material = new THREE.MeshBasicMaterial({
                    //     color: 0xff0000 + i * (255 / this.level.height) + j * (255/this.level.width) * 256,
                    //     wireframe: false
                    // });
                    //var mesh = this.resourceManager['mesh_wall'];
                    if (exit[0] == j && exit[1] == i) { ///!!!! POPO : ??? exit[0] in J => 1st coord Z ? and 2nd coord X ?? sure ?
                        // This is the exit, show a door on each face.
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.name = "exit";
                        mesh.position.x = i * CUBE_SIZE;
                        mesh.position.z = (j+0.52) * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = 0;
                        this.scene.add( mesh );
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.name = "exit";
                        mesh.position.x = i * CUBE_SIZE;
                        mesh.position.z = (j-0.52) * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = Math.PI;
                        this.scene.add( mesh );
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.name = "exit";
                        mesh.position.x = (i-0.52) * CUBE_SIZE;
                        mesh.position.z = j * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = -Math.PI*0.5;
                        this.scene.add( mesh );
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.name = "exit";
                        mesh.position.x = (i+0.52) * CUBE_SIZE;
                        mesh.position.z = j * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = Math.PI*0.5;
                        this.scene.add( mesh );
                    }

                    mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_wall'] );
                    mesh.name = "wall";
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    this.scene.add( mesh );
                }
                else
                {
                    // floor
                    //var mesh = this.resourceManager['mesh_floor'];
                    //var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_floor'].clone() );
                    var mesh = new THREE.Mesh( this.resourceManager['quad_geom'], this.resourceManager['mat_floor'].clone() );
                    mesh.name = "floor";
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    mesh.position.y = -CUBE_SIZE*0.5;
                    mesh.rotation.x = -Math.PI*0.5;
                    this.scene.add( mesh );

                    // roof
                    //var mesh = this.resourceManager['mesh_roof'];
                    //mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_roof'] );
                    mesh = new THREE.Mesh( this.resourceManager['quad_geom'], this.resourceManager['mat_roof'] );
                    mesh.name = "roof";
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    mesh.position.y = CUBE_SIZE*0.5;
                    mesh.rotation.x = Math.PI*0.5;
                    this.scene.add( mesh );

                    // light test
                    // var sprite2 = new THREE.Sprite( this.resourceManager['mat_light'] );
                    // sprite2.position.set( i * CUBE_SIZE, 100, j * CUBE_SIZE );
                    // sprite2.scale.set( 64, 64, 1.0 ); // imageWidth, imageHeight
                    // this.scene.add( sprite2 );
                    if((i+j) % 2) {
                        mesh = new THREE.Mesh( this.resourceManager['light_geom'], this.resourceManager['mat_light'] );
                        mesh.position.x = i * CUBE_SIZE;
                        mesh.position.z = j * CUBE_SIZE;
                        mesh.position.y = CUBE_SIZE/2.1;
                        mesh.rotation.x = Math.PI/2;
                        this.scene.add( mesh );

                        // var light = new THREE.PointLight( 0xffffff, 1, CUBE_SIZE*1.5 );
                        // light.position.set( i * CUBE_SIZE, CUBE_SIZE/2.5, j * CUBE_SIZE );
                        // this.scene.add( light );
                    }

                    // random prop
                    if(i>0 && i<this.level.width && j>0 && j<this.level.height) {
                        //console.log("i : "+i+", j : "+j);

                        // test left
                        if(this.level.map[i-1][j]) {

                        }
                        // test right
                        if(this.level.map[i+1][j]) {

                        }
                        // test up
                        if(this.level.map[i][j+1]) {

                        }
                        // test down
                        if(this.level.map[i][j-1]) {

                        }
                    }

                    // pnj
                    if(this.detectCrossroad(i * CUBE_SIZE, j * CUBE_SIZE)) {

                        var gardian = this.level.gardians.getRandomGardian();
                        this.gardiansMap[i][j] = gardian;

                        var sprite;
                        sprite = new THREE.Sprite( this.resourceManager["mat_"+gardian.file+"_question"] );
                        sprite.name = "tip_"+gardian.file;
                        sprite.position.set( i * CUBE_SIZE, -40, j * CUBE_SIZE );
                        sprite.scale.set( gardian.width, gardian.height, 1.0 ); // imageWidth, imageHeight
                        this.scene.add( sprite );

                        sprite = new THREE.Sprite( this.resourceManager["mat_"+gardian.file+0] );
                        sprite.name = "pnj_"+gardian.file;
                        sprite.position.set( i * CUBE_SIZE, -40, j * CUBE_SIZE );
                        sprite.scale.set( gardian.width, gardian.height, 1.0 ); // imageWidth, imageHeight
                        this.scene.add( sprite );

                        // curtain
                        // mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_curtain"] );
                        // mesh.name = "curtain";
                        // mesh.position.x = i * CUBE_SIZE;
                        // mesh.position.z = j * CUBE_SIZE;
                        // //mesh.position.y = CUBE_SIZE*0.5;
                        // //mesh.rotation.x = Math.PI*0.5;
                        // this.scene.add( mesh );

                        // mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_curtain"] );
                        // mesh.name = "curtain";
                        // mesh.position.x = i * CUBE_SIZE;
                        // mesh.position.z = (j+0.5) * CUBE_SIZE;
                        // mesh.position.y = 0;
                        // mesh.rotation.y = 0;
                        // this.scene.add( mesh );
                        // mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_curtain"] );
                        // mesh.name = "curtain";
                        // mesh.position.x = i * CUBE_SIZE;
                        // mesh.position.z = (j-0.5) * CUBE_SIZE;
                        // mesh.position.y = 0;
                        // mesh.rotation.y = Math.PI;
                        // this.scene.add( mesh );
                        // mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_curtain"] );
                        // mesh.name = "curtain";
                        // mesh.position.x = (i-0.5) * CUBE_SIZE;
                        // mesh.position.z = j * CUBE_SIZE;
                        // mesh.position.y = 0;
                        // mesh.rotation.y = -Math.PI*0.5;
                        // this.scene.add( mesh );
                        // mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_curtain"] );
                        // mesh.name = "curtain";
                        // mesh.position.x = (i+0.5) * CUBE_SIZE;
                        // mesh.position.z = j * CUBE_SIZE;
                        // mesh.position.y = 0;
                        // mesh.rotation.y = Math.PI*0.5;
                        // this.scene.add( mesh );
                    }
                }
            };
        };

        document.body.appendChild( this.renderer.domElement );

        this.animate();
    };

    Scene.prototype.addRandomProp = function () {

    }

    Scene.prototype.findIntersections = function () {
        // find intersections
        var vector = new THREE.Vector3( this.controls.mouseNormX, this.controls.mouseNormY  , 1 );
        this.projector.unprojectVector( vector, this.camera );

        this.raycaster.set( this.camera.position, vector.sub( this.camera.position ).normalize() );

        var intersects = this.raycaster.intersectObjects( this.scene.children );

        if ( intersects.length > 0 ) {
            var i = 0;
            var obj = null;

            for(i=0; i<intersects.length; ++i) {
                var tmpObj = intersects[i].object;

                if(tmpObj.name == "exit" || tmpObj.name == "floor" || tmpObj.name == "wall") {
                    obj = tmpObj;
                    break;
                }
            }
            // skip sprites
            // while(i < intersects.length && (intersects[ i ].object instanceof THREE.Sprite || intersects[ i ].object.position.y == -CUBE_SIZE*0.4))
            // {
            //     ++i;
            // }
            // console.log("nbintersects : " + intersects.length);
            // console.log(intersects[0].distance);

            //if(intersects[ i ].object.position.y == -CUBE_SIZE*0.5) {
            if(obj) {
                // change selected cube, remove highligh on previous and set on new
                if ( this.INTERSECTED != obj ) {

                    if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );

                    this.INTERSECTED = obj;
                    this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
                    if (obj.name != "wall") this.INTERSECTED.material.emissive.setHex( 0x888888 );
                }
                //this.INTERSECTED = obj;

                // set target pos if we click
                if (this.controls.realClick) {
                    this.controls.realClick = false;
                    if (obj.name != "wall") {
                        this.setMovement(this.INTERSECTED.position);
                        // remove indice
                        if(this.indiceMeshGround && (this.queueMovement.length != 0)) {
                            this.scene.remove(this.indiceMeshGround);
                        }

                        // remove npc indice
                        for(var i=0; i<this.scene.children.length; ++i) {
                            var obj2 = this.scene.children[i];
                            if(obj.name.substring(0,3) == "tip") {
                                var style = obj2.name.substring(4);
                                obj2.material = this.resourceManager["mat_"+style+"_question"];
                                //console.log("mat_cerberus"+Math.floor(this.animCounter/10));
                            }
                        }

                        if(obj.name == "exit") {
                            this.endGame();
                        }
                    }
                }
                else {
                    /// WARNING : nothing to do here anymore
                }
            }
        }
        else { //
            if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
            //this.INTERSECTED = null;
        }
    };

    Scene.prototype.setMovement = function (target) {
        var oldIndI = Math.round(this.camera.position.x / CUBE_SIZE);
        var oldIndJ = Math.round(this.camera.position.z / CUBE_SIZE);
        var newIndI = Math.round(target.x / CUBE_SIZE);
        var newIndJ = Math.round(target.z / CUBE_SIZE);

        // check the validity of the target
        if ((Math.abs(newIndI - oldIndI) > 1) || (Math.abs(newIndJ - oldIndJ) > 1)) {
            // invalid movement : more than 1 tile away
            console.log("Invalid move : too far away !!!");
        } else if ((Math.abs(newIndI - oldIndI) == 1) && (Math.abs(newIndJ - oldIndJ) == 1)) {
            // invalid move : diagonal move
            console.log("Invalid move : diagonal move !!!");
        } else if (((newIndI - oldIndI) == 0) && ((newIndJ - oldIndJ) == 0)) {
            // invalid move : same tile
            console.log("Invalid move : same tile !!!");
        } else {
            // movement to the next tile
            this.addMovement(target);
        }

    }

    Scene.prototype.addMovement = function (target) {
        // add a list of movement to execute to go to the target tile
        var targetLon;
        var cameraPos = this.camera.position;
        while (this.controls.lon > 360) {
            this.controls.lon -= 360;
        }
        while (this.controls.lon < 0) {
            this.controls.lon += 360;
        }
        while (this.controls.lat > 360) {
            this.controls.lat -= 360;
        }
        if (cameraPos.z - target.z) {
            // movement along Z axis
            if (cameraPos.z - target.z > 0){ // -Z axis
                if (this.controls.lon < 90)
                    targetLon = -90;
                else
                    targetLon = 270;
            }else {                     // +Z axis
                if (this.controls.lon < 270)
                    targetLon = 90;
                else
                    targetLon = 450;
            }
        }else if (cameraPos.x - target.x) {
            // movement along X axis
            if (cameraPos.x - target.x > 0){ // -X axis
                targetLon = 180;
            }else {                     // +X axis
                if (this.controls.lon < 180)
                    targetLon = 0;
                else
                    targetLon = 360;
            }
        }
        // add rotation movement toward the target
        this.queueMovement.push(["rotation", [targetLon, 0]]);


        if (this.detectCrossroad(target.x, target.z)){
            // target tile = crossroad -> special movement for the riddle's UI
            this.queueMovement.push(["translation", [(target.x + cameraPos.x ) / 2, -60, (target.z + cameraPos.z ) / 2]]);
            this.queueMovement.push(["rotation", [targetLon + 30, 30]]);
            this.queueMovement.push(["rotation", [targetLon, 0]]);
        }else {
            if(this.detectRoadTurn(this.camera.position.x, this.camera.position.z))
                this.roadTurnEvent();
        }
        this.queueMovement.push(["translation", [target.x, 0, target.z]]);

    }

    Scene.prototype.executeMove = function() {
        // excute the current move (if needed)
        if (this.queueMovement.length != 0) {
            if (this.queueMovement[0][0] == "rotation") {
            // rotation queued
                this.executeRotation();
            }else if (this.queueMovement[0][0] == "translation") {
            // translation queued
                this.executeTranslation();
            }else { // should never happen : unkwnon key word
                console.log("unkwnon key word in queueMovement !!!");
                this.queueMovement.shift();
            }
        }
    }

    Scene.prototype.executeRotation = function () {
        if (Math.abs(this.queueMovement[0][1][0] - this.controls.lon) < 10) {
            // longitude close enough to the target : set to the target one
            this.controls.lon = this.queueMovement[0][1][0];
        }else {
            // slowly change the longitude toward the target
            if (this.queueMovement[0][1][0] > this.controls.lon) {
                this.controls.lon += 10;
            }else {
                this.controls.lon -= 10;
            }
        }
        if (Math.abs(this.queueMovement[0][1][1] - this.controls.lat) < 10) {
            // latitude close enough to the target : set to the target one
            this.controls.lat = this.queueMovement[0][1][1];
        }else {
            // slowly change the longitude toward the target
            if (this.queueMovement[0][1][1] > this.controls.lat) {
                this.controls.lat += 10;
            }else {
                this.controls.lat -= 10;
            }
        }
        // if arrived a target longitude and lattitude : remove queued move
        if (    (this.queueMovement[0][1][1] == this.controls.lat)
            &&  (this.queueMovement[0][1][0] == this.controls.lon)) {
            this.queueMovement.shift();
            if (this.controls.lat == 30)
                this.showRiddle(this.queueMovement[1][1][0] / CUBE_SIZE, this.queueMovement[1][1][2] / CUBE_SIZE);
        }
    }

    Scene.prototype.executeTranslation = function () {
        if (Math.abs(this.queueMovement[0][1][0] - this.camera.position.x) < 10) {
            // X position close enough to the target : set to the target one
            this.camera.position.x = this.queueMovement[0][1][0];
        }else {
            // slowly change the X position toward the target
            if (this.queueMovement[0][1][0] > this.camera.position.x) {
                this.camera.position.x += 10;
            }else {
                this.camera.position.x -= 10;
            }
        }
        if (Math.abs(this.queueMovement[0][1][1] - this.camera.position.y) < 10) {
            // Y position close enough to the target : set to the target one
            this.camera.position.y = this.queueMovement[0][1][1];
        }else {
            // slowly change the Y position toward the target
            if (this.queueMovement[0][1][1] > this.camera.position.y) {
                this.camera.position.y += 10;
            }else {
                this.camera.position.y -= 10;
            }
        }
        if (Math.abs(this.queueMovement[0][1][2] - this.camera.position.z) < 10) {
            // Z position close enough to the target : set to the target one
            this.camera.position.z = this.queueMovement[0][1][2];
        }else {
            // slowly change the Z position toward the target
            if (this.queueMovement[0][1][2] > this.camera.position.z) {
                this.camera.position.z += 10;
            }else {
                this.camera.position.z -= 10;
            }
        }
        // if arrived at target position : remove queued move
        if (    (this.queueMovement[0][1][0] == this.camera.position.x)
            &&  (this.queueMovement[0][1][1] == this.camera.position.y)
            &&  (this.queueMovement[0][1][2] == this.camera.position.z)) {
            this.queueMovement.shift();
        }
    }

    Scene.prototype.detectCrossroad = function (x , z) { // x, y abxolute world position
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        var nbAdjacentTile = 0;
        if (!this.level.map[currentIndI][currentIndJ + 1]) ++nbAdjacentTile;
        if (!this.level.map[currentIndI][currentIndJ - 1]) ++nbAdjacentTile;
        if (!this.level.map[currentIndI + 1][currentIndJ]) ++nbAdjacentTile;
        if (!this.level.map[currentIndI - 1][currentIndJ]) ++nbAdjacentTile;

        if (nbAdjacentTile > 2) {
            return true;
        }
        return false;
    };

    Scene.prototype.detectRoadTurn = function (x, z) {
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        if (   ((!this.level.map[currentIndI + 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ + 1]))
            || ((!this.level.map[currentIndI + 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ - 1]))
            || ((!this.level.map[currentIndI - 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ + 1]))
            || ((!this.level.map[currentIndI - 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ - 1])) ) {
            return true;
        }
        return false;
    };

    Scene.prototype.roadTurnEvent = function () {
        // Play some stressing music, only once every 5 turns in average.
        if (Math.random() < 0.2) {
            this.music.eventStress.play();
        }
    };

    Scene.prototype.showRiddle = function (i, j) {
        var self = this;

        // Pause the game.
        this.pause = true;

        // Start playing the riddle theme.
        buzz.all().stop();
        this.music.riddleTheme.loop().play();

        var gardian = this.gardiansMap[i][j];
        var riddle = this.level.riddles.getRandomRiddle();

        var riddleRenderer = new RiddleRenderer(
            riddle,
            gardian,
            // Success.
            function () {
                console.log('Success, Motherfucker.');
                var dir = self.getDirection(self.queueMovement[1][1][0], self.queueMovement[1][1][2], true);
                self.showHint(dir);
                self.stopRiddle(riddleRenderer);
            },
            // Failure.
            function () {
                console.log('You failed. Hard. ');
                var dir = self.getDirection(self.queueMovement[1][1][0], self.queueMovement[1][1][2], false);
                self.showHint(dir);
                self.stopRiddle(riddleRenderer);
            }
        );
        riddleRenderer.display();

        // compute the "exitMap" for the whole maze
        var stack = [];
        stack.push(this.level.objects.exit);
        this.computeDirectionTowardExit(stack, 0);
    };

    Scene.prototype.stopRiddle = function (riddleRenderer) {
        var self = this;

        // play riddle end sound
        this.sound.riddleEnd.play();

        // fade riddle theme to main theme
        this.music.riddleTheme.stop();

        // Randomly chose what theme to play.
        if (Math.random() < 0.5) {
            this.music.mainTheme.loop().play();
        }
        else {
            this.music.secondTheme.loop().play();
        }

        // at the end of the 3 seconds, fade out the UI
        setTimeout(function () {
            // start the game again
            self.pause = false;
            riddleRenderer.hide();
        }, 3000);

        // resume movement toward the center of the tile
        // this.resumeMovement();
    };

    Scene.prototype.showHint = function (hintDirectionAbs) {
        var currentIndI = Math.round(this.queueMovement[1][1][0] / CUBE_SIZE);
        var currentIndJ = Math.round(this.queueMovement[1][1][2] / CUBE_SIZE);
        var orient = [hintDirectionAbs[0] - currentIndI, hintDirectionAbs[1] - currentIndJ];
        var stringOrientGround;
        var orientGround = 0;
        var stringOrientNPC = "top";
        var targetCameraLon;
        if ((orient[0] == -1) && (orient[1] ==  0)) {
            targetCameraLon = 180;
            orientGround = Math.PI;
            stringOrientGround = "down";
        }
        if ((orient[0] ==  1) && (orient[1] ==  0)) {
            targetCameraLon = 0;
            orientGround = 0;
            stringOrientGround = "top";
        }
        if ((orient[0] ==  0) && (orient[1] == -1)) {
            targetCameraLon = 270;
            orientGround = -Math.PI*0.5;
            stringOrientGround = "right";
        }
        if ((orient[0] ==  0) && (orient[1] ==  1)) {
            targetCameraLon = 90;
            orientGround = Math.PI*0.5;
            stringOrientGround = "left";
        }
        if (targetCameraLon == this.controls.lon) stringOrientNPC = "top";
        if (Math.abs(targetCameraLon - this.controls.lon) == 180) stringOrientNPC = "down";
        if ((targetCameraLon - this.controls.lon ==  90) || (targetCameraLon - this.controls.lon == -270)) stringOrientNPC = "right";
        if ((targetCameraLon - this.controls.lon == -90) || (targetCameraLon - this.controls.lon ==  270)) stringOrientNPC = "left";

        // show hint GROUND :
        // arrow on the floor : tile at x = hintDirectionAbs[0], z = hintDirectionAbs[1]
        // arrow toward : "stringOrientGround" {top / down / left or right}

        //TODO : Popux' code !!! display the hinted texture on the floor !!! GOGOGO lasy man !!!!
        this.indiceMeshGround = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_tex_point"] );
        // console.log(hintDirectionAbs[0] * CUBE_SIZE);
        // console.log(hintDirectionAbs[1] * CUBE_SIZE);
        // console.log(hintDirectionAbs[0]);
        // console.log(hintDirectionAbs[1]);
        // console.log(stringOrientGround);
        // console.log(stringOrientNPC);
        this.indiceMeshGround.position.x = hintDirectionAbs[0] * CUBE_SIZE;
        this.indiceMeshGround.position.z = hintDirectionAbs[1] * CUBE_SIZE;
        this.indiceMeshGround.position.y = -CUBE_SIZE*0.4;
        this.indiceMeshGround.rotation.x = -Math.PI*0.5;
        //this.indiceMeshGround.rotation.y = orientGround;
        this.scene.add( this.indiceMeshGround );

        // show hint NPC :
        // arrow on the NPC's animation
        // arrow toward : "stringOrientNPC" {top / down / left or right}

        //TODO : Adrian's code (<--- fuck him) !!! display the hinted texture on the NPC !!! GOGOGO lazy man !!!!
        for(var i=0; i<this.scene.children.length; ++i) {
            var obj = this.scene.children[i];
            if(obj.name.substring(0,3) == "tip") {
                var style = obj.name.substring(4);
                obj.material = this.resourceManager["mat_"+style+"_"+stringOrientNPC];
                //console.log("mat_cerberus"+Math.floor(this.animCounter/10));
            }
        }
    };

    Scene.prototype.getDirection = function (x, z, answer) {
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        var hintDirectionAbs = [];
// console.log("current pos");
// console.log(x);
// console.log(z);
        hintDirectionAbs.push(currentIndI + this.arrayTowardExit[currentIndI][currentIndJ][0]);
        hintDirectionAbs.push(currentIndJ + this.arrayTowardExit[currentIndI][currentIndJ][1]);

        if (answer) {   // the correct answer was given
// console.log("next pos");
// console.log(hintDirectionAbs[0]);
// console.log(hintDirectionAbs[1]);

            return hintDirectionAbs;
        }else {         // a wrong answer was given
            var possibleDirection = [];
            var towardExit = this.arrayTowardExit[currentIndI][currentIndJ];
            if ((towardExit[0]!= -1) && (!this.level.map[currentIndI - 1][currentIndJ][0])) possibleDirection.push([-1, 0]);
            if ((towardExit[0]!=  1) && (!this.level.map[currentIndI + 1][currentIndJ][0])) possibleDirection.push([ 1, 0]);
            if ((towardExit[1]!= -1) && (!this.level.map[currentIndI][currentIndJ - 1][0])) possibleDirection.push([ 0,-1]);
            if ((towardExit[1]!=  1) && (!this.level.map[currentIndI][currentIndJ + 1][0])) possibleDirection.push([ 0, 1]);
            tools.shuffleArray(possibleDirection);
            hintDirectionAbs.push(currentIndI + possibleDirection[0][0]);
            hintDirectionAbs.push(currentIndJ + possibleDirection[0][1]);
            return hintDirectionAbs;
        }
    };

    Scene.prototype.resumeMovement = function () {
        // reset the targeted tile and resume movement
        this.targetPosX = this.saveTargetX;
        this.targetPosZ = this.saveTargetZ;
        this.targetLon = this.saveTargetLon;
        //
        this.stepLon = (this.targetLon - this.controls.lon) / this.nbStep;
        this.stepLat = (0 - this.controls.lat) / this.nbStep;
        this.stepTrX = (this.targetPosX - this.camera.position.x) / (2 * this.nbStep);
        this.stepTrZ = (this.targetPosZ - this.camera.position.z) / (2 * this.nbStep);
        this.count = 0;
    }

    Scene.prototype.computeDirectionTowardExit = function (stack, depth) {
        // current tile
        var curItem = stack.pop();
        // the road from its (potential) neighbor go toward the current tile
        if ((curItem[0] > 0)
            && (!this.arrayTowardExit[curItem[0] - 1][curItem[1]][0])
            && (!this.arrayTowardExit[curItem[0] - 1][curItem[1]][1])
            && (!this.level.map[curItem[0] - 1][curItem[1]])) {
            // the tile in [x - 1][y] is a tile
            this.arrayTowardExit[curItem[0] - 1][curItem[1]][0] = 1;
            this.arrayTowardExit[curItem[0] - 1][curItem[1]][1] = 0;
            stack.push([curItem[0] - 1, curItem[1]]);

        }
        if ((curItem[0] < this.level.height - 1)
            && (!this.arrayTowardExit[curItem[0] + 1][curItem[1]][0])
            && (!this.arrayTowardExit[curItem[0] + 1][curItem[1]][1])
            && (!this.level.map[curItem[0] + 1][curItem[1]])) {
            // the tile in [x + 1][y] is a tile
            this.arrayTowardExit[curItem[0] + 1][curItem[1]][0] = -1;
            this.arrayTowardExit[curItem[0] + 1][curItem[1]][1] = 0;
            stack.push([curItem[0] + 1, curItem[1]]);
        }
        if ((curItem[1] > 0)
            && (!this.arrayTowardExit[curItem[0]][curItem[1] - 1][0])
            && (!this.arrayTowardExit[curItem[0]][curItem[1] - 1][1])
            && (!this.level.map[curItem[0]][curItem[1] - 1])) {
            // the tile in [x-1][y] is a tile
            this.arrayTowardExit[curItem[0]][curItem[1] - 1][0] = 0;
            this.arrayTowardExit[curItem[0]][curItem[1] - 1][1] = 1;
            stack.push([curItem[0], curItem[1] - 1]);
        }
        if ((curItem[1] < this.level.width - 1)
            && (!this.arrayTowardExit[curItem[0]][curItem[1] + 1][0])
            && (!this.arrayTowardExit[curItem[0]][curItem[1] + 1][1])
            && (!this.level.map[curItem[0]][curItem[1] + 1])) {
            // the tile in [x-1][y] is a tile
            this.arrayTowardExit[curItem[0]][curItem[1] + 1][0] = 0;
            this.arrayTowardExit[curItem[0]][curItem[1] + 1][1] = -1;
            stack.push([curItem[0], curItem[1] +1]);
        }
        if (stack.length != 0){
            this.computeDirectionTowardExit(stack, ++depth);
        }
    };

    Scene.prototype.endGame = function () {
        var self = this;

        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        this.pause = true;
        console.log("End game, haha");

        // Play the door opening sound
        this.sound.doorOpening.play();

        // Fade to black
        var fade = new Screen('fade-to-black');
        fade.display(function () {
            // Play the door banging sound
            self.sound.doorBanging.play();

            // Show the end screen
            end = new Screen('end-game');
            fade.hide();
            end.display();
            self.music.endTheme.loop().play();
        });
    };

    // Scene.prototype.getCoordFromCamera = function () {
    //     var coord = [];
    //     coord[0] =
    //     coord[1]
    // }

    Scene.prototype.animate = function () {
        requestAnimationFrame( this.animate.bind(this) );

        // In pause mode, do nothing but wait until the pause mode is stopped.
        if (this.pause) {
            return;
        }

        this.animatePNJ();

        var delta = this.clock.getDelta(),
        time = this.clock.getElapsedTime() * 5;
        this.controls.update(delta);
//        this.checkPosition();
        this.executeMove();
        this.findIntersections();

        // update torch position
        this.torchLight.position.x = this.camera.position.x;
        this.torchLight.position.y = this.camera.position.y;
        this.torchLight.position.z = this.camera.position.z;

        this.render();
    };

    Scene.prototype.animatePNJ = function () {

        ++this.animCounter;
        if(this.animCounter >= 40) this.animCounter = 0;

        for(var i=0; i<this.scene.children.length; ++i) {
            var obj = this.scene.children[i];
            if(obj.name.substring(0,3) == "pnj") {
                var style = obj.name.substring(4);
                obj.material = this.resourceManager["mat_"+style+Math.floor(this.animCounter/10)];
                //console.log("mat_cerberus"+Math.floor(this.animCounter/10));
            }
        }
    }

    Scene.prototype.culling = function () {
        // for(var i=0; i<this.scene.children.length; ++i) {
        //     var v = new THREE.Vector2(this.scene.children[i].position.x - this.camera.position.x, this.scene.children[i].position.z - this.camera.position.z);
        //     if(v.dot(v) < 16000000000) {
        //         this.scene.children[i].visible = true;
        //     }
        //     else {
        //         this.scene.children[i].visible = false;
        //     }
        // }
    };

    Scene.prototype.render = function () {
        this.culling();
        this.renderer.render( this.scene, this.camera );
    };

    return Scene;
});
