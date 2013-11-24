define(['lib/three', 'lib/FirstPersonControls', 'riddle_renderer', 'resource', 'tools'],
function(three,       first_person_controls,     RiddleRenderer,    ResourceManager,    tools) {
    var Scene = function (level) {
        this.level = level;
        this.pause = false;
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

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = CUBE_SIZE * this.level.objects.entrance[1];
        this.camera.position.y = 0;
        this.camera.position.z = CUBE_SIZE * this.level.objects.entrance[0];

        this.controls = new THREE.FirstPersonControls( this.camera );

        this.controls.lon = this.level.properties.startLon;
        this.controls.movementSpeed = 2000;
        this.controls.lookSpeed = 10.0;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = false;

        this.clock = new THREE.Clock();

        this.scene.fog = new THREE.Fog( 0x000000, 1, CUBE_SIZE*5 );
        this.scene.add( new THREE.AmbientLight( 0x222222 ) );
        //this.scene.add( new THREE.AmbientLight( 0xffffff ) );
        this.torchLight = new THREE.PointLight( 0xffffff, 1, CUBE_SIZE*1.5 );
        this.scene.add(this.torchLight);

        this.renderer = new THREE.WebGLRenderer({antialias:true});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0x000000, 1 );

        this.projector = new THREE.Projector();
        this.raycaster = new THREE.Raycaster();
        this.INTERSECTED;

        this.targetPosX = -5;
        this.targetPosZ = -5;
        this.stepLon;
        this.stepLat;
        this.stepTrX;
        this.stepTrZ;
        this.nbStep = 15;
        this.count = 3 * this.nbStep + 1;
        this.crossroadTested = true;

        this.animCounter = 0;
        this.pnjArray = [];

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
        this.music.riddleTheme = new buzz.sound("sound/riddle_theme.ogg");
        this.music.eventStress = new buzz.sound("sound/event_stress.ogg");

        this.music.mainTheme.loop().play();

        this.sound = {};
        this.sound.riddleEnd = new buzz.sound("sound/event_riddle_end.ogg");

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
                    if (exit[0] == j && exit[1] == i) {
                        // This is the exit, show a door on each face.
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.position.x = i * CUBE_SIZE;
                        mesh.position.z = (j+0.52) * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = 0;
                        this.scene.add( mesh );
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.position.x = i * CUBE_SIZE;
                        mesh.position.z = (j-0.52) * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = Math.PI;
                        this.scene.add( mesh );
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.position.x = (i-0.52) * CUBE_SIZE;
                        mesh.position.z = j * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = -Math.PI*0.5;
                        this.scene.add( mesh );
                        mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                        mesh.position.x = (i+0.52) * CUBE_SIZE;
                        mesh.position.z = j * CUBE_SIZE;
                        mesh.position.y = 0;
                        mesh.rotation.y = Math.PI*0.5;
                        this.scene.add( mesh );
                    }

                    mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_wall'] );
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    this.scene.add( mesh );
                }
                else
                {
                    // floor
                    //var mesh = this.resourceManager['mesh_floor'];
                    var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_floor'].clone() );
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    mesh.position.y = -CUBE_SIZE;
                    this.scene.add( mesh );

                    // roof
                    //var mesh = this.resourceManager['mesh_roof'];
                    mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_roof'] );
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    mesh.position.y = CUBE_SIZE;
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

                    // pnj
                    if(this.detectCrossroad(i * CUBE_SIZE, j * CUBE_SIZE, true)) {

                        var names = ["cerberus", "janus", "presentateur", "pythie", "sphynx"];
                        var sizes = [[60,120], [60,120], [60,120], [120,120], [120,120]];

                        var id = tools.getRandomInt(0,4);
                        var name = names[id];

                        var sprite;
                        sprite = new THREE.Sprite( this.resourceManager["mat_"+name+"_question"] );
                        sprite.position.set( i * CUBE_SIZE, -40, j * CUBE_SIZE );
                        sprite.scale.set( sizes[id][0], sizes[id][1], 1.0 ); // imageWidth, imageHeight
                        this.scene.add( sprite );

                        sprite = new THREE.Sprite( this.resourceManager["mat_"+name+0] );
                        sprite.name = "pnj";
                        sprite.position.set( i * CUBE_SIZE, -40, j * CUBE_SIZE );
                        sprite.scale.set( sizes[id][0], sizes[id][1], 1.0 ); // imageWidth, imageHeight
                        this.scene.add( sprite );
                    }
                }
            };
        };

        document.body.appendChild( this.renderer.domElement );

        this.animate();
    };

    Scene.prototype.findIntersections = function () {
        // find intersections

        var vector = new THREE.Vector3( this.controls.mouseNormX, this.controls.mouseNormY  , 1 );
        //console.log("mouse : "+this.controls.mouseNormX+', '+this.controls.mouseNormY);
        this.projector.unprojectVector( vector, this.camera );

        this.raycaster.set( this.camera.position, vector.sub( this.camera.position ).normalize() );

        var intersects = this.raycaster.intersectObjects( this.scene.children );

        if ( intersects.length > 0 ) {
            var i = 0;
            // skip sprites
            while(i < intersects.length && intersects[ i ].object instanceof THREE.Sprite)
            {
                ++i;
            }
            //console.log("nbintersects : " + intersects.length);
            //console.log(intersects[0].distance);

            // check cube type, exlude wall and roof
            if(intersects[ i ].object.position.y == -CUBE_SIZE) {

                // change selected cube, remove highligh on previous and set on new
                if ( this.INTERSECTED != intersects[ i ].object ) {

                    if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );

                    this.INTERSECTED = intersects[ i ].object;
                    this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
                    this.INTERSECTED.material.emissive.setHex( 0xff0000 );
                }

                // set target pos if we click
                if ((this.count >= 3 * this.nbStep) && (this.controls.mouseClick)) {
                    this.targetPosX = this.INTERSECTED.position.x;
                    this.targetPosZ = this.INTERSECTED.position.z;
                }
                else {
                    this.targetPosX = -5;
                    this.targetPosZ = -5;
                }
            }
        } else { //
            if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
            this.INTERSECTED = null;
        }
    };

    Scene.prototype.checkPosition = function() {
        // var savePosX = this.camera.position.x;
        var oldIndI = Math.round(this.camera.position.x / CUBE_SIZE);
        // var savePosZ = this.camera.position.z;
        var oldIndJ = Math.round(this.camera.position.z / CUBE_SIZE);

        var delta = this.clock.getDelta(),
        time = this.clock.getElapsedTime() * 5;
        this.controls.update(delta);

        var newIndI = Math.round(this.targetPosX / CUBE_SIZE);
        var newIndJ = Math.round(this.targetPosZ / CUBE_SIZE);

        if ((this.targetPosX != -5) && (this.targetPosY != -5)) {
            // clic detected
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
                while (this.controls.lon > 360) {
                    this.controls.lon -= 360;
                }
                while (this.controls.lon < 0) {
                    this.controls.lon += 360;
                }
                while (this.controls.lat > 360) {
                    this.controls.lat -= 360;
                }
                if (oldIndJ - newIndJ) {
                    // movement along Z axis
                    if (oldIndJ - newIndJ > 0){ // -Z axis
                        if (this.controls.lon < 90)
                            this.targetLon = -90;
                        else
                            this.targetLon = 270;
                    }else {                     // +Z axis
                        if (this.controls.lon < 270)
                            this.targetLon = 90;
                        else
                            this.targetLon = 450;
                    }
                }else if (oldIndI - newIndI) {
                    // movement along X axis
                    if (oldIndI - newIndI > 0){ // -X axis
                        this.targetLon = 180;
                    }else {                     // +X axis
                        if (this.controls.lon < 180)
                            this.targetLon = 0;
                        else
                            this.targetLon = 360;
                    }
                }
                this.stepLon = (this.targetLon - this.controls.lon) / this.nbStep;
                this.stepLat = (0 - this.controls.lat) / this.nbStep;
                this.stepTrX = (this.targetPosX - this.camera.position.x) / (2 * this.nbStep);
                this.stepTrZ = (this.targetPosZ - this.camera.position.z) / (2 * this.nbStep);
                if (Math.abs(this.stepLon) < 0.0001) {
                    this.count = this.nbStep;
                }else {
                    this.count = 0;
                }
            }
        }

        if (this.count < 3 * this.nbStep) {
            // update camera rotation
            if (this.count < this.nbStep){
                this.controls.lon += this.stepLon;
                this.controls.lat += this.stepLat;
            }else {
                // center the camera position in the next cell's center
                this.camera.position.x += this.stepTrX;
                this.camera.position.z += this.stepTrZ;
            }
            ++this.count;
        }
        if (this.count == (3 * this.nbStep)) {
            this.crossroadTested = false;
            while (this.controls.lon < 0  ) { this.controls.lon += 360; }
            while (this.controls.lon > 360) { this.controls.lon -= 360; }
            if(this.detectCrossroad(this.camera.position.x, this.camera.position.z)) {
                this.showRiddle();
            }else if(this.detectRoadTurn(this.camera.position.x, this.camera.position.z))
                this.roadTurnEvent();

            ++this.count;
        }
        this.camera.position.y = 0;

    };

    Scene.prototype.detectCrossroad = function (x , z, dotest = false) { // x, y abxolute world position
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);

        var nbAdjacentTile = 0;
        if (dotest || !this.crossroadTested) {
            this.crossroadTested = true;
            if (!this.level.map[currentIndI][currentIndJ + 1]) ++nbAdjacentTile;
            if (!this.level.map[currentIndI][currentIndJ - 1]) ++nbAdjacentTile;
            if (!this.level.map[currentIndI + 1][currentIndJ]) ++nbAdjacentTile;
            if (!this.level.map[currentIndI - 1][currentIndJ]) ++nbAdjacentTile;

            if (nbAdjacentTile > 2) {
                return true;
            }
            return false;
        }
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
    }

    Scene.prototype.roadTurnEvent = function () {
        // play some stressing music !!!
        this.music.eventStress.play();
    }

    Scene.prototype.showRiddle = function () {
        var self = this;

        // Start playing the riddle theme.
        this.music.riddleTheme.loop().play();
        this.music.mainTheme.stop();
        this.sound.riddleEnd.stop();

        var riddle = this.level.riddles.getRandomRiddle();
        this.pause = true;

        var riddleRenderer = new RiddleRenderer(
            riddle,
            // Success.
            function () {
                console.log('Success, Motherfucker.');
                var dir = self.getDirection(self.camera.position.x, self.camera.position.z, true);
                self.showHint(dir);
                self.stopRiddle();
            },
            // Failure.
            function () {
                console.log('You failed. Hard. ');
                var dir = self.getDirection(self.camera.position.x, self.camera.position.z, false);
                self.showHint(dir);
                self.stopRiddle();
            }
        );
        riddleRenderer.display();

        var stack = [];
        stack.push(this.level.objects.exit);
        this.computeDirectionTowardExit(stack, 0);
    };

    Scene.prototype.stopRiddle = function () {
        this.pause = false;
        this.music.mainTheme.loop().play();
        this.music.riddleTheme.stop();
        this.sound.riddleEnd.play();
    };

    Scene.prototype.showHint = function (hintDirectionAbs) {
        var currentIndI = Math.round(this.camera.position.x / CUBE_SIZE);
        var currentIndJ = Math.round(this.camera.position.z / CUBE_SIZE);
        var orient = [hintDirectionAbs[0] - currentIndI, hintDirectionAbs[1] - currentIndJ];
        var stringOrientGround;
        var stringOrientNPC;
        var targetCameraLon;
        if ((orient[0] == -1) && (orient[1] ==  0)) {
            targetCameraLon = 180;
            stringOrientGround = "down";
        }
        if ((orient[0] ==  1) && (orient[1] ==  0)) {
            targetCameraLon = 0;
            stringOrientGround = "up";
        }
        if ((orient[0] ==  0) && (orient[1] == -1)) {
            targetCameraLon = 270;
            stringOrientGround = "left";
        }
        if ((orient[0] ==  0) && (orient[1] ==  1)) {
            targetCameraLon = 90;
            stringOrientGround = "right";
        }
        if (targetCameraLon == this.controls.lon) stringOrientNPC = "up";
        if (Math.abs(targetCameraLon - this.controls.lon) == 180) stringOrientNPC = "down";
        if ((targetCameraLon - this.controls.lon ==  90) || (targetCameraLon - this.controls.lon == -270)) stringOrientNPC = "right";
        if ((targetCameraLon - this.controls.lon == -90) || (targetCameraLon - this.controls.lon ==  270)) stringOrientNPC = "left";

        // show hint GROUND :
        // arrow on the floor : tile at x = hintDirectionAbs[0], z = hintDirectionAbs[1]
        // arrow toward : "stringOrientGround" {top / down / left or right}

        //TODO : Popux' code !!! display the hinted texture on the floor !!! GOGOGO lasy man !!!!


        // show hint NPC :
        // arrow on the NPC's animation
        // arrow toward : "stringOrientNPC" {top / down / left or right}

        //TODO : Adrian's code !!! display the hinted texture on the NPC !!! GOGOGO lasy man !!!!
    };

    Scene.prototype.getDirection = function (x, z, answer) {
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        var hintDirectionAbs = [];
        hintDirectionAbs.push(currentIndI + this.arrayTowardExit[currentIndI][currentIndJ][0]);
        hintDirectionAbs.push(currentIndJ + this.arrayTowardExit[currentIndI][currentIndJ][1]);

        if (answer) {   // the correct answer was given
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

        this.checkPosition();

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
            if(obj.name == "pnj") {
                //obj.material = this.resourceManager["mat_cerberus"+Math.floor(this.animCounter/10)];
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
