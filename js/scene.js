define(['lib/three', 'lib/Octree', 'lib/FirstPersonControls', 'riddle_renderer', ],
function(three,      octree,        first_person_controls,     RiddleRenderer) {
    console.log(buzz);
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

        this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = CUBE_SIZE * this.level.objects.entrance[1];
        this.camera.position.y = 0;
        this.camera.position.z = CUBE_SIZE * this.level.objects.entrance[0];

        this.controls = new THREE.FirstPersonControls( this.camera );

        this.controls.lon = this.level.properties.startLon;
        this.controls.movementSpeed = 200;
        this.controls.lookSpeed = 5.0;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = false;

        this.clock = new THREE.Clock();

        this.scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
        this.scene.add( new THREE.AmbientLight( 0xffffff ) );

        this.renderer = new THREE.WebGLRenderer();
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

        // array with the direction toward the exit for every tile
        this.arrayTowardExit = [];
        for (var i=0; i<this.level.height; ++i) {
            var line = [];
            for (var j=0; j<this.level.width; ++j) {
                line.push([0,0]);
            }
            this.arrayTowardExit.push(line);
        }

        this.resourceManager = {};

        // sounds
        this.music = {};
        this.music.mainTheme = new buzz.sound("sound/main_theme.ogg");
        this.music.riddleTheme = new buzz.sound("sound/riddle_theme.ogg");

        this.music.mainTheme.loop().play();

        this.sound = {};
        this.sound.riddleEnd = new buzz.sound("sound/event_riddle_end.ogg");

        // build unitary cube
        this.resourceManager['cube'] = new THREE.CubeGeometry( CUBE_SIZE, CUBE_SIZE, CUBE_SIZE );

        // floor mesh
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        var texture1 = THREE.ImageUtils.loadTexture( "img/ground_1-1.png" );
        var material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
        texture1.anisotropy = maxAnisotropy;
        texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
        texture1.repeat.set( 1, 1 );
        this.resourceManager['mat_floor'] = material1;
        this.resourceManager['mesh_floor'] = new THREE.Mesh( this.resourceManager['cube'], material1 );

        // roof mesh
        var texture2 = THREE.ImageUtils.loadTexture( "img/roof_1-1.png" );
        var material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2 } );
        texture2.anisotropy = maxAnisotropy;
        texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
        texture2.repeat.set( 1, 1 );
        this.resourceManager['mat_roof'] = material2;
        this.resourceManager['mesh_roof'] = new THREE.Mesh( this.resourceManager['cube'], material2 );

        // wall mesh
        var texture3 = THREE.ImageUtils.loadTexture( "img/wall_1-1.png" );
        var material3 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture3 } );
        texture3.anisotropy = maxAnisotropy;
        texture3.wrapS = texture3.wrapT = THREE.RepeatWrapping;
        texture3.repeat.set( 1, 1 );
        this.resourceManager['mat_wall'] = material3;
        this.resourceManager['mesh_wall'] = new THREE.Mesh( this.resourceManager['cube'], material3 );

        var exit = this.level.objects.exit;

        for (var i = 0; i < this.level.height; ++i) {
            for (var j = 0; j < this.level.width; ++j) {
                // floor
                //var mesh = this.resourceManager['mesh_floor'];
                var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_floor'].clone() );
                mesh.position.x = i * CUBE_SIZE;
                mesh.position.z = j * CUBE_SIZE;
                mesh.position.y = -CUBE_SIZE;
                this.scene.add( mesh );

                // wall
                if (this.level.map[i][j]) {
                    // geometry = new THREE.CubeGeometry( CUBE_SIZE, CUBE_SIZE, CUBE_SIZE );
                    // material = new THREE.MeshBasicMaterial({
                    //     color: 0xff0000 + i * (255 / this.level.height) + j * (255/this.level.width) * 256,
                    //     wireframe: false
                    // });
                    //var mesh = this.resourceManager['mesh_wall'];
                    if (exit[0] == i && exit[1] == j) {
                        // This is the exit, show a door on each face.
                    }
                    var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_wall'].clone() );
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    this.scene.add( mesh );
                }

                // roof
                //var mesh = this.resourceManager['mesh_roof'];
                var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_roof'].clone() );
                mesh.position.x = i * CUBE_SIZE;
                mesh.position.z = j * CUBE_SIZE;
                mesh.position.y = CUBE_SIZE;
                this.scene.add( mesh );
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
            //console.log("nbintersects : " + intersects.length);
            //console.log(intersects[0].distance);

            // check cube type, exlude wall and roof
            if(intersects[ 0 ].object.position.y == -CUBE_SIZE) {

                // change selected cube, remove highligh on previous and set on new
                if ( this.INTERSECTED != intersects[ 0 ].object ) {

                    if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );

                    this.INTERSECTED = intersects[ 0 ].object;
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
    }

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
            this.detectCrossroad();
            ++this.count;
        }
        this.camera.position.y = 0;

    };

    Scene.prototype.detectCrossroad = function () {
        var currentIndI = Math.round(this.camera.position.x / 200.0);
        var currentIndJ = Math.round(this.camera.position.z / 200.0);

        var nbAdjacentTile = 0;
        if (!this.crossroadTested) {
            if (!this.level.map[currentIndI][currentIndJ + 1]) ++nbAdjacentTile;
            if (!this.level.map[currentIndI][currentIndJ - 1]) ++nbAdjacentTile;
            if (!this.level.map[currentIndI + 1][currentIndJ]) ++nbAdjacentTile;
            if (!this.level.map[currentIndI - 1][currentIndJ]) ++nbAdjacentTile;

            if (nbAdjacentTile > 2)
                this.showRiddle();
        }
        this.crossroadTested = true;
    };

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
                self.stopRiddle();
            },
            // Failure.
            function () {
                console.log('You failed. Hard. ');
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

    Scene.prototype.computeDirectionTowardExit = function (stack, depth) {
        // current tile
        var curItem = stack.pop();
        // the road from its (potential) neighbor go toward the current tile
        if ((curItem[0] > 0)
            && (this.arrayTowardExit[curItem[0] - 1][curItem[1]][0] == 0)
            && (this.arrayTowardExit[curItem[0] - 1][curItem[1]][1] == 0)
            && (!this.level.map[curItem[0] - 1][curItem[1]])) {
            // the tile in [x - 1][y] is a tile
            this.arrayTowardExit[curItem[0] - 1][curItem[1]][0] = 1;
            this.arrayTowardExit[curItem[0] - 1][curItem[1]][1] = 0;
            stack.push([curItem[0] - 1, curItem[1]]);

        }
        if ((curItem[0] < this.level.height - 1)
            && (this.arrayTowardExit[curItem[0] + 1][curItem[1]][0] == 0)
            && (this.arrayTowardExit[curItem[0] + 1][curItem[1]][1] == 0)
            && (!this.level.map[curItem[0] + 1][curItem[1]])) {
            // the tile in [x + 1][y] is a tile
            this.arrayTowardExit[curItem[0] + 1][curItem[1]][0] = -1;
            this.arrayTowardExit[curItem[0] + 1][curItem[1]][1] = 0;
            stack.push([curItem[0] + 1, curItem[1]]);
        }
        if ((curItem[1] > 0)
            && (this.arrayTowardExit[curItem[0]][curItem[1] - 1][0] == 0)
            && (this.arrayTowardExit[curItem[0]][curItem[1] - 1][1] == 0)
            && (!this.level.map[curItem[0]][curItem[1] - 1])) {
            // the tile in [x-1][y] is a tile
            this.arrayTowardExit[curItem[0]][curItem[1] - 1][0] = 0;
            this.arrayTowardExit[curItem[0]][curItem[1] - 1][1] = 1;
            stack.push([curItem[0], curItem[1] - 1]);
        }
        if ((curItem[1] < this.level.width - 1)
            && (this.arrayTowardExit[curItem[0]][curItem[1] + 1][0] == 0)
            && (this.arrayTowardExit[curItem[0]][curItem[1] + 1][1] == 0)
            && (!this.level.map[curItem[0]][curItem[1] + 1])) {
            // the tile in [x-1][y] is a tile
            this.arrayTowardExit[curItem[0]][curItem[1] + 1][0] = 0;
            this.arrayTowardExit[curItem[0]][curItem[1] + 1][1] = -1;
            stack.push([curItem[0], curItem[1] +1]);
        }
        if (stack.length != 0){
            this.computeDirectionTowardExit(stack, ++depth);
        }
    }

    Scene.prototype.animate = function () {
        requestAnimationFrame( this.animate.bind(this) );

        // In pause mode, do nothing but wait until the pause mode is stopped.
        if (this.pause) {
            return;
        }

        this.checkPosition();

        this.findIntersections();
        this.render();
    };

    Scene.prototype.render = function () {
        this.renderer.render( this.scene, this.camera );
    };

    return Scene;
});
